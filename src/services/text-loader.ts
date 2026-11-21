import { TextData } from '../types/text';
import { IndexData, TermEntry } from '../types/termIndex';
import { AVAILABLE_LANGUAGES, INDEX_LANGUAGES, LanguageCode } from '../constants/languages';

/**
 * Load all language text files
 */
export async function loadAllTexts(): Promise<Record<LanguageCode, TextData>> {
  const results: Partial<Record<LanguageCode, TextData>> = {};

  await Promise.all(
    AVAILABLE_LANGUAGES.map(async ({ code, textPath }) => {
      try {
        const response = await fetch(textPath);
        if (!response.ok) {
          throw new Error(`Failed to load ${code}: ${response.statusText}`);
        }
        results[code] = await response.json();
      } catch (error) {
        console.error(`Error loading ${code}:`, error);
      }
    })
  );

  return results as Record<LanguageCode, TextData>;
}

/**
 * Load term index data for source languages (Latin and French)
 */
export async function loadIndexData(): Promise<IndexData> {
  const [latinData, frenchData] = await Promise.all(
    INDEX_LANGUAGES.map(async ({ code, indexPath }) => {
      const response = await fetch(indexPath);
      if (!response.ok) {
        throw new Error(`Failed to load ${code} index: ${response.statusText}`);
      }
      return response.json() as Promise<TermEntry[]>;
    })
  );

  return { latin: latinData, french: frenchData };
}
