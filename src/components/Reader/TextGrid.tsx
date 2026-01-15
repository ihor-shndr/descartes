import { LanguageCode, FlowDirection } from '../../types/store';
import { GridCell } from '../../types/store';
import { LanguageBlock } from './LanguageBlock';
import { ProcessedPageData } from '../../utils/text-processor';

interface TextGridProps {
  flowDirection: FlowDirection;
  selectedLanguages: LanguageCode[];
  pageData: ProcessedPageData;
}

/**
 * 2x2 Grid layout component with configurable flow direction
 * Supports two layout modes:
 * - top-to-bottom: Row 1 (la, la-ua), Row 2 (fr, fr-ua)
 * - left-to-right: Col 1 (la, fr), Col 2 (la-ua, fr-ua)
 */
export default function TextGrid({
  flowDirection,
  selectedLanguages,
  pageData
}: TextGridProps) {
  const grid = computeGridLayout(selectedLanguages, flowDirection);

  return (
    <div className="w-full px-8 py-8">
      <div className="grid grid-cols-2 gap-8 items-start">
        {grid.map((cell, index) => {
          if (!cell.lang) {
            // Empty cell - render placeholder but don't show content
            return <div key={index} className="min-h-[400px]" />;
          }

          const rawPage = pageData.rawPages[cell.lang];
          if (!rawPage) {
            return <div key={index} className="min-h-[400px]" />;
          }

          return (
            <LanguageBlock
              key={cell.lang}
              language={cell.lang}
              paragraphs={rawPage.paragraphs}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compute 2x2 grid layout based on flow direction
 * @param languages - Selected languages to display
 * @param flowDirection - Layout flow direction
 * @returns Array of 4 grid cells (row-major order: [0,0], [0,1], [1,0], [1,1])
 */
function computeGridLayout(
  languages: LanguageCode[],
  flowDirection: FlowDirection
): GridCell[] {
  const grid: GridCell[] = [
    { lang: null }, // [0,0]
    { lang: null }, // [0,1]
    { lang: null }, // [1,0]
    { lang: null }  // [1,1]
  ];

  if (flowDirection === 'top-to-bottom') {
    // Row 1: Latin languages (la, la-ua)
    // Row 2: French languages (fr, fr-ua)
    const latinLangs = languages.filter((l) => l === 'la' || l === 'la-ua');
    const frenchLangs = languages.filter((l) => l === 'fr' || l === 'fr-ua');

    // Sort: source first, then translation
    const sortedLatin = sortBySourceFirst(latinLangs);
    const sortedFrench = sortBySourceFirst(frenchLangs);

    // Assign to grid
    if (sortedLatin[0]) grid[0].lang = sortedLatin[0];
    if (sortedLatin[1]) grid[1].lang = sortedLatin[1];
    if (sortedFrench[0]) grid[2].lang = sortedFrench[0];
    if (sortedFrench[1]) grid[3].lang = sortedFrench[1];
  } else {
    // left-to-right
    // Column 1: Source languages (la, fr)
    // Column 2: Translations (la-ua, fr-ua)
    const sources = languages.filter((l) => l === 'la' || l === 'fr');
    const translations = languages.filter((l) => l === 'la-ua' || l === 'fr-ua');

    // Assign to grid (column-major within constraint)
    if (sources[0]) grid[0].lang = sources[0];
    if (sources[1]) grid[2].lang = sources[1];
    if (translations[0]) grid[1].lang = translations[0];
    if (translations[1]) grid[3].lang = translations[1];
  }

  return grid;
}

/**
 * Sort languages with source first, then translation
 */
function sortBySourceFirst(langs: LanguageCode[]): LanguageCode[] {
  return langs.sort((a, b) => {
    const aIsTranslation = a.includes('-ua');
    const bIsTranslation = b.includes('-ua');
    if (aIsTranslation && !bIsTranslation) return 1;
    if (!aIsTranslation && bIsTranslation) return -1;
    return 0;
  });
}
