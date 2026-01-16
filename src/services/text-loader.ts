import { TextData } from '../types/text';
import { AVAILABLE_LANGUAGES, LanguageCode } from '../constants/languages';

/**
 * Load all language files at once
 * @returns Record of language code to text data
 * @throws Error if no files could be loaded
 */
export async function loadAllTexts(): Promise<Record<LanguageCode, TextData>> {
  const results: Partial<Record<LanguageCode, TextData>> = {};

  await Promise.all(
    AVAILABLE_LANGUAGES.map(async ({ code, path }) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load ${code}: ${response.statusText}`);
        }
        results[code] = await response.json();
      } catch (error) {
        console.error(`Error loading ${code}:`, error);
      }
    })
  );

  if (Object.keys(results).length === 0) {
    throw new Error('No language files could be loaded');
  }

  return results as Record<LanguageCode, TextData>;
}
