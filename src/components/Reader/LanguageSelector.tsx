import { getDisplayName } from '../../utils/language-codes';

interface LanguageSelectorProps {
  availableLanguages: string[];
  selectedLanguages: string[];
  onToggleLanguage: (lang: string) => void;
}

export default function LanguageSelector({
  availableLanguages,
  selectedLanguages,
  onToggleLanguage
}: LanguageSelectorProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 py-3 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-700">Select languages:</span>
          <div className="flex gap-4">
            {availableLanguages.map(lang => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={() => onToggleLanguage(lang)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {getDisplayName(lang)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
