import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TextData, LanguageCode } from '../types/text';
import { FlowDirection } from '../types/store';
import { loadAllTexts } from '../services/text-loader';

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

  // Actions
  loadAllTexts: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  toggleLanguage: (lang: LanguageCode) => void;
  setFlowDirection: (dir: FlowDirection) => void;
  toggleSettingsSidebar: () => void;
  setHoveredSegment: (id: string | null) => void;
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

      setHoveredSegment: (id) => set({ hoveredSegmentId: id })
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
