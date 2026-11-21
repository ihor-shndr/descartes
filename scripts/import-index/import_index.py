#!/usr/bin/env python3
"""Import the book's index without flattening superscripts or discarding special blocks.

Run: uv run --with pymupdf==2.1 python scripts/import-index/import_index.py
"""
import argparse
import copy
import json
import re
import unicodedata
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
SECTION = re.compile(r'^(SC|PL\*?|SY|[IVX]+)\s*\[(\d+)\]')
ROMAN = str.maketrans({'І': 'I', 'і': 'i', 'С': 'C', 'Х': 'X', 'а': 'a', 'с': 'c'})


def normalize(value):
    return value.translate(ROMAN)


def extract_rows(source):
    rows = []
    with pymupdf.open(source) as document:
        for page_index, page in enumerate(document):
            # The only excluded text is the running page number, below the index body.
            spans = [s for b in page.get_text('dict')['blocks'] if b['type'] == 0
                     for line in b['lines'] for s in line['spans'] if s['origin'][1] < 655]
            baselines = sorted(set(round(s['origin'][1], 1) for s in spans if s['size'] >= 9))
            groups = {y: [] for y in baselines}
            for span in spans:
                y = min(baselines, key=lambda baseline: abs(baseline - span['origin'][1]))
                groups[y].append(span)
            for y, group in groups.items():
                group.sort(key=lambda s: s['origin'][0])
                tokens = []
                previous_end = None
                for span in group:
                    text = span['text'].replace('\t', ' ')
                    if (previous_end is not None and span['origin'][0] - previous_end > 3
                            and tokens and not tokens[-1]['text'].endswith(' ') and not text.startswith(' ')):
                        tokens.append({'text': ' '})
                    token = {'text': text}
                    if '-It' in span['font']:
                        token['italic'] = True
                    if 'Smbd' in span['font'] or 'Bold' in span['font']:
                        token['bold'] = True
                    if span['size'] < 9:
                        token['position'] = 'sup' if span['origin'][1] < y else 'sub'
                    tokens.append(token)
                    previous_end = span['bbox'][2]
                rows.append({'sourcePage': 383 + page_index, 'x': min(s['origin'][0] for s in group),
                             'spans': tokens})
    return rows


def plain(row, baseline_only=False):
    return ''.join(t['text'] for t in row['spans'] if not baseline_only or not t.get('position'))


def link_tokens(tokens, links):
    """Attach destinations to baseline characters, leaving every source character intact."""
    result = []
    offset = 0
    for token in tokens:
        if token.get('position'):
            result.append(copy.deepcopy(token))
            continue
        for char in token['text']:
            item = {**token, 'text': char}
            if offset in links:
                item['target'] = links[offset]
            if result and {k: v for k, v in result[-1].items() if k != 'text'} == {k: v for k, v in item.items() if k != 'text'}:
                result[-1]['text'] += char
            else:
                result.append(item)
            offset += 1
    return result


def parse_references(row, language, context):
    base = plain(row, True)
    normalized = normalize(base)
    section = SECTION.match(normalized.strip())
    if section:
        context['section'] = section.group(1)
        context['page'] = None
        context['occurrence'] = {'section': section.group(1), 'count': int(section.group(2)), 'pages': []}
        context['occurrences'].append(context['occurrence'])
        context['active'] = True
        start = base.index(']') + 1
    elif context.get('active') and row['x'] > 70 and re.match(r'^\s*[\d(;]', normalized):
        start = 0
    else:
        context['active'] = False
        return []
    links = {}
    refs = []
    if language == 'la':
        # On printed p. 385, a semicolon stands in for the colon in "70; ⁷".
        semicolon_page = r'|(?<=;)\s*(?P<semicolon_page>70)\s*;' if row['sourcePage'] == 385 else ''
        pattern = re.compile(r'(?P<page>\d+)\s*:' + semicolon_page + r'|(?P<line>tit|\d+)')
    else:
        # A page starts a reference group. The first fragment may follow on
        # the next printed row, and a TL/PN label can straddle font sizes.
        pattern = re.compile(
            r'(?:^\s*|(?<=[;\]])\s*|(?<=,)\s*(?=\d{2}))(?P<page>\d+\*?)\s*(?:[A-Z0-9]+\s*)?(?=\(|$)'
            r'|\((?P<segment>\d+[a-z]?\*?)\)'
        )
    for match in pattern.finditer(normalized, start):
        page = match.groupdict().get('page') or match.groupdict().get('semicolon_page')
        if page:
            context['page'] = int(page.rstrip('*'))
            continue
        if context.get('page') is None:
            raise ValueError(f"Reference without a page: {plain(row)}")
        if language == 'la':
            line = 0 if match['line'] == 'tit' else int(match['line'])
            target = {'page': context['page'], 'line': line}
            # Index p. 384 points to the start of (6a). Anima itself is on
            # the following printed row (book p. 116).
            if context['term'] == 'anima' and row['sourcePage'] == 384 and context['page'] == 1 and line == 7:
                line = 8
                target.update(line=line, printedLine=7, alignedSegment='6a')
            begin, end = match.span('line')
        else:
            segment = match['segment'].rstrip('*')
            target = {'page': context['page'], 'line': 0, 'segment': segment}
            begin, end = match.span('segment')
            line = 0
        for offset in range(begin, end):
            links[offset] = target
        occurrence = context['occurrence']
        if not occurrence['pages'] or occurrence['pages'][-1]['page'] != context['page']:
            occurrence['pages'].append({'page': context['page'], 'lines': []})
        ref = {'line': line}
        if language == 'fr':
            ref['segment'] = segment
        if language == 'la' and match['line'] == 'tit':
            ref['isTitle'] = True
        occurrence['pages'][-1]['lines'].append(ref)
        refs.append(target)
    row['spans'] = link_tokens(row['spans'], links)
    return refs


def import_index(source):
    rows = extract_rows(source)
    indexes = {'la': [], 'fr': []}
    introductions = {'la': [], 'fr': []}
    language = 'la'
    entry = None
    context = {'active': False}
    source_text = []
    for original in rows:
        row = copy.deepcopy(original)
        text = plain(row)
        source_text.append(text)
        if 'Французькі терміни' in text:
            language, entry = 'fr', None
            context = {'active': False}
        heading = (row['x'] < 62 and any(t.get('bold') for t in row['spans'])
                   and re.search(r'\[\d*\]', text))
        if heading:
            match = re.search(r'^(.*?)\s*\[(\d*)\]', text)
            term = match[1].strip()
            slug = re.sub(r'[^\w]+', '_', unicodedata.normalize('NFC', normalize(term))).strip('_')
            entry = {'id': f'{language}_{slug}', 'term': term, 'count': int(match[2]) if match[2] else None,
                     'sourcePage': row['sourcePage'], 'bookHeading': row['spans'], 'bookLines': [],
                     'occurrences': []}
            indexes[language].append(entry)
            context = {'active': False, 'occurrences': entry['occurrences'], 'term': term}
        else:
            if entry is not None:
                parse_references(row, language, context)
                row['indent'] = max(0, round(row['x'] - (59.5 if row['sourcePage'] % 2 == 0 else 48.2)))
                row.pop('x')
                entry['bookLines'].append(row)
            else:
                row.pop('x')
                introductions[language].append(row)
        # No text may disappear while adding structure or destinations.
        assert plain(row) == text
    for lang, entries in indexes.items():
        assert len({e['id'] for e in entries}) == len(entries)
        entries[0]['bookIntroduction'] = introductions[lang]
    output_text = []
    for lang in ['la', 'fr']:
        for row in introductions[lang]:
            output_text.append(plain(row))
        for e in indexes[lang]:
            output_text.append(''.join(t['text'] for t in e['bookHeading']))
            output_text.extend(plain(row) for row in e['bookLines'])
    # Introductory notes can occur between entries; compare coverage without reordering prose.
    assert sorted(source_text) == sorted(output_text), 'Source rows omitted or duplicated'
    return indexes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'public/original-index.pdf')
    parser.add_argument('--output', type=Path, default=ROOT / 'public/meditations/index')
    parser.add_argument('--check', action='store_true', help='Compare regenerated data without writing')
    args = parser.parse_args()
    indexes = import_index(args.source)
    for lang, entries in indexes.items():
        path = args.output / f'{lang}.json'
        encoded = json.dumps(entries, ensure_ascii=False, indent=2) + '\n'
        if args.check:
            assert path.read_text() == encoded, f'{path} differs from source import'
        else:
            args.output.mkdir(parents=True, exist_ok=True)
            path.write_text(encoded)
        refs = sum(len(p['lines']) for e in entries for s in e['occurrences'] for p in s['pages'])
        print(f'{lang}: {len(entries)} articles, {refs} references; source rows preserved')


if __name__ == '__main__':
    main()
