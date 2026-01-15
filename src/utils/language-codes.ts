const DISPLAY_NAMES: Record<string, string> = {
  'la-ua': 'Ukrainian (from Latin)',
  'fr-ua': 'Ukrainian (from French)',
  la: 'Latin',
  fr: 'French',
};

export function getDisplayName(code: string): string {
  return DISPLAY_NAMES[code] || code.toUpperCase();
}
