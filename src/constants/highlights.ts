export type HighlightColor = 'gold' | 'sky' | 'mint';

export const HIGHLIGHT_COLORS: Record<HighlightColor, { segment: string; line: string }> = {
  gold: { segment: 'bg-yellow-200', line: 'bg-yellow-100' },
  sky: { segment: 'bg-blue-200', line: 'bg-blue-100' },
  mint: { segment: 'bg-green-200', line: 'bg-green-100' }
};

export const HIGHLIGHT_OPTIONS: { value: HighlightColor; label: string }[] = [
  { value: 'gold', label: '🟡 Gold' },
  { value: 'sky', label: '🔵 Sky' },
  { value: 'mint', label: '🟢 Mint' }
];
