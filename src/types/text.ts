/**
 * Paragraph in the source JSON format
 * New paragraph is detected by leading space in first line
 */
export interface Paragraph {
  type?: 'h1' | 'h2' | 'h3';  // Optional heading type
  lines: string[];      // Array of text lines
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
