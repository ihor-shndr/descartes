/**
 * Paragraph in the source JSON format
 */
export interface Paragraph {
  newLine: boolean;  // true = new paragraph, false = continuation
  lines: string[];   // Array of text lines
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

/**
 * Language code with metadata
 */
export type LanguageCode = 'la' | 'la-ua' | 'fr' | 'fr-ua';

/**
 * Language configuration
 */
export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  preserveLineBreaks: boolean;  // true for source languages (la, fr)
  isTranslation: boolean;       // true for Ukrainian translations
}
