import {
  TextData,
  Paragraph,
  LanguagePageBlock,
  ProcessedPageData,
  Page
} from '../types/text';
import { joinPageText, alignSegments } from './segment-parser';
import { LanguageCode } from '../constants/languages';
import { preservesLineBreaks } from './language-utils';

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
): ProcessedPageData {
  const languageTexts: Record<string, string> = {};
  const pagesByLang: Record<string, Paragraph[]> = {};

  // Extract page data from each language
  for (const [lang, data] of Object.entries(allTexts)) {
    const page: Page | undefined = data.pages.find((p) => p.pageNumber === pageNumber);

    // Skip languages that don't have this page
    if (!page) continue;

    const shouldPreserveLineBreaks = preservesLineBreaks(lang);
    languageTexts[lang] = joinPageText(page, shouldPreserveLineBreaks);
    pagesByLang[lang] = page.paragraphs;
  }

  // Build ordered language blocks (only include languages that have data)
  const languageBlocks: LanguagePageBlock[] = languageLayout
    .filter(code => pagesByLang[code])  // Only include languages with data for this page
    .map(code => ({
      code,
      paragraphs: pagesByLang[code]
    }));

  // Align segments across all languages (for index/lookup features)
  const segments = alignSegments(languageTexts);

  return {
    languageBlocks,
    segments: segments
  };
}
