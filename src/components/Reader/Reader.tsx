import { useUrlState } from '../../hooks/useUrlState';
import { usePageData } from '../../hooks/usePageData';
import { useHoverState } from '../../hooks/useHoverState';
import { usePrefetch } from '../../hooks/usePrefetch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { isUkrainianVariant } from '../../utils/language-codes';
import ReaderHeader from './ReaderHeader';
import LanguageBlock from './LanguageBlock';
import LanguageSelector from './LanguageSelector';

export default function Reader() {
  const { page, setPage } = useUrlState();
  const { data, loading, error } = usePageData(page);
  const { hoveredSegmentId, setHoveredSegmentId } = useHoverState();

  // Selected languages to display
  const [selectedLanguages, setSelectedLanguages] = useLocalStorage<string[]>(
    'descartes:selectedLanguages',
    ['la-ua', 'la'] // Default: show Ukrainian from Latin and Latin
  );

  // Prefetch next page
  usePrefetch(page + 1);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      // Remove language (but keep at least one)
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      // Add language
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading page {page}...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">Error loading page {page}</div>
          <div className="text-sm text-gray-600">{error?.message || 'Unknown error'}</div>
        </div>
      </div>
    );
  }

  // Filter to only show languages that exist in the data
  const displayLanguages = selectedLanguages.filter(lang =>
    data.availableLanguages.includes(lang)
  );

  // Separate Ukrainian variants (top row) from source languages (bottom row)
  const ukrainianLangs = displayLanguages.filter(lang => isUkrainianVariant(lang));
  const sourceLangs = displayLanguages.filter(lang => !isUkrainianVariant(lang));

  return (
    <div className="min-h-screen bg-white">
      <ReaderHeader
        page={page}
        totalPages={data.totalPages}
        onPageChange={setPage}
      />

      <LanguageSelector
        availableLanguages={data.availableLanguages}
        selectedLanguages={selectedLanguages}
        onToggleLanguage={toggleLanguage}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Top row - Ukrainian variants */}
        {ukrainianLangs.length > 0 && (
          <div className="grid gap-8 mb-8" style={{ gridTemplateColumns: `repeat(${ukrainianLangs.length}, 1fr)` }}>
            {ukrainianLangs.map((lang) => (
              <LanguageBlock
                key={lang}
                lang={lang}
                segments={data.segments}
                hoveredSegmentId={hoveredSegmentId}
                onHoverSegment={setHoveredSegmentId}
              />
            ))}
          </div>
        )}

        {/* Bottom row - Source languages */}
        {sourceLangs.length > 0 && (
          <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${sourceLangs.length}, 1fr)` }}>
            {sourceLangs.map((lang) => (
              <LanguageBlock
                key={lang}
                lang={lang}
                segments={data.segments}
                hoveredSegmentId={hoveredSegmentId}
                onHoverSegment={setHoveredSegmentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
