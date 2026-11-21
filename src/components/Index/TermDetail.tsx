import { Fragment, ReactNode } from 'react';
import { useAppStore } from '../../store/app-store';
import {
  getMappingNotations,
  getMappingNotationCounts,
  getMappingTargets,
  getMappingUseCount,
  getMappings,
  getSubentries,
  getSubentryUsages,
  getTermCount,
  getUsages,
  getUsageMappings,
} from '../../utils/index-graph';
import {
  CountDisplay,
  IndexData,
  IndexLanguage,
  IndexNoteKind,
  IndexSourceLanguage,
  LocationNode,
  MappingNode,
  MappingResolution,
  MarkerPosition,
  NotationCode,
  PRIMARY_MAPPING_RANK,
  SectionCode,
  SourceTermNode,
  SubentryNode,
  TITLE_LINE_NUMBER,
  UsageKind,
  UsageNode,
} from '../../types/termIndex';
import { SEGMENT_MARKER_REGEX, extractSegmentId } from '../../utils/text-rendering';

function roman(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let remainder = value;
  return numerals.reduce((result, [amount, numeral]) => {
    while (remainder >= amount) {
      result += numeral;
      remainder -= amount;
    }
    return result;
  }, '');
}

function displayCount(count: number, empty: boolean): string {
  return empty ? '[]' : `[${count}]`;
}

function mappingCount(graph: IndexData, mappings: MappingNode[]): ReactNode {
  const lexicalMappings = mappings.filter(mapping => mapping.resolution !== MappingResolution.Pronoun);
  const pronounMappings = mappings.filter(mapping => mapping.resolution === MappingResolution.Pronoun);
  const lexicalCount = lexicalMappings.reduce((sum, mapping) => sum + getMappingUseCount(graph, mapping.id), 0);
  const pronounCount = pronounMappings.reduce((sum, mapping) => sum + getMappingUseCount(graph, mapping.id, UsageKind.Pronoun), 0);
  const empty = lexicalCount === 0 && pronounCount === 0;

  if (empty) return '[]';
  const breakdowns = lexicalMappings.flatMap(mapping => getMappingNotationCounts(graph, mapping.id))
    .filter(breakdown => breakdown.count > 0);
  const breakdownCount = breakdowns.reduce((sum, breakdown) => sum + breakdown.count, 0);
  if (breakdownCount > lexicalCount) throw new Error('Overlapping index notation counts');

  const parts: string[] = [];
  if (lexicalCount > 0) parts.push(String(lexicalCount - breakdownCount));
  parts.push(...breakdowns.map(breakdown => `${breakdown.count}${breakdown.code}`));
  if (pronounCount > 0) parts.push(`${pronounCount} ${NotationCode.Pronoun}`);
  return `[${parts.join(' + ')}]`;
}

function MappingLines({ graph, sourceId, sourceLanguage, isSubentry = false }: {
  graph: IndexData;
  sourceId: string;
  sourceLanguage: IndexSourceLanguage;
  isSubentry?: boolean;
}) {
  const mappings = getMappings(graph, sourceId);
  const crossLanguage = sourceLanguage === IndexLanguage.Latin ? IndexLanguage.French : IndexLanguage.Latin;
  const targetLanguages: IndexLanguage[] = [crossLanguage, IndexLanguage.Ukrainian];
  const rows: Array<{ language: IndexLanguage; mappings: MappingNode[] }> = targetLanguages.map(language => ({
    language,
    mappings: mappings.filter(mapping => mapping.targetLanguage === language),
  })).filter(row => row.mappings.length > 0);

  const notations = mappings.filter(mapping => !mapping.targetLanguage);
  if (notations.length && !rows.some(row => row.language === crossLanguage)) {
    rows.unshift({ language: crossLanguage, mappings: [] });
  }

  return <div className="text-sm leading-relaxed font-serif">
    {rows.map(row => {
      const groups = row.mappings
        .filter(mapping => mapping.resolution !== MappingResolution.Pronoun)
        .map(mapping => ({ rank: mapping.rank, mappings: [mapping] }));
      for (const mapping of row.mappings.filter(candidate => candidate.resolution === MappingResolution.Pronoun)) {
        const targetIds = new Set(getMappingTargets(graph, mapping.id).map(target => target.id));
        const group = groups.find(candidate =>
          candidate.rank === mapping.rank &&
          candidate.mappings.some(item => getMappingTargets(graph, item.id).some(target => targetIds.has(target.id))),
        );
        if (group) group.mappings.push(mapping);
        else groups.push({ rank: mapping.rank, mappings: [mapping] });
      }

      return <div
        key={row.language}
        lang={row.language}
        className={isSubentry ? 'pl-6 -indent-4' : 'pl-[3.25rem] -indent-7'}
      >
        {groups.map((group, groupIndex) => {
          const targets = group.mappings.flatMap(mapping => getMappingTargets(graph, mapping.id));
          const uniqueTargets = targets.filter((target, index) =>
            targets.findIndex(candidate => candidate.id === target.id) === index,
          );
          const notationCodes = group.mappings
            .filter(mapping => mapping.resolution !== MappingResolution.Pronoun)
            .flatMap(mapping => getMappingNotations(graph, mapping.id));
          const targetLanguage = row.language;
          const rankLabel = group.rank !== undefined &&
            (group.rank > PRIMARY_MAPPING_RANK || group.mappings.some(mapping => mapping.rankIsExplicit))
            ? targetLanguage === IndexLanguage.Ukrainian ? roman(group.rank) : String(group.rank)
            : '';

          return <Fragment key={group.mappings[0].id}>
            {groupIndex > 0 && <span>, </span>}
            {uniqueTargets.map((target, targetIndex) => <Fragment key={target.id}>
              {targetIndex > 0 && <span>, </span>}
              <span>{target.lemma}</span>
            </Fragment>)}
            {rankLabel && <sup>{rankLabel}</sup>}
            {notationCodes.length > 0 && <span>{notationCodes.join(', ')}</span>}
            {' '}
            {mappingCount(graph, group.mappings)}
          </Fragment>;
        })}
        {row.language === crossLanguage && notations.length > 0 && <>
          {groups.length > 0 && <span> / </span>}
          {notations.map((mapping, index) => <Fragment key={mapping.id}>
            {index > 0 && <span>, </span>}
            {getMappingNotations(graph, mapping.id).join(', ')} {mappingCount(graph, [mapping])}
          </Fragment>)}
        </>}
      </div>;
    })}
  </div>;
}

function Reference({ graph, usage, location }: {
  graph: IndexData;
  usage: UsageNode;
  location: LocationNode;
}) {
  const navigate = useAppStore(state => state.navigateToLocation);
  const allTexts = useAppStore(state => state.allTexts);
  const source = allTexts?.[location.language]?.pages
    .find(page => page.pageNumber === location.page);
  const available = !!source && (!location.segment || source.paragraphs.some(paragraph =>
    paragraph.lines.some(({ text }) => Array.from(text.matchAll(SEGMENT_MARKER_REGEX))
      .some(([marker]) => extractSegmentId(marker) === location.segment)),
  ));
  const line = location.line ?? TITLE_LINE_NUMBER;
  const label = usage.isTitle
    ? 'tit'
    : location.segment
      ? `(${usage.printedSegment ?? location.segment}${usage.segmentHasAsterisk ? '*' : ''})`
      : `${usage.printedLine ?? line}${usage.printedLineSuffix ?? ''}`;
  const printedParts = [
    usage.printedPage !== undefined ? `сторінка ${usage.printedPage}` : undefined,
    usage.printedLine !== undefined ? `рядок ${usage.printedLine}` : undefined,
    usage.printedSegment !== undefined ? `фрагмент ${usage.printedSegment}` : undefined,
  ].filter((part): part is string => part !== undefined);
  const printedReference = printedParts.length ? ` (у друкованому покажчику: ${printedParts.join(', ')})` : '';
  const unavailable = source ? ' — фрагмент відсутній у французькому тексті' : ' — текст ще не імпортовано';
  const title = `Сторінка ${location.page}, ${location.segment
    ? `фрагмент ${location.segment}`
    : line === TITLE_LINE_NUMBER ? 'заголовок' : `рядок ${line}`}${printedReference}${available ? '' : unavailable}`;
  const reference = <button
    disabled={!available}
    title={title}
    onClick={() => navigate(location.page, line, location.segment, usage.alignedSegment)}
    className="text-blue-600 hover:underline disabled:text-gray-500 disabled:cursor-help disabled:no-underline"
  >{label}</button>;
  const mappingMarkers = getUsageMappings(graph, usage.id);
  const before = [...new Set(mappingMarkers
    .filter(marker => marker.markerPosition === MarkerPosition.Before && marker.markerText)
    .map(marker => marker.markerText)
    .filter((marker): marker is string => !!marker))];
  const after = [...new Set(mappingMarkers
    .filter(marker => marker.markerPosition === MarkerPosition.After && marker.markerText)
    .map(marker => marker.markerText)
    .filter((marker): marker is string => !!marker))];
  const markedReference = <span>
    {before.map(marker => <sup key={`before-${marker}`}>{marker}</sup>)}
    {reference}
    {(usage.reportedTokenCount ?? usage.tokenCount) > 1 && <sub>x{usage.reportedTokenCount ?? usage.tokenCount}</sub>}
    {after.map(marker => <sup key={`after-${marker}`}>{marker}</sup>)}
  </span>;

  return usage.isElliptical ? <em>{markedReference}</em> : markedReference;
}

function ReferenceGroups({ graph, sourceId, subentryId }: {
  graph: IndexData;
  sourceId: string;
  subentryId?: string;
}) {
  const references = subentryId
    ? getSubentryUsages(graph, subentryId)
    : getUsages(graph, sourceId);
  const sections = new Map<SectionCode, typeof references>();
  for (const reference of references) {
    sections.set(reference.section.code, [...(sections.get(reference.section.code) ?? []), reference]);
  }

  return <div className="text-sm leading-relaxed font-serif">
    {[...sections.entries()].map(([code, sectionReferences]) => {
      const sectionCount = sectionReferences.reduce((sum, reference) => sum + reference.usage.tokenCount, 0);
      let previousPage: string | undefined;

      return <div key={code} className="pl-9 -indent-9">
        <span><em>{code}</em> {displayCount(sectionCount, false)} </span>
        {sectionReferences.map((reference, index) => {
          const page = `${reference.usage.printedPage ?? reference.location.page}${reference.usage.pageHasAsterisk ? '*' : ''}`;
          const startsPage = page !== previousPage;
          previousPage = page;
          return <Fragment key={reference.usage.id}>
            {index > 0 && (startsPage ? '; ' : ', ')}
            {startsPage && <span>{page}{reference.location.segment ? ' ' : ': '}</span>}
            <Reference
              graph={graph}
              usage={reference.usage}
              location={reference.location}
            />
          </Fragment>;
        })}
      </div>;
    })}
  </div>;
}

function SubentryDetail({ graph, subentry, sourceLanguage }: {
  graph: IndexData;
  subentry: SubentryNode;
  sourceLanguage: IndexSourceLanguage;
}) {
  const usages = getSubentryUsages(graph, subentry.id);
  const count = usages.reduce((sum, reference) => sum + reference.usage.tokenCount, 0);

  return <div className="mt-2 pl-7">
    <div className="text-sm font-serif">{subentry.code}{subentry.number ?? ''} {displayCount(count, subentry.countDisplay === CountDisplay.Empty)}</div>
    <div className="text-sm font-serif italic">{subentry.phrase}</div>
    <MappingLines graph={graph} sourceId={subentry.id} sourceLanguage={sourceLanguage} isSubentry />
    <ReferenceGroups graph={graph} sourceId={subentry.id} subentryId={subentry.id} />
  </div>;
}

export function TermDetail({ graph, term }: { graph: IndexData; term: SourceTermNode }) {
  const sourceLanguage = term.language;
  const count = getTermCount(graph, term.id);

  return <article className="mb-6 pb-4 border-b border-gray-100 last:border-0">
    <h3 className="text-lg font-serif mb-2">
      <strong>{term.lemma}</strong> {displayCount(count, term.countDisplay === CountDisplay.Empty)}
      {graph.notes[sourceLanguage].map(note =>
        note.kind === IndexNoteKind.Footnote && note.termId === term.id
          ? <sup key={note.number} title={note.text}>{note.number}</sup>
          : null,
      )}
    </h3>
    <MappingLines graph={graph} sourceId={term.id} sourceLanguage={sourceLanguage} />
    <ReferenceGroups graph={graph} sourceId={term.id} />
    {getSubentries(graph, term.id).map(subentry => (
      <SubentryDetail key={subentry.id} graph={graph} subentry={subentry} sourceLanguage={sourceLanguage} />
    ))}
  </article>;
}
