import {
  TextData,
  Paragraph,
  LanguagePageBlock,
  ProcessedPageData
} from '../types/text';
import { joinPageText, alignSegments } from './segment-parser';
import { LanguageCode } from '../constants/languages';
import { preservesLineBreaks } from './language-utils';

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
      const shouldPreserveLineBreaks = preservesLineBreaks(lang);
      languageTexts[lang] = joinPageText(page, shouldPreserveLineBreaks);

      // Calculate max line length for languages that preserve line breaks
      const maxLineLength = preservesLineBreaks(lang)
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

  return {
    languageBlocks,
    segments: segments
  };
}
