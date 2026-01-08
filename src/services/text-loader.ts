import { TextData, LanguageCode } from '../types/text';

/**
 * Mapping of language codes to their JSON file paths
 */
const LANGUAGE_FILES: Record<LanguageCode, string> = {
  'la': './texts/la.json',
  'la-ua': './texts/la-ua.json',
  'fr': './texts/fr.json',
  'fr-ua': './texts/fr-ua.json'
};

/**
 * Load all language files at once
 * @returns Record of language code to text data
 * @throws Error if no files could be loaded
 */
export async function loadAllTexts(): Promise<Record<LanguageCode, TextData>> {
  const results: Partial<Record<LanguageCode, TextData>> = {};

  await Promise.all(
    Object.entries(LANGUAGE_FILES).map(async ([lang, path]) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${lang}: ${response.statusText}`);
        }
        results[lang as LanguageCode] = await response.json();
      } catch (error) {
        console.error(`Error loading ${lang}:`, error);
      }
    })
  );

  if (Object.keys(results).length === 0) {
    throw new Error('No language files could be loaded');
  }

  return results as Record<LanguageCode, TextData>;
}
