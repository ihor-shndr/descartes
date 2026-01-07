import { Page, Segment } from '../types/page';

/**
 * Regex to match segment markers like (1), (2), (6a), (6а), (7a), etc.
 * Supports both Latin 'a' and Cyrillic 'а'
 */
const SEGMENT_REGEX = /\((\d+[a-zа-я]?)\)/g;

/**
 * Parsed segment from a single language
 */
interface ParsedSegment {
  id: string;
  marker: string;
  text: string;
}

/**
 * Parse segments from text string
 */
export function parseSegmentsFromText(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const matches = [...text.matchAll(SEGMENT_REGEX)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];

    const id = normalizeSegmentId(match[1]);
    const startIndex = match.index! + match[0].length;
    const endIndex = nextMatch ? nextMatch.index! : text.length;
    const content = text.slice(startIndex, endIndex).trim();

    segments.push({ id, marker: `(${id})`, text: content });
  }

  return segments;
}

/**
 * Normalize segment ID (convert Cyrillic 'а' to Latin 'a')
 */
function normalizeSegmentId(id: string): string {
  return id.replace(/а/g, 'a'); // Cyrillic а -> Latin a
}

/**
 * Join page paragraphs into text string
 * @param page - The page data
 * @param preserveLineBreaks - If true, join with newlines (for source languages)
 */
export function joinPageText(page: Page | undefined, preserveLineBreaks: boolean): string {
  if (!page) return '';

  return page.paragraphs.map((paragraph, index) => {
    const lineJoiner = preserveLineBreaks ? '\n' : ' ';
    const paragraphText = paragraph.lines.join(lineJoiner);

    // Add paragraph separator for new paragraphs (except first)
    if (index > 0 && paragraph.newLine) {
      return preserveLineBreaks ? `\n\n${paragraphText}` : `\n\n${paragraphText}`;
    }
    return paragraphText;
  }).join(preserveLineBreaks ? '\n' : ' ');
}

/**
 * Natural sort comparison for segment IDs
 * Sorts: 1, 2, 6, 6a, 7, 7a, 8, 10, 10a, 11
 */
export function compareSegmentIds(a: string, b: string): number {
  const parseId = (id: string): [number, string] => {
    const match = id.match(/^(\d+)([a-z]?)$/);
    return match ? [parseInt(match[1], 10), match[2] || ''] : [0, ''];
  };

  const [numA, varA] = parseId(a);
  const [numB, varB] = parseId(b);

  if (numA !== numB) return numA - numB;
  return varA.localeCompare(varB);
}

/**
 * Align segments from multiple languages
 */
export function alignSegments(
  languageTexts: Record<string, string>
): Segment[] {
  // Parse segments from each language
  const parsedByLang: Record<string, ParsedSegment[]> = {};
  const allIds = new Set<string>();

  for (const [lang, text] of Object.entries(languageTexts)) {
    const parsed = parseSegmentsFromText(text);
    parsedByLang[lang] = parsed;
    parsed.forEach(seg => allIds.add(seg.id));
  }

  // Sort IDs naturally
  const sortedIds = [...allIds].sort(compareSegmentIds);

  // Build aligned segments
  return sortedIds.map(id => {
    const texts: Record<string, string> = {};

    for (const [lang, parsed] of Object.entries(parsedByLang)) {
      const found = parsed.find(s => s.id === id);
      if (found) {
        texts[lang] = found.text;
      }
    }

    return {
      id,
      marker: `(${id})`,
      texts
    };
  });
}

/**
 * Check if a language code is a source language (preserves line breaks)
 */
export function isSourceLanguage(lang: string): boolean {
  return lang === 'la' || lang === 'fr';
}

/**
 * Check if a language code is a Ukrainian translation
 */
export function isUkrainianTranslation(lang: string): boolean {
  return lang.endsWith('-ua') || lang.startsWith('ua-');
}
