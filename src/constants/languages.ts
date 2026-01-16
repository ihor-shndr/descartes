/**
 * All language definitions in one place
 * Single source of truth for: codes, labels, colors, file paths, and display order
 * The array order defines the default layout: TL, TR, BL, BR
 */
export const AVAILABLE_LANGUAGES = [
    { code: 'la', label: 'Latin', path: '/descartes/meditations/text/la.json', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { code: 'la-ua', label: 'Ukrainian (from Latin)', path: '/descartes/meditations/text/la-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
    { code: 'fr', label: 'French', path: '/descartes/meditations/text/fr.json', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    { code: 'fr-ua', label: 'Ukrainian (from French)', path: '/descartes/meditations/text/fr-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];
