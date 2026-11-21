import { IndexLanguage } from '../types/termIndex';

/**
 * All language definitions in one place
 * Single source of truth for: codes, labels, colors, file paths, and display order
 * The array order defines the default layout: TL, TR, BL, BR
 * Source languages (la, fr) have index data; translations do not
 */
export const AVAILABLE_LANGUAGES = [
    { code: IndexLanguage.Latin, label: 'Латина', textPath: '/descartes/meditations/text/la.json', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { code: 'la-ua', label: 'Українська (з латини)', textPath: '/descartes/meditations/text/la-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
    { code: IndexLanguage.French, label: 'Французька', textPath: '/descartes/meditations/text/fr.json', color: 'bg-purple-50 text-purple-900 border-purple-200' },
    { code: 'fr-ua', label: 'Українська (з французької)', textPath: '/descartes/meditations/text/fr-ua.json', color: 'bg-blue-50 text-blue-900 border-blue-200' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

export const INDEX_GRAPH_PATH = '/descartes/meditations/index/graph.json';
