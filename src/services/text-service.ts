import { TextData, PageData, RawPageData } from '../types/text';
import { alignSegments, joinPageText, isSourceLanguage } from '../utils/segment-parser';

/**
 * Available language files
 */
const LANGUAGE_FILES: Record<string, string> = {
  'la': './texts/la.json',
  'la-ua': './texts/la-ua.json',
  'fr': './texts/fr.json',
  'fr-ua': './texts/fr-ua.json'
};

/**
 * Cache for loaded text data
 */
const textCache = new Map<string, TextData>();

/**
 * Cache for processed page data
 */
const pageCache = new Map<string, PageData>();

/**
 * Load a single language file
 */
async function loadLanguageFile(lang: string): Promise<TextData | null> {
  if (textCache.has(lang)) {
    return textCache.get(lang)!;
  }

  const filePath = LANGUAGE_FILES[lang];
  if (!filePath) {
    console.warn(`Unknown language: ${lang}`);
    return null;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      console.warn(`Failed to load ${filePath}: ${response.statusText}`);
      return null;
    }
    const data: TextData = await response.json();
    textCache.set(lang, data);
    return data;
  } catch (error) {
    console.warn(`Error loading ${filePath}:`, error);
    return null;
  }
}

/**
 * Load all language files
 */
async function loadAllLanguages(): Promise<Record<string, TextData>> {
  const languages = Object.keys(LANGUAGE_FILES);
  const results: Record<string, TextData> = {};

  await Promise.all(
    languages.map(async (lang) => {
      const data = await loadLanguageFile(lang);
      if (data) {
        results[lang] = data;
      }
    })
  );

  return results;
}

/**
 * Get total pages from all loaded languages
 */
function getTotalPages(allData: Record<string, TextData>): number {
  let maxPages = 0;
  for (const data of Object.values(allData)) {
    if (data.pages.length > maxPages) {
      maxPages = data.pages.length;
    }
  }
  return maxPages;
}

/**
 * Fetch page data with segments aligned across all languages
 */
export async function fetchPage(pageNumber: number): Promise<PageData> {
  const cacheKey = `page-${pageNumber}`;

  if (pageCache.has(cacheKey)) {
    return pageCache.get(cacheKey)!;
  }

  // Load all language files
  const allData = await loadAllLanguages();
  const availableLanguages = Object.keys(allData);

  if (availableLanguages.length === 0) {
    throw new Error('No language files could be loaded');
  }

  // Get page from each language and join text
  const languageTexts: Record<string, string> = {};
  const rawPages: Record<string, RawPageData> = {};

  for (const [lang, data] of Object.entries(allData)) {
    const page = data.pages.find(p => p.pageNumber === pageNumber);
    if (page) {
      const preserveLineBreaks = isSourceLanguage(lang);
      languageTexts[lang] = joinPageText(page, preserveLineBreaks);
      // Store raw page data for source languages (verbatim rendering)
      rawPages[lang] = { paragraphs: page.paragraphs };
    }
  }

  // Align segments across languages
  const segments = alignSegments(languageTexts);

  const pageData: PageData = {
    pageNumber,
    totalPages: getTotalPages(allData),
    availableLanguages,
    segments,
    rawPages
  };

  pageCache.set(cacheKey, pageData);
  return pageData;
}

/**
 * Prefetch a page
 */
export function prefetchPage(pageNumber: number): void {
  fetchPage(pageNumber).catch(() => {
    // Silently ignore prefetch errors
  });
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  textCache.clear();
  pageCache.clear();
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(LANGUAGE_FILES);
}
