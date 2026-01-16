import { useEffect } from 'react';
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

  // Get state and actions from Zustand store
  const {
    allTexts,
    currentPage,
    totalPages,
    languageLayout,
    loading,
    error,
    loadAllTexts,
    setCurrentPage
  } = useAppStore();

  // Load all texts on mount
  useEffect(() => {
    if (!allTexts) {
      loadAllTexts();
    }
  }, [allTexts, loadAllTexts]);

  // Sync URL with store (initialize from URL on mount)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const pageNum = pageParam ? parseInt(pageParam, 10) : 1;
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }
  }, [searchParams, currentPage, setCurrentPage]);

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
        <div className="text-lg text-gray-600">Loading texts...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Error loading texts</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  // No data
  if (!allTexts) {
    return null;
  }

  // Process current page with language layout
  const pageData = processPageData(allTexts, currentPage, languageLayout);

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Page {currentPage} not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ReaderHeader
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <SettingsSidebar />

      <TextGrid pageData={pageData} />
    </div>
  );
}
