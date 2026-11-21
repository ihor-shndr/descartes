export const IndexLanguage = {
  Latin: 'la',
  French: 'fr',
  Ukrainian: 'uk',
} as const;
export type IndexLanguage = typeof IndexLanguage[keyof typeof IndexLanguage];
export type IndexSourceLanguage = Exclude<IndexLanguage, typeof IndexLanguage.Ukrainian>;

export const IndexFilterLanguage = {
  Latin: 'latin',
  French: 'french',
} as const;
export type IndexFilterLanguage = typeof IndexFilterLanguage[keyof typeof IndexFilterLanguage];

export const IndexNodeType = {
  Term: 'term',
  Subentry: 'subentry',
  Mapping: 'mapping',
  Usage: 'usage',
  Location: 'location',
  Section: 'section',
  Notation: 'notation',
} as const;
export type IndexNodeType = typeof IndexNodeType[keyof typeof IndexNodeType];

export const IndexEdgeType = {
  SourceTerm: 'source_term',
  AtLocation: 'at_location',
  BelongsToSection: 'belongs_to_section',
  UsesMapping: 'uses_mapping',
  HasMapping: 'has_mapping',
  MapsToTerm: 'maps_to_term',
  MapsToNotation: 'maps_to_notation',
  CountByNotation: 'count_by_notation',
  SubentryUsage: 'subentry_usage',
  SubentryOf: 'subentry_of',
} as const;
export type IndexEdgeType = typeof IndexEdgeType[keyof typeof IndexEdgeType];

export const MappingResolution = {
  TranslationAbsent: 'translation-absent',
  Translation: 'translation',
  Lexical: 'lexical',
  Pronoun: 'pronoun',
  Periphrasis: 'periphrasis',
} as const;
export type MappingResolution = typeof MappingResolution[keyof typeof MappingResolution];

export const UsageKind = {
  Lexical: 'lexical',
  Pronoun: 'pronoun',
} as const;
export type UsageKind = typeof UsageKind[keyof typeof UsageKind];

export const MarkerPosition = {
  Before: 'before',
  After: 'after',
} as const;
export type MarkerPosition = typeof MarkerPosition[keyof typeof MarkerPosition];

export const CountDisplay = { Empty: 'empty' } as const;
export type CountDisplay = typeof CountDisplay[keyof typeof CountDisplay];

export const IndexNoteKind = {
  Heading: 'heading',
  Paragraph: 'paragraph',
  Footnote: 'footnote',
} as const;
export type IndexNoteKind = typeof IndexNoteKind[keyof typeof IndexNoteKind];

export const NotationCode = {
  FM: 'FM',
  PL: 'PL',
  PLStar: 'PL*',
  Pronoun: 'PN',
  TL: 'TL',
} as const;
export type NotationCode = typeof NotationCode[keyof typeof NotationCode];

export const SectionCode = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
  V: 'V',
  VI: 'VI',
  PL: 'PL',
  PLStar: 'PL*',
  SC: 'SC',
  SY: 'SY',
} as const;
export type SectionCode = typeof SectionCode[keyof typeof SectionCode];

export const SubentryCode = { GT: 'GT' } as const;
export type SubentryCode = typeof SubentryCode[keyof typeof SubentryCode];

export const INDEX_GRAPH_VERSION = 2;
export const TITLE_LINE_NUMBER = 0;
export const PRIMARY_MAPPING_RANK = 1;

export interface TermNode {
  id: string;
  type: typeof IndexNodeType.Term;
  language: IndexLanguage;
  lemma: string;
  countDisplay?: CountDisplay;
}

export interface SourceTermNode extends TermNode {
  language: IndexSourceLanguage;
}

export interface SubentryNode {
  id: string;
  type: typeof IndexNodeType.Subentry;
  parentTermId: string;
  code: SubentryCode;
  number?: number;
  phrase: string;
  countDisplay?: CountDisplay;
  order?: number;
}

export interface MappingNode {
  id: string;
  type: typeof IndexNodeType.Mapping;
  sourceId: string;
  targetLanguage?: IndexLanguage;
  targetTermId?: string;
  notationId?: string;
  resolution: MappingResolution;
  rank?: number;
  rankIsExplicit?: boolean;
  order?: number;
  countDisplay?: CountDisplay;
}

export interface UsageNode {
  id: string;
  type: typeof IndexNodeType.Usage;
  tokenCount: number;
  /** Published count when it differs from the text. */
  reportedTokenCount?: number;
  isTitle: boolean;
  isElliptical?: boolean;
  segmentHasAsterisk?: boolean;
  pageHasAsterisk?: boolean;
  order?: number;
  printedLine?: number;
  printedLineSuffix?: string;
  /** Published page when it differs from the navigation target. */
  printedPage?: number;
  /** Published segment label when it differs from the navigation target. */
  printedSegment?: string;
  alignedSegment?: string;
}

interface LocationBase {
  id: string;
  type: typeof IndexNodeType.Location;
  page: number;
}

export type LocationNode = LocationBase & (
  | { language: typeof IndexLanguage.Latin; line: number; segment?: never }
  | { language: typeof IndexLanguage.French; segment: string; line?: never }
);

export interface SectionNode {
  id: string;
  type: typeof IndexNodeType.Section;
  code: SectionCode;
}

export interface NotationNode {
  id: string;
  type: typeof IndexNodeType.Notation;
  code: NotationCode;
}

export interface IndexNodeByType {
  [IndexNodeType.Term]: TermNode;
  [IndexNodeType.Subentry]: SubentryNode;
  [IndexNodeType.Mapping]: MappingNode;
  [IndexNodeType.Usage]: UsageNode;
  [IndexNodeType.Location]: LocationNode;
  [IndexNodeType.Section]: SectionNode;
  [IndexNodeType.Notation]: NotationNode;
}

export type IndexNode = IndexNodeByType[IndexNodeType];

export interface IndexEdge {
  source: string;
  target: string;
  type: IndexEdgeType;
  usageKind?: UsageKind;
  markerText?: string;
  markerPosition?: MarkerPosition;
}

export type IndexNote =
  | { kind: typeof IndexNoteKind.Heading; text: string; footnoteNumber?: number }
  | { kind: typeof IndexNoteKind.Paragraph; text: string }
  | { kind: typeof IndexNoteKind.Footnote; number: number; termId?: string; text: string };

export interface IndexGraph {
  version: typeof INDEX_GRAPH_VERSION;
  languages: IndexSourceLanguage[];
  sources: string[];
  nodes: IndexNode[];
  edges: IndexEdge[];
  notes: Record<IndexSourceLanguage, IndexNote[]>;
}

export type IndexData = IndexGraph;
