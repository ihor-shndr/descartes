import { TextData } from '../types/text';
import {
  CountDisplay,
  INDEX_GRAPH_VERSION,
  IndexData,
  IndexEdge,
  IndexEdgeType,
  IndexLanguage,
  IndexNode,
  IndexNodeType,
  IndexNote,
  IndexNoteKind,
  IndexSourceLanguage,
  MappingResolution,
  MarkerPosition,
  NotationCode,
  SectionCode,
  SubentryCode,
  UsageKind,
} from '../types/termIndex';
import { AVAILABLE_LANGUAGES, INDEX_GRAPH_PATH, LanguageCode } from '../constants/languages';

const EDGE_ENDPOINTS: Record<IndexEdgeType, { source: readonly IndexNodeType[]; target: readonly IndexNodeType[] }> = {
  [IndexEdgeType.SourceTerm]: { source: [IndexNodeType.Usage], target: [IndexNodeType.Term] },
  [IndexEdgeType.AtLocation]: { source: [IndexNodeType.Usage], target: [IndexNodeType.Location] },
  [IndexEdgeType.BelongsToSection]: { source: [IndexNodeType.Usage], target: [IndexNodeType.Section] },
  [IndexEdgeType.UsesMapping]: { source: [IndexNodeType.Usage], target: [IndexNodeType.Mapping] },
  [IndexEdgeType.HasMapping]: { source: [IndexNodeType.Term, IndexNodeType.Subentry], target: [IndexNodeType.Mapping] },
  [IndexEdgeType.MapsToTerm]: { source: [IndexNodeType.Mapping], target: [IndexNodeType.Term] },
  [IndexEdgeType.MapsToNotation]: { source: [IndexNodeType.Mapping], target: [IndexNodeType.Notation] },
  [IndexEdgeType.CountByNotation]: { source: [IndexNodeType.Mapping], target: [IndexNodeType.Notation] },
  [IndexEdgeType.SubentryUsage]: { source: [IndexNodeType.Subentry], target: [IndexNodeType.Usage] },
  [IndexEdgeType.SubentryOf]: { source: [IndexNodeType.Subentry], target: [IndexNodeType.Term] },
};

/**
 * Load all language text files
 */
export async function loadAllTexts(): Promise<Record<LanguageCode, TextData>> {
  const results: Partial<Record<LanguageCode, TextData>> = {};

  await Promise.all(
    AVAILABLE_LANGUAGES.map(async ({ code, textPath }) => {
      try {
        const response = await fetch(textPath);
        if (!response.ok) {
          throw new Error(`Failed to load ${code}: ${response.statusText}`);
        }
        results[code] = await response.json();
      } catch (error) {
        console.error(`Error loading ${code}:`, error);
      }
    })
  );

  return results as Record<LanguageCode, TextData>;
}

export async function loadIndexData(): Promise<IndexData> {
  const response = await fetch(INDEX_GRAPH_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load term index graph: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error('Invalid term index graph: expected nodes and edges arrays');
  }

  if (!isIndexGraph(data)) {
    throw new Error(`Invalid term index graph: expected schema version ${INDEX_GRAPH_VERSION} with valid node, edge, language, and note fields`);
  }

  const nodesById = new Map<string, IndexNode>();
  const outgoing = new Map<string, IndexEdge[]>();
  const incoming = new Map<string, IndexEdge[]>();

  for (const node of data.nodes) {
    if (nodesById.has(node.id)) {
      throw new Error(`Invalid term index graph: duplicate node id "${node.id}"`);
    }
    nodesById.set(node.id, node);
  }

  for (const language of [IndexLanguage.Latin, IndexLanguage.French] as const) {
    for (const note of data.notes[language]) {
      if (note.kind !== IndexNoteKind.Footnote || note.termId === undefined) continue;
      const term = nodesById.get(note.termId);
      if (term?.type !== IndexNodeType.Term || term.language !== language) {
        throw new Error(`Invalid term index graph: footnote ${note.number} references an invalid ${language} term "${note.termId}"`);
      }
    }
  }

  for (const edge of data.edges) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      throw new Error(`Invalid term index graph: dangling edge "${edge.source}" -> "${edge.target}"`);
    }
    const endpoints = EDGE_ENDPOINTS[edge.type];
    if (!endpoints.source.includes(source.type) || !endpoints.target.includes(target.type)) {
      throw new Error(`Invalid term index graph: invalid ${edge.type} edge "${edge.source}" -> "${edge.target}"`);
    }
    const sourceEdges = outgoing.get(edge.source);
    if (sourceEdges) sourceEdges.push(edge);
    else outgoing.set(edge.source, [edge]);
    const targetEdges = incoming.get(edge.target);
    if (targetEdges) targetEdges.push(edge);
    else incoming.set(edge.target, [edge]);
  }

  for (const node of data.nodes) {
    if (node.type === IndexNodeType.Usage) {
      const links = outgoing.get(node.id) ?? [];
      const locations = links.filter(edge => edge.type === IndexEdgeType.AtLocation);
      const sections = links.filter(edge => edge.type === IndexEdgeType.BelongsToSection);
      const owners = [
        ...links.filter(edge => edge.type === IndexEdgeType.SourceTerm).map(edge => edge.target),
        ...(incoming.get(node.id) ?? []).filter(edge => edge.type === IndexEdgeType.SubentryUsage).map(edge => edge.source),
      ];
      if (locations.length !== 1 || sections.length !== 1 || owners.length !== 1) {
        throw new Error(`Invalid term index graph: usage "${node.id}" requires one location, section, and owner`);
      }
      for (const edge of links.filter(candidate => candidate.type === IndexEdgeType.UsesMapping)) {
        const mapping = nodesById.get(edge.target);
        if (mapping?.type !== IndexNodeType.Mapping || mapping.sourceId !== owners[0]) {
          throw new Error(`Invalid term index graph: mapping "${edge.target}" belongs to a different source`);
        }
      }
    } else if (node.type === IndexNodeType.Mapping) {
      const owners = (incoming.get(node.id) ?? []).filter(edge => edge.type === IndexEdgeType.HasMapping);
      if (owners.length !== 1 || owners[0].source !== node.sourceId) {
        throw new Error(`Invalid term index graph: mapping "${node.id}" requires its declared source`);
      }
    } else if (node.type === IndexNodeType.Subentry) {
      const parents = (outgoing.get(node.id) ?? []).filter(edge => edge.type === IndexEdgeType.SubentryOf);
      if (parents.length !== 1 || parents[0].target !== node.parentTermId) {
        throw new Error(`Invalid term index graph: subentry "${node.id}" requires its declared parent`);
      }
    }
  }

  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return isNumber(value) && Number.isSafeInteger(value) && value > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isMember<T extends string>(value: unknown, members: Readonly<Record<string, T>>): value is T {
  return Object.values(members).some(member => member === value);
}

function isOptional(value: unknown, guard: (value: unknown) => boolean): boolean {
  return value === undefined || guard(value);
}

function isSourceLanguage(value: unknown): value is IndexSourceLanguage {
  return isMember(value, IndexLanguage) && value !== IndexLanguage.Ukrainian;
}

function isIndexNode(value: unknown): value is IndexNode {
  if (!isRecord(value) || !isString(value.id) || !isMember(value.type, IndexNodeType) ||
    !isOptional(value.countDisplay, value => isMember(value, CountDisplay)) ||
    !isOptional(value.order, isNumber)) {
    return false;
  }

  switch (value.type) {
    case IndexNodeType.Term:
      return isMember(value.language, IndexLanguage) && isString(value.lemma);
    case IndexNodeType.Subentry:
      return isString(value.parentTermId) && isMember(value.code, SubentryCode) &&
        isOptional(value.number, isPositiveInteger) && isString(value.phrase);
    case IndexNodeType.Mapping:
      return isString(value.sourceId) && isMember(value.resolution, MappingResolution) &&
        isOptional(value.targetLanguage, value => isMember(value, IndexLanguage)) &&
        isOptional(value.targetTermId, isString) && isOptional(value.notationId, isString) &&
        isOptional(value.rank, isNumber) && isOptional(value.rankIsExplicit, isBoolean);
    case IndexNodeType.Usage:
      return isPositiveInteger(value.tokenCount) && isOptional(value.reportedTokenCount, isPositiveInteger) &&
        isBoolean(value.isTitle) && isOptional(value.segmentHasAsterisk, isBoolean) &&
        isOptional(value.pageHasAsterisk, isBoolean) &&
        isOptional(value.isElliptical, isBoolean) && isOptional(value.printedLine, isNumber) &&
        isOptional(value.printedLineSuffix, isString) && isOptional(value.printedPage, isPositiveInteger) &&
        isOptional(value.printedSegment, isString) &&
        isOptional(value.alignedSegment, isString);
    case IndexNodeType.Location:
      return isNumber(value.page) && (
        (value.language === IndexLanguage.Latin && isNumber(value.line) && value.segment === undefined) ||
        (value.language === IndexLanguage.French && isString(value.segment) && value.line === undefined)
      );
    case IndexNodeType.Section:
      return isMember(value.code, SectionCode);
    case IndexNodeType.Notation:
      return isMember(value.code, NotationCode);
  }
}

function isIndexEdge(value: unknown): value is IndexEdge {
  return isRecord(value) && isString(value.source) && isString(value.target) &&
    isMember(value.type, IndexEdgeType) &&
    isOptional(value.usageKind, value => isMember(value, UsageKind)) &&
    isOptional(value.markerText, isString) &&
    isOptional(value.markerPosition, value => isMember(value, MarkerPosition));
}

function isIndexNote(value: unknown): value is IndexNote {
  if (!isRecord(value) || !isMember(value.kind, IndexNoteKind) || !isString(value.text)) return false;
  if (value.kind === IndexNoteKind.Heading) return isOptional(value.footnoteNumber, isPositiveInteger);
  if (value.kind === IndexNoteKind.Footnote) {
    return isPositiveInteger(value.number) && isOptional(value.termId, isString);
  }
  return true;
}

function isIndexGraph(value: unknown): value is IndexData {
  if (!isRecord(value) || value.version !== INDEX_GRAPH_VERSION ||
    !Array.isArray(value.nodes) || !value.nodes.every(isIndexNode) ||
    !Array.isArray(value.edges) || !value.edges.every(isIndexEdge) ||
    !Array.isArray(value.languages) || !value.languages.every(isSourceLanguage) ||
    !Array.isArray(value.sources) || !value.sources.every(isString) ||
    !isRecord(value.notes)) {
    return false;
  }

  const notes = value.notes;
  return [IndexLanguage.Latin, IndexLanguage.French].every(language => {
    const entries = notes[language];
    return Array.isArray(entries) && entries.every(isIndexNote);
  });
}
