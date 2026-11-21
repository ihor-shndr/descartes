export interface TextLine {
  text: string;
  // A null bar anchors a margin label to the line itself.
  editionMarkers?: { bar: number | null; label: string }[];
}

/**
 * Paragraph or heading
 * New paragraph is detected by leading space in first line
 */
export interface Paragraph<Line = TextLine> {
  type?: 'h1' | 'h2' | 'h3';  // Optional heading type
  startLine?: number; // Printed Latin line number when headings interrupt sequential body lines
  lines: Line[];
}

/**
 * Page in the source JSON format
 */
export interface Page<Line = TextLine> {
  pageNumber: number;
  paragraphs: Paragraph<Line>[];
}

/**
 * Source JSON file structure
 */
export interface TextData<Line = TextLine> {
  pages: Page<Line>[];
}

/**
 * Segment represents an aligned piece of text across multiple languages
 */
export interface Segment {
  id: string;         // "1", "6a", "7"
  texts: Record<string, string>;  // { la: "...", "la-ua": "..." }
}

/**
 * Single language block ready for rendering
 */
export interface LanguagePageBlock {
  code: string;
  paragraphs: Paragraph[];
}

/**
 * Processed page data ready for rendering
 */
export interface ProcessedPageData {
  languageBlocks: LanguagePageBlock[];  // Ordered array of language blocks (already validated)
  segments: Segment[];  // For index/lookup features
}
