import { useAppStore } from '../../store/app-store';
import { LanguageCode } from '../../types/store';

/**
 * Language labels for display
 */
const LABELS: Record<LanguageCode, string> = {
  la: 'Latin',
  'la-ua': 'Ukrainian (from Latin)',
  fr: 'French',
  'fr-ua': 'Ukrainian (from French)'
};

/**
 * 2x2 visual checkbox grid for language selection
 * Matches the layout structure
 */
export default function LanguageGrid2x2() {
  const selectedLanguages = useAppStore((state) => state.selectedLanguages);
  const toggleLanguage = useAppStore((state) => state.toggleLanguage);

  // Grid layout matching the reader layout
  const gridLanguages: LanguageCode[][] = [
    ['la', 'la-ua'],   // Row 1
    ['fr', 'fr-ua']    // Row 2
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Languages</h3>
      <div className="grid grid-cols-2 gap-3">
        {gridLanguages.flat().map((lang) => {
          const isSelected = selectedLanguages.includes(lang);
          const isOnlyOne = selectedLanguages.length === 1;
          const isDisabled = isSelected && isOnlyOne;

          return (
            <label
              key={lang}
              className={`
                flex items-start p-3 border-2 rounded-lg cursor-pointer
                transition-colors
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => toggleLanguage(lang)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm font-medium">{LABELS[lang]}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        At least one language must be selected
      </p>
    </div>
  );
}
