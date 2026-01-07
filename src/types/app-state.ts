/**
 * ColumnLanguage represents the language assigned to a column
 * null means the column is empty
 */
export type ColumnLanguage = string | null;

/**
 * PopupState represents the state of the language switch popup
 */
export interface PopupState {
  segmentId: string;         // ID of the segment containing the clicked token
  tokenIndex: number;        // Index of the clicked token
  lang: string;              // Current language of the column
  position: {                // Position for popup placement
    x: number;
    y: number;
  };
}

/**
 * ReaderPreferences represents user preferences persisted to localStorage
 */
export interface ReaderPreferences {
  columns: ColumnLanguage[];   // Array of languages (max 4)
  lastPage: number;            // Last visited page
}
