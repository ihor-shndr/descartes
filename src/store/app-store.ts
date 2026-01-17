import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TextData } from '../types/text';
import { LanguageCode, AVAILABLE_LANGUAGES } from '../constants/languages';
import { loadAllTexts } from '../services/text-loader';
import { findSegmentsForLine } from '../utils/text-lookup';

/**
 * Application store interface
 */
interface AppStore {
  // Data
  allTexts: Record<LanguageCode, TextData> | null;
  currentPage: number;
  totalPages: number;

  // Settings (persisted)
  // Fixed array of 4 slots: [TL, TR, BL, BR]
  languageLayout: LanguageCode[];
  settingsSidebarOpen: boolean;

  // UI State
  hoveredSegmentId: string | null;
  loading: boolean;
  error: string | null;

  // Index Feature
  indexModalOpen: boolean;
  /**
   * Highlighted location from index navigation.
   * - `line`: The Latin line number (used for verbatim Latin view)
   * - `segments`: All segments that intersect with this line (used for non-Latin flowing text)
   * 
   * Latin index is line-based, not segment-based. A line may be part of a segment
   * that started earlier, so we highlight all segments that include this line.
   */
  highlightedLocation: { page: number; line: number; segments: string[] } | null;

  // Actions
  loadAllTexts: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  updateLanguageLayout: (layout: LanguageCode[]) => void;
  toggleSettingsSidebar: () => void;
  setHoveredSegment: (id: string | null) => void;

  // Index Actions
  toggleIndexModal: (isOpen?: boolean) => void;
  navigateToLocation: (page: number, line: number, segment?: string) => void;
  clearHighlight: () => void;
}

/**
 * Main application store using Zustand
 * Replaces all custom hooks (useUrlState, usePageData, useHoverState, etc.)
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      allTexts: null,
      currentPage: 1,
      totalPages: 0,
      languageLayout: [...AVAILABLE_LANGUAGES.map(l => l.code)] as LanguageCode[],
      settingsSidebarOpen: false,
      hoveredSegmentId: null,
      loading: false,
      error: null,
      indexModalOpen: false,
      highlightedLocation: null,

      // Actions
      loadAllTexts: async () => {
        set({ loading: true, error: null });
        try {
          const texts = await loadAllTexts();
          // Find the maximum page number across all languages (not the count)
          const totalPages = Math.max(
            ...Object.values(texts).flatMap((t) =>
              t.pages.map(p => p.pageNumber)
            )
          );
          set({ allTexts: texts, totalPages, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      setCurrentPage: (page) => {
        const { totalPages } = get();
        // Clamp page to valid range
        const validPage = Math.max(1, Math.min(page, totalPages || 1));
        // Clear highlight when page changes
        set({ currentPage: validPage, highlightedLocation: null });
      },

      updateLanguageLayout: (layout) => set({ languageLayout: layout }),

      toggleSettingsSidebar: () =>
        set((state) => ({
          settingsSidebarOpen: !state.settingsSidebarOpen
        })),

      setHoveredSegment: (id) => set({ hoveredSegmentId: id }),

      toggleIndexModal: (isOpen) =>
        set((state) => ({
          indexModalOpen: isOpen !== undefined ? isOpen : !state.indexModalOpen
        })),

      navigateToLocation: (page, line, segment) => {
        const { totalPages, allTexts } = get();
        const validPage = Math.max(1, Math.min(page, totalPages || 1));

        let targetSegments: string[] = [];

        if (segment) {
          // If a specific segment is provided (e.g., from French index), use it directly
          targetSegments = [segment];
        } else if (allTexts && allTexts['la']) {
          // Latin index: line-based reference - find ALL segments that include this line
          targetSegments = findSegmentsForLine(allTexts['la'], validPage, line);
        }

        set({
          currentPage: validPage,
          highlightedLocation: { page: validPage, line, segments: targetSegments },
          indexModalOpen: false // Close index when navigating
        });
      },

      clearHighlight: () => set({ highlightedLocation: null })
    }),
    {
      name: 'descartes-reader', // localStorage key
      // Only persist these fields
      partialize: (state) => ({
        languageLayout: state.languageLayout,
        currentPage: state.currentPage
      })
    }
  )
);

