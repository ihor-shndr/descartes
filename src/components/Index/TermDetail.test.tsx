import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { TermDetail } from './TermDetail';
import {
  INDEX_GRAPH_VERSION,
  IndexData,
  IndexEdgeType,
  IndexLanguage,
  IndexNodeType,
  IndexNoteKind,
  IndexSourceLanguage,
  NotationCode,
  SectionCode,
  SourceTermNode,
} from '../../types/termIndex';
import {
  getLocationTermIds,
  getMappingNotations,
  getMappingTargets,
  getMappingUseCount,
  getMappings,
  getSubentries,
  getSubentryUsages,
  getTermCount,
  getTerms,
  getUsageMappings,
  getUsages,
} from '../../utils/index-graph';

const graph: IndexData = JSON.parse(readFileSync(new URL('../../../public/meditations/index/graph.json', import.meta.url), 'utf8'));

function findTerm(language: IndexSourceLanguage, lemma: string): SourceTermNode {
  const term = getTerms(graph, language).find(candidate => candidate.lemma === lemma);
  assert.ok(term, `Missing term ${lemma}`);
  return term;
}

function renderTerm(language: IndexSourceLanguage, lemma: string): string {
  return renderToStaticMarkup(<TermDetail graph={graph} term={findTerm(language, lemma)} />);
}

test('renders the printed Latin line but navigates to the actual line, with multiplicity as a subscript', () => {
  const term: SourceTermNode = {
    id: 'term',
    type: IndexNodeType.Term,
    language: IndexLanguage.Latin,
    lemma: 'anima',
  };

  for (const tokenCount of [1, 2, 3]) {
    const fixture: IndexData = {
      version: INDEX_GRAPH_VERSION,
      languages: [IndexLanguage.Latin, IndexLanguage.French],
      sources: [],
      nodes: [
        term,
        { id: 'usage', type: IndexNodeType.Usage, tokenCount, isTitle: false, printedLine: 7 },
        { id: 'location', type: IndexNodeType.Location, language: IndexLanguage.Latin, page: 1, line: 8 },
        { id: 'section', type: IndexNodeType.Section, code: SectionCode.I },
      ],
      edges: [
        { source: 'usage', target: term.id, type: IndexEdgeType.SourceTerm },
        { source: 'usage', target: 'location', type: IndexEdgeType.AtLocation },
        { source: 'usage', target: 'section', type: IndexEdgeType.BelongsToSection },
      ],
      notes: { [IndexLanguage.Latin]: [], [IndexLanguage.French]: [] },
    };

    const html = renderToStaticMarkup(<TermDetail graph={fixture} term={term} />);
    assert.match(html, /<span>1: <\/span>/);
    assert.match(html, /рядок 8 \(у друкованому покажчику: рядок 7\)/);
    assert.match(html, />7<\/button>/);
    if (tokenCount === 1) assert.doesNotMatch(html, /<sub>x\d+<\/sub>/);
    else assert.match(html, new RegExp(`>7</button><sub>x${tokenCount}</sub>`));
  }
});

test('preserves stars, title references, and the source multiplicity while counting actual occurrences', () => {
  const anima = renderTerm(IndexLanguage.Latin, 'anima');
  const pensee = renderTerm(IndexLanguage.French, 'pensée');
  const concevoir = renderTerm(IndexLanguage.French, 'concevoir');

  assert.match(anima, /<span>17: <\/span>.*?>tit<\/button>/);
  assert.match(pensee, />\(30a\*\)<\/button>/);
  assert.match(pensee, />\(31\*\)<\/button>/);
  assert.match(pensee, /<span>69\* <\/span>/);
  assert.doesNotMatch(pensee, />tit<\/button>/);
  assert.match(concevoir, /<strong>concevoir<\/strong> \[115\]/);
  assert.match(concevoir, /<em>SY<\/em> \[9\]/);
  assert.match(concevoir, />\(10\)<\/button><sub>x10<\/sub>/);
  assert.match(concevoir, />\(30\*\)<\/button>/);

  const usage = getUsages(graph, findTerm(IndexLanguage.French, 'concevoir').id)
    .find(reference => reference.location.page === 13 && reference.location.segment === '10');
  assert.equal(usage?.usage.tokenCount, 2);
  assert.equal(usage?.usage.reportedTokenCount, 10);
});

test('indents translation lines and wrapped references for both index languages', () => {
  for (const [language, lemma, translatedLanguage] of [
    [IndexLanguage.French, 'concevoir', IndexLanguage.Latin],
    [IndexLanguage.Latin, 'anima', IndexLanguage.French],
  ] as const) {
    const html = renderTerm(language, lemma);
    for (const target of [translatedLanguage, IndexLanguage.Ukrainian]) {
      assert.match(html, new RegExp(`<div lang="${target}" class="pl-\\[3\\.25rem\\] -indent-7">`));
    }
    assert.match(html, /<div class="pl-9 -indent-9"><span><em>/);
  }

  const concevoir = renderTerm(IndexLanguage.French, 'concevoir');
  assert.match(concevoir, /<div lang="la" class="pl-6 -indent-4">/);
  assert.match(concevoir, /<div lang="uk" class="pl-6 -indent-4">/);
});

test('counts and renders numbered GT subentries independently of their parent', () => {
  const examples = [
    { lemma: 'concevoir', total: 115, phrases: ['concevoir par la pensée', 'ci-devant conçue', 'd’entendre ou de concevoir'] },
    { lemma: 'conception', total: 7, phrases: ['la pure intellection ou conception', 'l’intellection ou conception pure'] },
    { lemma: 'entendre', total: 16, phrases: ['sont comprises et entendues', 'qui ...  entends et conçois', 'd’entendre ou de concevoir'] },
  ];

  for (const example of examples) {
    const term = findTerm(IndexLanguage.French, example.lemma);
    const subentries = getSubentries(graph, term.id);
    const html = renderTerm(IndexLanguage.French, example.lemma);
    assert.equal(getTermCount(graph, term.id), example.total);
    assert.deepEqual(subentries.map(subentry => subentry.phrase), example.phrases);
    for (const [index, subentry] of subentries.entries()) {
      assert.equal(subentry.number, index + 1);
      assert.equal(getSubentryUsages(graph, subentry.id).length, 1);
      assert.ok(html.includes(`GT${index + 1} [1]`));
      const usageId = getSubentryUsages(graph, subentry.id)[0].usage.id;
      assert.ok(!getUsages(graph, term.id).some(reference => reference.usage.id === usageId));
    }
  }

  assert.ok(getLocationTermIds(graph, IndexLanguage.French, 34, '4')
    .includes(findTerm(IndexLanguage.French, 'concevoir').id));
});

test('restores Ukrainian mappings and separates different equivalents with the same printed rank', () => {
  const pensee = findTerm(IndexLanguage.French, 'pensée');
  const mappings = getMappings(graph, pensee.id)
    .filter(mapping => mapping.targetLanguage === IndexLanguage.Ukrainian);
  assert.deepEqual(mappings.map(mapping => getMappingTargets(graph, mapping.id)[0].lemma), ['думка', 'мислення', 'подумки']);
  assert.deepEqual(mappings.map(mapping => getMappingUseCount(graph, mapping.id)), [35, 16, 1]);

  const conception = renderTerm(IndexLanguage.French, 'conception');
  assert.match(conception, /<span>perceptio<\/span><sup>3<\/sup> \[2\]/);
  assert.match(conception, /<span>comprehensio<\/span><sup>3<\/sup> \[1\]/);
  assert.match(conception, /<span>збагання<\/span><sup>II<\/sup> \[1\]/);
  const conceptionTerm = findTerm(IndexLanguage.French, 'conception');
  const reference = getUsages(graph, conceptionTerm.id).find(item => item.location.page === 31);
  assert.ok(reference);
  const targets = getUsageMappings(graph, reference.usage.id)
    .flatMap(({ mapping }) => getMappingTargets(graph, mapping.id).map(target => target.lemma));
  assert.deepEqual(targets.sort(), ['comprehensio', 'збагання'].sort());

  const intellectus = renderTerm(IndexLanguage.Latin, 'intellectus');
  assert.match(intellectus, /<span>esprit<\/span><sup>4<\/sup> \[3\]/);
  assert.match(intellectus, /<span>je<\/span><sup>4<\/sup> \[1\]/);
  assert.match(renderTerm(IndexLanguage.French, 'esprit'), /ум<\/span> \[97 \+ 22TL\]/);
});

test('preserves printed French fragments while using verified reader destinations', () => {
  for (const [lemma, page, printedSegment, actualSegment] of [
    ['esprit', 24, '22a', '22'],
    ['esprit', 25, '3a', '3'],
    ['concevoir', 30, '29a', '30a'],
  ] as const) {
    const term = findTerm(IndexLanguage.French, lemma);
    const reference = getUsages(graph, term.id).find(item =>
      item.location.page === page && item.usage.printedSegment === printedSegment,
    );
    assert.equal(reference?.location.segment, actualSegment);
    assert.ok(getLocationTermIds(graph, IndexLanguage.French, page, actualSegment).includes(term.id));
    const html = renderTerm(IndexLanguage.French, lemma);
    assert.ok(html.includes(`фрагмент ${actualSegment} (у друкованому покажчику: фрагмент ${printedSegment})`));
    assert.ok(html.includes(`>(${printedSegment})</button>`));
  }
});

test('links the French heading footnotes to their shared editorial explanations', () => {
  for (const [lemma, number] of [['comprendre (être comprise)', 2], ['concevoir', 3]] as const) {
    const term = findTerm(IndexLanguage.French, lemma);
    const note = graph.notes[IndexLanguage.French].find(candidate =>
      candidate.kind === IndexNoteKind.Footnote && candidate.termId === term.id,
    );
    assert.ok(note && note.kind === IndexNoteKind.Footnote);
    assert.equal(note.number, number);
    assert.match(note.text, new RegExp(`значення дієслова ${lemma.split(' ')[0]}`));
    assert.match(renderTerm(IndexLanguage.French, lemma), new RegExp(`<sup title="[^"]+">${number}</sup>`));
  }
});

test('recovers source references omitted or misread by the original import', () => {
  const intelligere = findTerm(IndexLanguage.Latin, 'intelligere');
  const percipere = findTerm(IndexLanguage.Latin, 'percipere');

  assert.equal(getTermCount(graph, intelligere.id), 83);
  for (const [term, page, line] of [
    [intelligere, 82, 14],
    [percipere, 28, 19],
    [percipere, 51, 23],
  ] as const) {
    assert.ok(getUsages(graph, term.id).some(reference =>
      reference.location.page === page && reference.location.line === line,
    ));
    assert.ok(getLocationTermIds(graph, IndexLanguage.Latin, page, line).includes(term.id));
  }
  assert.ok(!getUsages(graph, percipere.id).some(reference =>
    reference.location.page === 26 && (reference.location.line === 19 || reference.location.line === 28),
  ));
  assert.match(renderTerm(IndexLanguage.Latin, 'percipere'), /<em>II<\/em> \[10\]/);
  assert.match(renderTerm(IndexLanguage.Latin, 'percipere'), /<em>III<\/em> \[17\]/);
});

test('retains printed pages while linking to verified locations', () => {
  for (const [language, lemma, actualPage, actualLineOrSegment, printedPage] of [
    [IndexLanguage.Latin, 'intelligere', 14, 12, 4],
    [IndexLanguage.French, 'évidence', 63, '25', 53],
  ] as const) {
    const term = findTerm(language, lemma);
    const reference = getUsages(graph, term.id).find(item =>
      item.location.page === actualPage && item.usage.printedPage === printedPage,
    );
    assert.ok(reference);
    assert.equal(reference.location.line ?? reference.location.segment, actualLineOrSegment);
    assert.ok(getLocationTermIds(graph, language, actualPage, actualLineOrSegment).includes(term.id));
    const html = renderTerm(language, lemma);
    assert.ok(html.includes(`Сторінка ${actualPage}`));
    assert.ok(html.includes(`у друкованому покажчику: сторінка ${printedPage}`));
  }
});

test('uses aligned texts when the printed equivalent marker is missing or incorrect', () => {
  for (const [language, lemma, page, lineOrSegment, target] of [
    [IndexLanguage.French, 'âme', 26, '7', 'anima'],
    [IndexLanguage.French, 'âme', 26, '8', 'anima'],
    [IndexLanguage.French, 'âme', 27, '2', 'anima'],
    [IndexLanguage.Latin, 'comprehensio', 80, 6, 'perception'],
    [IndexLanguage.French, 'esprit', 75, '28', 'intellectus'],
    [IndexLanguage.French, 'intelligence', 79, '4a', 'intellectio'],
  ] as const) {
    const term = findTerm(language, lemma);
    const reference = getUsages(graph, term.id).find(item =>
      item.location.page === page && (item.location.line ?? item.location.segment) === lineOrSegment,
    );
    assert.ok(reference);
    const targets = getUsageMappings(graph, reference.usage.id)
      .flatMap(({ mapping }) => getMappingTargets(graph, mapping.id).map(item => item.lemma));
    assert.ok(targets.includes(target), `${lemma} ${page}:${lineOrSegment} should map to ${target}`);
  }

  const animus = findTerm(IndexLanguage.Latin, 'animus');
  const missingTranslation = getUsages(graph, animus.id).find(reference =>
    reference.location.page === 27 && reference.location.line === 14,
  );
  assert.ok(missingTranslation);
  assert.ok(getUsageMappings(graph, missingTranslation.usage.id)
    .some(({ mapping }) => getMappingNotations(graph, mapping.id).includes(NotationCode.TL)));
});
