#!/usr/bin/env python3
"""Prepare PDF evidence, validate per-page LLM output, and merge reviewed pages."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
LANGS = ('la', 'la-ua', 'fr', 'fr-ua')
TEXTS = ROOT / 'public/meditations/text'
DEFAULT_WORK = ROOT / 'temp_docs/import'
MARKER = re.compile(r'\((\d+[a-z]?)\)')


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def pages(value):
    result = set()
    for part in value.split(','):
        ends = part.split('-')
        if len(ends) == 1:
            result.add(int(part))
        elif len(ends) == 2:
            start, end = map(int, ends)
            if end < start:
                raise argparse.ArgumentTypeError('Reversed page range')
            result.update(range(start, end + 1))
        else:
            raise argparse.ArgumentTypeError('Use 20-25 or 3,11,20-25')
    if not result or min(result) < 1:
        raise argparse.ArgumentTypeError('Page numbers must be positive')
    return sorted(result)


def task(work, number):
    return work / f'{number:03d}'


def prepare(args):
    source = args.pdf.resolve()
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    source_info = {'path': str(source), 'sha256': digest}
    mapping = read(args.map) if args.map else {}
    if not args.map and (args.anchor_page is None or args.anchor_pdf is None):
        raise ValueError('Supply --map OR both --anchor-page and --anchor-pdf')
    for number in args.pages:
        pair = mapping.get(str(number)) if args.map else [args.anchor_pdf + 2 * (number - args.anchor_page), args.anchor_pdf + 2 * (number - args.anchor_page) + 1]
        if not isinstance(pair, list) or len(pair) != 2 or any(type(x) is not int or x < 1 for x in pair):
            raise ValueError(f'{number}: mapping must contain two positive PDF indices')
        folder = task(args.work, number)
        manifest = {'pageNumber': number, 'pdfPages': pair, 'sourceSha256': digest, 'source': source_info}
        if (folder / 'input.json').exists() and read(folder / 'input.json') != manifest:
            raise ValueError(f'{folder}: existing task uses different source or mapping; use a new work directory')
        write(folder / 'input.json', manifest)
        for index in pair:
            output = folder / f'pdf-{index}'
            if not all((output / name).exists() for name in ('page.json', 'page.png')):
                subprocess.run(['swift', str(HERE / 'extract.swift'), str(source), str(index), str(output), '2'], check=True)
        # Snapshot representative layout conventions without shared writes by workers.
        examples = {}
        for language in LANGS:
            existing = read(TEXTS / f'{language}.json')['pages']
            examples[language] = [p for p in existing if p['pageNumber'] in (1, 2, 7, 12, 17, 19)]
        if not (folder / 'examples.json').exists():
            write(folder / 'examples.json', examples)
        print(f'{number}: prepared {folder}')


def validate(folder):
    errors = []
    try:
        expected = read(folder / 'input.json')
        result = read(folder / 'result.json')
    except (OSError, ValueError) as error:
        return [str(error)], None
    if not isinstance(result, dict):
        return ['Result must be an object'], None
    for key in ('pageNumber', 'sourceSha256', 'pdfPages'):
        if result.get(key) != expected[key]:
            errors.append(f'{key} differs from input.json')
    texts = result.get('texts', {})
    if not isinstance(texts, dict) or set(texts) != set(LANGS):
        return errors + ['texts must contain exactly all four language keys'], None
    review = result.get('review', {})
    unavailable = review.get('unavailableLanguages', {}) if isinstance(review, dict) else {}
    if not isinstance(unavailable, dict) or any(k not in LANGS[1:] or not isinstance(v, str) or not v.strip() for k, v in unavailable.items()):
        return errors + ['Invalid unavailableLanguages evidence'], None
    duplicates = review.get('duplicateMarkers', []) if isinstance(review, dict) else []
    if not isinstance(duplicates, list) or any(not isinstance(x, dict) or x.get('language') not in LANGS or not isinstance(x.get('marker'), str) or not isinstance(x.get('reason'), str) or not x['reason'].strip() for x in duplicates):
        return errors + ['Invalid duplicateMarkers evidence'], None
    allowed_duplicates = {(x['language'], x['marker']) for x in duplicates}
    marker_ids = {}
    body_count = 0
    for language in LANGS:
        page = texts[language]
        if page is None and language in unavailable:
            continue
        if language in unavailable:
            errors.append(f'{language}: unavailable source must use null text')
        if not isinstance(page, dict) or set(page) != {'pageNumber', 'paragraphs'} or page.get('pageNumber') != expected['pageNumber']:
            errors.append(f'{language}: invalid Page object')
            continue
        paragraphs = page['paragraphs']
        if not isinstance(paragraphs, list) or not paragraphs:
            errors.append(f'{language}: missing paragraphs')
            continue
        strings = []
        printed_end = 0
        for i, paragraph in enumerate(paragraphs):
            if not isinstance(paragraph, dict) or set(paragraph) - {'type', 'lines', 'startLine'} or ('type' in paragraph and paragraph['type'] not in ('h1', 'h2', 'h3')):
                errors.append(f'{language} paragraph {i}: invalid fields/type')
                continue
            lines = paragraph.get('lines')
            if not isinstance(lines, list) or not lines or any(not isinstance(s, str) or not s.strip() or '\n' in s for s in lines):
                errors.append(f'{language} paragraph {i}: invalid lines')
                continue
            if 'startLine' in paragraph:
                start = paragraph['startLine']
                if language != 'la' or type(start) is not int or start <= printed_end:
                    errors.append(f'{language} paragraph {i}: invalid/overlapping printed startLine')
                else:
                    printed_end = start - 1
            if 'type' not in paragraph or 'startLine' in paragraph:
                printed_end += len(lines)
            strings.extend(lines)
            if language == 'la' and 'type' not in paragraph:
                body_count += len(lines)
        text = '\n'.join(strings)
        if '\ufffd' in text or re.search(r'\(\d+[^\d\s)a-z][^)]*\)', text):
            errors.append(f'{language}: replacement character or non-normalized marker')
        ids = MARKER.findall(text)
        for marker in set(ids):
            if ids.count(marker) > 1 and (language, marker) not in allowed_duplicates:
                errors.append(f'{language}: repeated segment marker {marker} needs source evidence')
        marker_ids[language] = ids
    review = result.get('review')
    if not isinstance(review, dict):
        return errors + ['Missing review'], None
    if review.get('imagesInspected') is not True or review.get('paragraphsAndHeadingsChecked') is not True:
        errors.append('Visual review of images, paragraphs and headings required')
    if review.get('latinBodyLineCount') != body_count or not body_count:
        errors.append('Reviewed Latin body line count differs from output')
    if review.get('issues') != []:
        errors.append(f'Unresolved/missing issues list: {review.get("issues")}')
    exceptions = review.get('markerDifferences')
    if not isinstance(exceptions, list):
        errors.append('markerDifferences must be a list')
        exceptions = []
    allowed = set()
    for item in exceptions:
        if not isinstance(item, dict) or item.get('language') not in LANGS[1:] or not isinstance(item.get('reason'), str) or not item['reason'].strip():
            errors.append('Invalid marker difference explanation')
        else:
            allowed.add(item['language'])
    for language in LANGS[1:]:
        if language in unavailable:
            continue
        if marker_ids.get(language) != marker_ids.get('la') and language not in allowed:
            errors.append(f'{language}: marker sequence differs from Latin; reconcile with image or document source exception')
    return errors, result


def check(args):
    failed = False
    for number in args.pages:
        errors, _ = validate(task(args.work, number))
        print(f'{number}: ' + ('FAIL\n  ' + '\n  '.join(errors) if errors else 'PASS (structural checks; visual review is LLM-reported)'))
        failed |= bool(errors)
    return 1 if failed else 0


def merge(args):
    # Preflight the ENTIRE requested batch before changing any site file.
    results = []
    for number in args.pages:
        errors, result = validate(task(args.work, number))
        if errors:
            raise ValueError(f'{number}: ' + '; '.join(errors))
        results.append(result)
    staged = {}
    for language in getattr(args, 'languages', LANGS):
        path = TEXTS / f'{language}.json'
        data = read(path)
        by_number = {p['pageNumber']: p for p in data['pages']}
        if len(by_number) != len(data['pages']):
            raise ValueError(f'{path}: duplicate existing page numbers')
        for result in results:
            page = result['texts'][language]
            if page is None:
                continue
            number = page['pageNumber']
            if number in by_number and by_number[number] != page:
                raise ValueError(f'{language} {number} already exists with different content. Review separately; automatic replacement is disabled.')
            by_number[number] = page
        data['pages'] = [by_number[n] for n in sorted(by_number)]
        indent = re.search(r'\n( +)\"', path.read_text(encoding='utf-8'))
        staged[path] = json.dumps(data, ensure_ascii=False, indent=len(indent[1]) if indent else 2) + '\n'
    # Stage complete files before replacement; retries converge on the same pages.
    temporary = []
    try:
        for path, content in staged.items():
            if path.read_text(encoding='utf-8') == content:
                continue
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, delete=False) as out:
                out.write(content)
                temporary.append((Path(out.name), path))
        for source, destination in temporary:
            os.replace(source, destination)
    finally:
        for source, _ in temporary:
            source.unlink(missing_ok=True)
    print('Merged pages: ' + ', '.join(map(str, args.pages)) + '. Run npm run build to refresh docs/.')


def status(args):
    for language in LANGS:
        numbers = sorted(p['pageNumber'] for p in read(TEXTS / f'{language}.json')['pages'])
        missing = sorted(set(range(1, max(numbers, default=0) + 1)) - set(numbers))
        print(f'{language}: {len(numbers)} pages, max={max(numbers, default=0)}, holes={missing}')
    for manifest in sorted(args.work.glob('*/input.json')):
        errors, _ = validate(manifest.parent)
        print(f'{manifest.parent.name}: ' + ('pending/blocked' if errors else 'checked'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for command in ('prepare', 'check', 'merge', 'status'):
        p = sub.add_parser(command)
        p.add_argument('--work', type=Path, default=DEFAULT_WORK)
        if command != 'status':
            p.add_argument('--pages', type=pages, required=True)
        if command == 'merge':
            p.add_argument('--languages', nargs='+', choices=LANGS, default=list(LANGS), help='Limit merge to missing translations when originals already exist')
        if command == 'prepare':
            p.add_argument('--pdf', type=Path, required=True)
            p.add_argument('--map', type=Path, help='JSON object, e.g. {"20":[148,149]}')
            p.add_argument('--anchor-page', type=int)
            p.add_argument('--anchor-pdf', type=int, help='1-based PDF index for anchor reader page Latin/Ukrainian pair')
        p.set_defaults(run=globals()[command])
    args = parser.parse_args()
    try:
        return args.run(args) or 0
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
