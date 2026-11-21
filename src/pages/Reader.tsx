import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/app-store';
import { processPageData } from '../utils/text-processor';
import ReaderHeader from '../components/Reader/ReaderHeader';
import SettingsSidebar from '../components/Settings/SettingsSidebar';
import TextGrid from '../components/Reader/TextGrid';

/**
 * Main Reader component - orchestrates the entire reading interface
 * Replaces complex hook composition with Zustand store
 */
export default function Reader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialized = useRef(false);

  // Get state and actions from Zustand store
  const {
    allTexts,
    currentPage,
    languageLayout,
    loading,
    error,
    loadAllTexts,
    setCurrentPage
  } = useAppStore();
  const availablePages = useMemo(() => {
    const numbers = Object.values(allTexts ?? {}).flatMap(text => text.pages.map(page => page.pageNumber));
    return [...new Set(numbers)].sort((a, b) => a - b);
  }, [allTexts]);

  // Load all texts on mount
  useEffect(() => {
    if (!allTexts) {
      loadAllTexts();
    }
  }, [allTexts, loadAllTexts]);

  // Resolve the initial URL after the available page numbers are known.
  useEffect(() => {
    if (!availablePages.length) return;
    const pageParam = searchParams.get('page');
    const requestedPage = !initialized.current && pageParam !== null ? Number(pageParam) : currentPage;
    initialized.current = true;
    const resolvedPage = availablePages.find(page => page >= requestedPage)
      ?? (Number.isFinite(requestedPage) ? availablePages[availablePages.length - 1] : availablePages[0]);
    if (resolvedPage !== currentPage) {
      setCurrentPage(resolvedPage);
      return;
    }
    if (pageParam !== String(currentPage)) {
      setSearchParams({ page: String(currentPage) }, { replace: true });
    }
  }, [availablePages, currentPage, searchParams, setCurrentPage, setSearchParams]);

  // Update URL when page changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSearchParams({ page: String(newPage) });
    // Reset scroll position to top on page change
    window.scrollTo(0, 0);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Завантаження текстів...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Не вдалося завантажити тексти</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  // No data
  if (!allTexts) {
    return null;
  }
  
  console.log(allTexts)

  // Process current page with language layout
  const pageData = processPageData(allTexts, currentPage, languageLayout);

  console.log(pageData);

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      <ReaderHeader
        page={currentPage}
        availablePages={availablePages}
        onPageChange={handlePageChange}
      />

      <SettingsSidebar />

      <TextGrid pageData={pageData} />
    </div>
  );
}
