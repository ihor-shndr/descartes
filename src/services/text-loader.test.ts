import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { loadIndexData } from './text-loader';
import {
  INDEX_GRAPH_VERSION,
  IndexData,
  IndexEdgeType,
  IndexLanguage,
  IndexNodeType,
  IndexNoteKind,
  MappingResolution,
} from '../types/termIndex';
import { getLocationTermIds, getSubentries, getSubentryUsages, getTermCount, getTerms } from '../utils/index-graph';

const emptyGraph: IndexData = {
  version: INDEX_GRAPH_VERSION,
  languages: [IndexLanguage.Latin, IndexLanguage.French],
  sources: [],
  nodes: [],
  edges: [],
  notes: {
    [IndexLanguage.Latin]: [],
    [IndexLanguage.French]: [],
  },
};

const term = {
  id: 'term:la:anima',
  type: IndexNodeType.Term,
  language: IndexLanguage.Latin,
  lemma: 'anima',
};

test('loads the existing graph without changing counts or GT location lookup', async context => {
  const json = readFileSync(new URL('../../public/meditations/index/graph.json', import.meta.url), 'utf8');
  context.mock.method(globalThis, 'fetch', async () => new Response(json));

  const graph = await loadIndexData();
  const anima = getTerms(graph, IndexLanguage.Latin).find(term => term.lemma === 'anima');
  const apercevoir = getTerms(graph, IndexLanguage.French).find(term => term.lemma === 'apercevoir');
  assert.ok(anima);
  assert.ok(apercevoir);
  assert.equal(getTermCount(graph, anima.id), 11);
  assert.equal(getTermCount(graph, apercevoir.id), 15);

  const subentries = getSubentries(graph, apercevoir.id);
  assert.equal(subentries.length, 1);
  assert.equal(getSubentryUsages(graph, subentries[0].id).length, 1);
  assert.ok(getLocationTermIds(graph, IndexLanguage.French, 31, '22').includes(apercevoir.id));
});

test('rejects unknown graph discriminators and malformed typed fields', async context => {
  const invalidGraphs = [
    { ...emptyGraph, nodes: [{ ...term, type: 'unknown-node' }] },
    { ...emptyGraph, nodes: [{ ...term, language: 'unknown-language' }] },
    {
      ...emptyGraph,
      nodes: [{
        id: 'mapping',
        type: IndexNodeType.Mapping,
        sourceId: term.id,
        resolution: 'prounoun',
      }],
    },
    {
      ...emptyGraph,
      nodes: [{
        id: 'usage',
        type: IndexNodeType.Usage,
        tokenCount: '2',
        isTitle: false,
      }],
    },
    {
      ...emptyGraph,
      nodes: [{
        id: 'usage',
        type: IndexNodeType.Usage,
        tokenCount: 1,
        reportedTokenCount: 0,
        isTitle: false,
      }],
    },
    {
      ...emptyGraph,
      nodes: [{
        id: 'usage',
        type: IndexNodeType.Usage,
        tokenCount: 1,
        segmentHasAsterisk: 'yes',
        isTitle: false,
      }],
    },
    {
      ...emptyGraph,
      edges: [{
        source: term.id,
        target: term.id,
        type: IndexEdgeType.UsesMapping,
        markerPosition: 'befor',
      }],
    },
    { ...emptyGraph, notes: { [IndexLanguage.Latin]: [], [IndexLanguage.French]: [{ kind: IndexNoteKind.Heading }] } },
    { ...emptyGraph, notes: { [IndexLanguage.Latin]: [], [IndexLanguage.French]: [{ kind: IndexNoteKind.Footnote, text: 'Note', number: 0 }] } },
    { ...emptyGraph, version: INDEX_GRAPH_VERSION + 1 },
  ];

  let responseGraph = invalidGraphs[0];
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(responseGraph)));
  for (const invalidGraph of invalidGraphs) {
    responseGraph = invalidGraph;
    await assert.rejects(loadIndexData, /Invalid term index graph/);
  }
});

test('rejects duplicate IDs, dangling edges, and invalid relationships', async context => {
  let responseGraph: IndexData = { ...emptyGraph, nodes: [term, term] };
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(responseGraph)));
  await assert.rejects(loadIndexData, /duplicate node id/);

  responseGraph = {
    ...emptyGraph,
    nodes: [term, {
      id: 'mapping',
      type: IndexNodeType.Mapping,
      sourceId: term.id,
      resolution: MappingResolution.Lexical,
    }],
    edges: [{ source: term.id, target: 'missing', type: IndexEdgeType.HasMapping }],
  };
  await assert.rejects(loadIndexData, /dangling edge/);

  responseGraph = {
    ...emptyGraph,
    nodes: [term],
    edges: [{ source: term.id, target: term.id, type: IndexEdgeType.CountByNotation }],
  };
  await assert.rejects(loadIndexData, /invalid count_by_notation edge/);

  responseGraph = {
    ...emptyGraph,
    nodes: [term, {
      id: 'usage',
      type: IndexNodeType.Usage,
      tokenCount: 1,
      isTitle: false,
    }],
    edges: [{ source: 'usage', target: term.id, type: IndexEdgeType.SourceTerm }],
  };
  await assert.rejects(loadIndexData, /requires one location, section, and owner/);

  responseGraph = {
    ...emptyGraph,
    nodes: [term],
    notes: {
      [IndexLanguage.Latin]: [],
      [IndexLanguage.French]: [{
        kind: IndexNoteKind.Footnote,
        number: 2,
        termId: term.id,
        text: 'Note',
      }],
    },
  };
  await assert.rejects(loadIndexData, /footnote 2 references an invalid fr term/);
});
