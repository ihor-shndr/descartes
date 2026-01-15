/**
 * Paragraph in the source JSON format
 * New paragraph is detected by leading space in first line
 */
export interface Paragraph {
  type?: 'h1' | 'h2' | 'h3';  // Optional heading type
  lines: string[];      // Array of text lines
}

/**
 * Check if a paragraph is a new paragraph (first line starts with space)
 */
export function isNewParagraph(paragraph: Paragraph): boolean {
  return paragraph.lines.length > 0 && paragraph.lines[0].startsWith(' ');
}

/**
 * Page in the source JSON format
 */
export interface Page {
  pageNumber: number;
  paragraphs: Paragraph[];
}

/**
 * Source JSON file structure
 */
export interface TextData {
  pages: Page[];
}

/**
 * Segment represents an aligned piece of text across multiple languages
 */
export interface Segment {
  id: string;         // "1", "6a", "7"
  marker: string;     // "(1)", "(6a)"
  texts: Record<string, string>;  // { la: "...", "la-ua": "..." }
}

/**
 * Raw page data for source languages (preserves original lines)
 */
export interface RawPageData {
  paragraphs: Paragraph[];
  maxLineLength?: number;  // Longest line length in characters (for dynamic width)
}

/**
 * Processed page data for rendering
 */
export interface PageData {
  pageNumber: number;
  totalPages: number;
  availableLanguages: string[];
  segments: Segment[];
  // Raw page data per language for verbatim rendering (source languages)
  rawPages: Record<string, RawPageData>;
}

export type LanguageCode = 'la' | 'la-ua' | 'fr' | 'fr-ua';
