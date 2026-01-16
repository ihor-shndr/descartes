import { AVAILABLE_LANGUAGES } from '../constants/languages';

/**
 * Get display name for a language code
 */
export function getLanguageLabel(code: string): string {
    const lang = AVAILABLE_LANGUAGES.find(l => l.code === code);
    return lang?.label || code.toUpperCase();
}

/**
 * Check if language uses verbatim layout (preserves exact line breaks and spacing)
 * Currently only Latin uses VerbatimText component
 */
export function usesVerbatimLayout(code: string): boolean {
    return code === 'la';
}

/**
 * Check if language preserves line breaks during text processing
 * Only Latin preserves original line breaks from the historical edition
 * French and Ukrainian translations flow as continuous prose
 */
export function preservesLineBreaks(code: string): boolean {
    return code === 'la';
}

/**
 * Check if language is a Ukrainian translation
 */
export function isUkrainianTranslation(code: string): boolean {
    return code.endsWith('-ua') || code.startsWith('ua-');
}
