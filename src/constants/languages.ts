/**
 * All language definitions in one place
 * Single source of truth for: codes, labels, colors, file paths, and display order
 * The array order defines the default layout: TL, TR, BL, BR
 * Source languages (la, fr) have index files; translations do not
 */
export const AVAILABLE_LANGUAGES = [
    { code: 'la', label: 'Latin', textPath: '/descartes/meditations/text/la.json', indexPath: '/descartes/meditations/index/la.json', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { code: 'la-ua', label: 'Ukrainian (from Latin)', textPath: '/descartes/meditations/text/la-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
    { code: 'fr', label: 'French', textPath: '/descartes/meditations/text/fr.json', indexPath: '/descartes/meditations/index/fr.json', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    { code: 'fr-ua', label: 'Ukrainian (from French)', textPath: '/descartes/meditations/text/fr-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

/** Languages with term indices (source languages only) */
export const INDEX_LANGUAGES = AVAILABLE_LANGUAGES.filter((l): l is typeof AVAILABLE_LANGUAGES[number] & { indexPath: string } => 'indexPath' in l);
