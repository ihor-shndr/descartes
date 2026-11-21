import {
  IndexData,
  IndexEdge,
  IndexEdgeType,
  IndexNodeByType,
  IndexNodeType,
  IndexSourceLanguage,
  LocationNode,
  MarkerPosition,
  MappingNode,
  NotationCode,
  SectionNode,
  SourceTermNode,
  SubentryNode,
  TermNode,
  UsageNode,
  UsageKind,
} from '../types/termIndex';

export interface IndexedUsage {
  usage: UsageNode;
  location: LocationNode;
  section: SectionNode;
}

export function getNode<T extends IndexNodeType>(
  graph: IndexData,
  id: string,
  type: T,
): IndexNodeByType[T] | undefined {
  return graph.nodes.find((candidate): candidate is IndexNodeByType[T] =>
    candidate.id === id && candidate.type === type,
  );
}

export function getOutgoingEdges(graph: IndexData, source: string, type?: IndexEdge['type']): IndexEdge[] {
  return graph.edges.filter(edge => edge.source === source && (!type || edge.type === type));
}

export function getTerms(graph: IndexData, language: IndexSourceLanguage): SourceTermNode[] {
  const indexedIds = new Set(
    graph.edges
      .filter(edge => edge.type === IndexEdgeType.SourceTerm)
      .map(edge => edge.target),
  );
  const collator = new Intl.Collator(language, {
    sensitivity: 'base',
  });

  return graph.nodes
    .filter((node): node is SourceTermNode => node.type === IndexNodeType.Term && node.language === language && indexedIds.has(node.id))
    .sort((left, right) => collator.compare(left.lemma, right.lemma));
}

export function getMappings(graph: IndexData, sourceId: string): MappingNode[] {
  return getOutgoingEdges(graph, sourceId, IndexEdgeType.HasMapping)
    .map(edge => getNode(graph, edge.target, IndexNodeType.Mapping))
    .filter((node): node is MappingNode => !!node)
    .sort((left, right) =>
      (left.targetLanguage ?? '').localeCompare(right.targetLanguage ?? '') ||
      (left.order ?? left.rank ?? Number.MAX_SAFE_INTEGER) - (right.order ?? right.rank ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id),
    );
}

export function getMappingTargets(graph: IndexData, mappingId: string): TermNode[] {
  return getOutgoingEdges(graph, mappingId, IndexEdgeType.MapsToTerm)
    .map(edge => getNode(graph, edge.target, IndexNodeType.Term))
    .filter((node): node is TermNode => !!node);
}

export function getMappingNotations(graph: IndexData, mappingId: string): NotationCode[] {
  return getOutgoingEdges(graph, mappingId, IndexEdgeType.MapsToNotation)
    .map(edge => getNode(graph, edge.target, IndexNodeType.Notation)?.code)
    .filter((code): code is NotationCode => !!code);
}

export function getSubentries(graph: IndexData, termId: string): SubentryNode[] {
  return graph.nodes
    .filter((node): node is SubentryNode => node.type === IndexNodeType.Subentry && node.parentTermId === termId)
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

export function getUsages(graph: IndexData, sourceId: string): IndexedUsage[] {
  return graph.edges
    .filter(edge => edge.type === IndexEdgeType.SourceTerm && edge.target === sourceId)
    .map(edge => {
      const usage = getNode(graph, edge.source, IndexNodeType.Usage);
      if (!usage) return undefined;
      const locationEdge = getOutgoingEdges(graph, usage.id, IndexEdgeType.AtLocation)[0];
      const sectionEdge = getOutgoingEdges(graph, usage.id, IndexEdgeType.BelongsToSection)[0];
      const location = locationEdge ? getNode(graph, locationEdge.target, IndexNodeType.Location) : undefined;
      const section = sectionEdge ? getNode(graph, sectionEdge.target, IndexNodeType.Section) : undefined;
      return location && section ? { usage, location, section } : undefined;
    })
    .filter((reference): reference is IndexedUsage => !!reference)
    .sort((left, right) => (left.usage.order ?? 0) - (right.usage.order ?? 0));
}

export function getSubentryUsages(graph: IndexData, subentryId: string): IndexedUsage[] {
  return getOutgoingEdges(graph, subentryId, IndexEdgeType.SubentryUsage)
    .map(edge => {
      const usage = getNode(graph, edge.target, IndexNodeType.Usage);
      if (!usage) return undefined;
      const locationEdge = getOutgoingEdges(graph, usage.id, IndexEdgeType.AtLocation)[0];
      const sectionEdge = getOutgoingEdges(graph, usage.id, IndexEdgeType.BelongsToSection)[0];
      const location = locationEdge ? getNode(graph, locationEdge.target, IndexNodeType.Location) : undefined;
      const section = sectionEdge ? getNode(graph, sectionEdge.target, IndexNodeType.Section) : undefined;
      return location && section ? { usage, location, section } : undefined;
    })
    .filter((reference): reference is IndexedUsage => !!reference)
    .sort((left, right) => (left.usage.order ?? 0) - (right.usage.order ?? 0));
}

export interface UsageMapping {
  mapping: MappingNode;
  usageKind: UsageKind;
  markerText?: string;
  markerPosition?: MarkerPosition;
}

export function getUsageMappings(graph: IndexData, usageId: string): UsageMapping[] {
  return getOutgoingEdges(graph, usageId, IndexEdgeType.UsesMapping)
    .map((edge): UsageMapping | undefined => {
      const mapping = getNode(graph, edge.target, IndexNodeType.Mapping);
      return mapping ? {
        mapping,
        usageKind: edge.usageKind ?? UsageKind.Lexical,
        markerText: edge.markerText,
        markerPosition: edge.markerPosition,
      } : undefined;
    })
    .filter((item): item is UsageMapping => !!item);
}

export function getMappingUseCount(
  graph: IndexData,
  mappingId: string,
  usageKind: UsageKind = UsageKind.Lexical,
): number {
  return graph.edges
    .filter(edge => edge.type === IndexEdgeType.UsesMapping && edge.target === mappingId && (edge.usageKind ?? UsageKind.Lexical) === usageKind)
    .reduce((count, edge) => count + (getNode(graph, edge.source, IndexNodeType.Usage)?.tokenCount ?? 0), 0);
}

export function getMappingNotationCounts(graph: IndexData, mappingId: string): Array<{ code: NotationCode; count: number }> {
  const mapping = getNode(graph, mappingId, IndexNodeType.Mapping);
  if (!mapping) throw new Error(`Unknown index mapping "${mappingId}"`);

  return getOutgoingEdges(graph, mappingId, IndexEdgeType.CountByNotation).map(edge => {
    const notation = getNode(graph, edge.target, IndexNodeType.Notation);
    if (!notation) throw new Error(`Invalid count notation "${edge.target}" for mapping "${mappingId}"`);

    const notationMappings = new Set(
      getMappings(graph, mapping.sourceId)
        .filter(candidate => getMappingNotations(graph, candidate.id).includes(notation.code))
        .map(candidate => candidate.id),
    );
    const notationUsages = new Set(
      graph.edges
        .filter(candidate => candidate.type === IndexEdgeType.UsesMapping && notationMappings.has(candidate.target))
        .map(candidate => candidate.source),
    );
    const count = graph.edges
      .filter(candidate =>
        candidate.type === IndexEdgeType.UsesMapping &&
        candidate.target === mappingId &&
        (candidate.usageKind ?? UsageKind.Lexical) === UsageKind.Lexical &&
        notationUsages.has(candidate.source),
      )
      .reduce((sum, candidate) => sum + (getNode(graph, candidate.source, IndexNodeType.Usage)?.tokenCount ?? 0), 0);

    return { code: notation.code, count };
  });
}

export function getTermCount(graph: IndexData, termId: string): number {
  return getUsages(graph, termId).reduce((count, usage) => count + usage.usage.tokenCount, 0);
}

export function getLocationTermIds(
  graph: IndexData,
  language: IndexSourceLanguage,
  page: number,
  lineOrSegment: number | string,
): string[] {
  const locationIds = new Set(
    graph.nodes
      .filter((node): node is LocationNode =>
        node.type === IndexNodeType.Location &&
        node.language === language &&
        node.page === page &&
        (typeof lineOrSegment === 'string'
          ? node.segment === lineOrSegment
          : node.line === lineOrSegment),
      )
      .map(node => node.id),
  );
  const termIds = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.type !== IndexEdgeType.AtLocation || !locationIds.has(edge.target)) continue;
    const usage = getNode(graph, edge.source, IndexNodeType.Usage);
    if (!usage) continue;

    for (const sourceEdge of getOutgoingEdges(graph, usage.id, IndexEdgeType.SourceTerm)) {
      const term = getNode(graph, sourceEdge.target, IndexNodeType.Term);
      if (term?.language === language) termIds.add(term.id);
    }

    for (const subentryEdge of graph.edges.filter(candidate =>
      candidate.type === IndexEdgeType.SubentryUsage && candidate.target === usage.id,
    )) {
      const subentry = getNode(graph, subentryEdge.source, IndexNodeType.Subentry);
      const parent = subentry && getNode(graph, subentry.parentTermId, IndexNodeType.Term);
      if (parent?.language === language) termIds.add(parent.id);
    }
  }

  return [...termIds];
}
