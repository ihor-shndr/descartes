import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TextData } from '../types/text';
import { LanguageCode, AVAILABLE_LANGUAGES } from '../constants/languages';
import { loadAllTexts, loadIndexData as fetchIndexData } from '../services/text-loader';
import { findSegmentsForLine } from '../utils/text-lookup';
import { segmentGroupId } from '../utils/text-rendering';
import { IndexData } from '../types/termIndex';
import { HighlightColor } from '../constants/highlights';

type IndexFilter =
  | { language: 'latin'; termIds: string[]; sourceLine: number }
  | { language: 'french'; termIds: string[]; segment: string };

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
  indexData: IndexData | null;
  indexLoading: boolean;
  indexError: string | null;
  indexFilter: IndexFilter | null;
  showIndexHighlights: boolean;
  highlightColor: HighlightColor;

  /**
   * Index navigation can also specify a scroll target. Clicking a marker
   * selects its group in place.
   */
  highlightedLocation: { page: number; line: number | null; segmentGroups: string[]; segment?: string } | null;

  // Actions
  loadAllTexts: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  updateLanguageLayout: (layout: LanguageCode[]) => void;
  toggleSettingsSidebar: () => void;
  setHoveredSegment: (id: string | null) => void;
  selectSegmentGroup: (id: string) => void;

  // Index Actions
  loadIndexData: () => Promise<void>;
  toggleIndexModal: (isOpen?: boolean) => void;
  setIndexFilter: (filter: IndexFilter | null) => void;
  setShowIndexHighlights: (value: boolean) => void;
  setHighlightColor: (color: HighlightColor) => void;
  navigateToLocation: (page: number, line: number, segment?: string, alignedSegment?: string) => void;
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
      indexData: null,
      indexLoading: false,
      indexError: null,
      indexFilter: null,
      showIndexHighlights: false,
      highlightColor: 'gold',
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
      selectSegmentGroup: (id) => set(state => ({
        highlightedLocation: { page: state.currentPage, line: null, segmentGroups: [segmentGroupId(id)] }
      })),

      loadIndexData: async () => {
        const { indexData, indexLoading } = get();
        if (indexData || indexLoading) return;

        set({ indexLoading: true, indexError: null });
        try {
          const data = await fetchIndexData();
          set({ indexData: data, indexLoading: false });
        } catch (error) {
          set({ indexError: (error as Error).message, indexLoading: false });
        }
      },

      toggleIndexModal: (isOpen) =>
        set((state) => ({
          indexModalOpen: isOpen !== undefined ? isOpen : !state.indexModalOpen,
          indexFilter: isOpen === false ? null : state.indexFilter
        })),

      setIndexFilter: (filter) => set({ indexFilter: filter }),

      setShowIndexHighlights: (value) => set({ showIndexHighlights: value }),
      setHighlightColor: (color) => set({ highlightColor: color }),

      navigateToLocation: (page, line, segment, alignedSegment) => {
        const { totalPages, allTexts } = get();
        const validPage = Math.max(1, Math.min(page, totalPages || 1));

        let targetSegments: string[] = [];

        if (segment) {
          // If a specific segment is provided (e.g., from French index), use it directly
          targetSegments = [segment];
        } else if (alignedSegment) {
          targetSegments = [alignedSegment];
        } else if (allTexts && allTexts['la']) {
          // Latin index: line-based reference - find ALL segments that include this line
          targetSegments = findSegmentsForLine(allTexts['la'], validPage, line);
        }

        set({
          currentPage: validPage,
          highlightedLocation: {
            page: validPage,
            line,
            segmentGroups: [...new Set(targetSegments.map(segmentGroupId))],
            segment
          },
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
        currentPage: state.currentPage,
        showIndexHighlights: state.showIndexHighlights,
        highlightColor: state.highlightColor
      })
    }
  )
);
