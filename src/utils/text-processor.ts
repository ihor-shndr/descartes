import {
  TextData,
  Segment,
  Paragraph
} from '../types/text';
import { joinPageText, alignSegments } from './segment-parser';
import { isSourceLanguage, LanguageCode } from '../constants/languages';

/**
 * Single language block ready for rendering
 */
export interface LanguagePageBlock {
  code: LanguageCode;
  paragraphs: Paragraph[];
  maxLineLength?: number;
}

/**
 * Processed page data ready for rendering
 */
export interface ProcessedPageData {
  languageBlocks: LanguagePageBlock[];  // Ordered array of language blocks (already validated)
  segments: Segment[];  // For index/lookup features
}

/**
 * Calculate the maximum line length for a page (used for dynamic width)
 */
function calculateMaxLineLength(paragraphs: any[]): number {
  let max = 0;
  for (const paragraph of paragraphs) {
    for (const line of paragraph.lines) {
      max = Math.max(max, line.length);
    }
  }
  return max;
}

/**
 * Process page data for rendering
 * Returns pre-validated, ordered language blocks ready to display
 *
 * @param allTexts - All loaded language texts
 * @param pageNumber - Page number to process
 * @param languageLayout - Ordered array of language codes to display
 * @returns Processed page data or null if page doesn't exist
 */
export function processPageData(
  allTexts: Record<string, TextData>,
  pageNumber: number,
  languageLayout: LanguageCode[]
): ProcessedPageData | null {
  const languageTexts: Record<string, string> = {};
  const pagesByLang: Record<string, { paragraphs: Paragraph[]; maxLineLength?: number }> = {};

  // Extract page data from each language
  for (const [lang, data] of Object.entries(allTexts)) {
    const page = data.pages.find((p) => p.pageNumber === pageNumber);
    if (page) {
      const preserveLineBreaks = isSourceLanguage(lang);
      languageTexts[lang] = joinPageText(page, preserveLineBreaks);

      // Calculate max line length for source languages
      const maxLineLength = isSourceLanguage(lang)
        ? calculateMaxLineLength(page.paragraphs)
        : undefined;

      pagesByLang[lang] = {
        paragraphs: page.paragraphs,
        maxLineLength
      };
    } else {
      console.warn(`Missing page ${pageNumber} for language ${lang}`);
    }
  }

  // No data available for this page
  if (Object.keys(languageTexts).length === 0) {
    return null;
  }

  // Build ordered language blocks (only include languages that have data)
  const languageBlocks: LanguagePageBlock[] = languageLayout
    .filter(code => pagesByLang[code])  // Only include languages with data for this page
    .map(code => ({
      code,
      paragraphs: pagesByLang[code].paragraphs,
      maxLineLength: pagesByLang[code].maxLineLength
    }));

  // Align segments across all languages (for index/lookup features)
  const segments = alignSegments(languageTexts);

  // Validate segments (warn about missing text)
  const validSegments = segments.filter((seg) => {
    if (Object.keys(seg.texts).length === 0) {
      console.warn(`Segment ${seg.id} has no text in any language`);
      return false;
    }
    return true;
  });

  return {
    languageBlocks,
    segments: validSegments
  };
}
