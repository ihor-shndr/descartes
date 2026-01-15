import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TextData, LanguageCode } from '../types/text';
import { FlowDirection } from '../types/store';
import { loadAllTexts } from '../services/text-loader';
import { findSegmentIdForLine } from '../utils/text-lookup';

/**
 * Application store interface
 */
interface AppStore {
  // Data
  allTexts: Record<LanguageCode, TextData> | null;
  currentPage: number;
  totalPages: number;

  // Settings (persisted)
  selectedLanguages: LanguageCode[];
  flowDirection: FlowDirection;
  settingsSidebarOpen: boolean;

  // UI State
  hoveredSegmentId: string | null;
  loading: boolean;
  error: string | null;

  // Index Feature
  indexModalOpen: boolean;
  highlightedLocation: { page: number; line: number; segment?: string } | null;

  // Actions
  loadAllTexts: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  toggleLanguage: (lang: LanguageCode) => void;
  setFlowDirection: (dir: FlowDirection) => void;
  toggleSettingsSidebar: () => void;
  setHoveredSegment: (id: string | null) => void;

  // Index Actions
  toggleIndexModal: (isOpen?: boolean) => void;
  navigateToLocation: (page: number, line: number, segment?: string) => void;
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
      selectedLanguages: ['la', 'la-ua'], // Default: Latin + Ukrainian from Latin
      flowDirection: 'top-to-bottom',
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
          const totalPages = Math.max(
            ...Object.values(texts).map((t) => t.pages.length)
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
        set({ currentPage: validPage });
      },

      toggleLanguage: (lang) => {
        const { selectedLanguages } = get();
        if (selectedLanguages.includes(lang)) {
          // Don't remove if it's the only selected language
          if (selectedLanguages.length > 1) {
            set({
              selectedLanguages: selectedLanguages.filter((l) => l !== lang)
            });
          }
        } else {
          set({ selectedLanguages: [...selectedLanguages, lang] });
        }
      },

      setFlowDirection: (dir) => set({ flowDirection: dir }),

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

        let targetSegment = segment;

        // If no segment provided (e.g. Latin term), try to find it from the line number
        if (!targetSegment && allTexts && allTexts['la']) {
          // Looking up in Latin text assuming the index line numbers refer to Latin source lines
          targetSegment = findSegmentIdForLine(allTexts['la'], validPage, line);
        }

        set({
          currentPage: validPage,
          highlightedLocation: { page: validPage, line, segment: targetSegment },
          indexModalOpen: false // Close index when navigating
        });
      }
    }),
    {
      name: 'descartes-reader', // localStorage key
      // Only persist these fields
      partialize: (state) => ({
        selectedLanguages: state.selectedLanguages,
        flowDirection: state.flowDirection,
        currentPage: state.currentPage
      })
    }
  )
);
