/**
 * Shared constants for text rendering
 */

/**
 * Regular expression for matching segment markers like (1), (6a), (10)
 */
export const SEGMENT_MARKER_REGEX = /(\(\d+[a-zа-я]?\))/gi;

/**
 * Fixed width for Latin source language
 * Only Latin uses fixed width; French and Ukrainian use full container width
 */
const LATIN_WIDTH = '60ch';

/**
 * Check if a string matches segment marker pattern
 */
export function isSegmentMarker(text: string): boolean {
  return /^\(\d+[a-zа-я]?\)$/i.test(text);
}

/**
 * Extract segment ID from marker (e.g., "(1)" -> "1", "(6a)" -> "6a")
 */
export function extractSegmentId(marker: string): string {
  return marker.slice(1, -1);
}

/**
 * Check if a language code requires verbatim rendering (only Latin)
 * French flows like Ukrainian translations
 */
export function isSourceLanguage(code: string): boolean {
  return code === 'la';
}

/**
 * Get container width for Latin text (only language using VerbatimText)
 */
export function getSourceWidth(_languageCode: string): string {
  return LATIN_WIDTH;
}
