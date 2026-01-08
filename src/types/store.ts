import { LanguageCode } from './text';

/**
 * Flow direction for the 2x2 grid layout
 */
export type FlowDirection = 'top-to-bottom' | 'left-to-right';

/**
 * Grid position for language blocks
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * Grid cell configuration
 */
export interface GridCell {
  lang: LanguageCode | null;
}

export type { LanguageCode };
