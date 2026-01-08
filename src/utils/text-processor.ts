import {
  TextData,
  Segment,
  RawPageData
} from '../types/text';
import { joinPageText, alignSegments, isSourceLanguage } from './segment-parser';

/**
 * Processed page data ready for rendering
 */
export interface ProcessedPageData {
  segments: Segment[];
  rawPages: Record<string, RawPageData>;
  availableLanguages: string[];
}

/**
 * Process page data for rendering
 * Handles missing segments and languages properly
 *
 * @param allTexts - All loaded language texts
 * @param pageNumber - Page number to process
 * @returns Processed page data or null if page doesn't exist
 */
export function processPageData(
  allTexts: Record<string, TextData>,
  pageNumber: number
): ProcessedPageData | null {
  const languageTexts: Record<string, string> = {};
  const rawPages: Record<string, RawPageData> = {};

  // Extract page data from each language
  for (const [lang, data] of Object.entries(allTexts)) {
    const page = data.pages.find((p) => p.pageNumber === pageNumber);
    if (page) {
      const preserveLineBreaks = isSourceLanguage(lang);
      languageTexts[lang] = joinPageText(page, preserveLineBreaks);

      // Store raw page data for verbatim rendering (source languages)
      if (isSourceLanguage(lang)) {
        rawPages[lang] = { paragraphs: page.paragraphs };
      }
    } else {
      console.warn(`Missing page ${pageNumber} for language ${lang}`);
    }
  }

  // No data available for this page
  if (Object.keys(languageTexts).length === 0) {
    return null;
  }

  // Align segments across all languages
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
    segments: validSegments,
    rawPages,
    availableLanguages: Object.keys(languageTexts)
  };
}
