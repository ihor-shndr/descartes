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

  // Sync URL with store (bidirectional)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;

    // If URL page is different from store, update URL to match store
    if (urlPage !== currentPage && currentPage > 0) {
      setSearchParams({ page: String(currentPage) });
    }
  }, [currentPage, searchParams, setSearchParams]);

  // Initialize from URL on mount
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  
  console.log(allTexts)

  // Process current page with language layout
  const pageData = processPageData(allTexts, currentPage, languageLayout);

  console.log(pageData);

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
