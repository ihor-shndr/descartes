/**
 * Language metadata
 */
export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  displayName: string;
  isTranslation: boolean;
  preserveLineBreaks: boolean;
}

export const LANGUAGES: Record<string, LanguageInfo> = {
  'la-ua': {
    code: 'la-ua',
    name: 'Ukrainian',
    nativeName: 'Українська',
    displayName: 'Ukrainian (from Latin)',
    isTranslation: true,
    preserveLineBreaks: false
  },
  'fr-ua': {
    code: 'fr-ua',
    name: 'Ukrainian',
    nativeName: 'Українська',
    displayName: 'Ukrainian (from French)',
    isTranslation: true,
    preserveLineBreaks: false
  },
  la: {
    code: 'la',
    name: 'Latin',
    nativeName: 'Latina',
    displayName: 'Latin',
    isTranslation: false,
    preserveLineBreaks: true
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    displayName: 'French',
    isTranslation: false,
    preserveLineBreaks: true
  }
};

/**
 * Get language display name
 */
export function getLanguageName(code: string): string {
  return LANGUAGES[code]?.name || code.toUpperCase();
}

/**
 * Get full display name with source info
 */
export function getDisplayName(code: string): string {
  return LANGUAGES[code]?.displayName || code.toUpperCase();
}

/**
 * Get language native name
 */
export function getLanguageNativeName(code: string): string {
  return LANGUAGES[code]?.nativeName || code.toUpperCase();
}

/**
 * Check if language is a Ukrainian translation
 */
export function isUkrainianVariant(code: string): boolean {
  return code.endsWith('-ua');
}

/**
 * Check if language preserves line breaks
 */
export function shouldPreserveLineBreaks(code: string): boolean {
  return LANGUAGES[code]?.preserveLineBreaks ?? false;
}

/**
 * Get all available language codes
 */
export function getAllLanguageCodes(): string[] {
  return Object.keys(LANGUAGES);
}
