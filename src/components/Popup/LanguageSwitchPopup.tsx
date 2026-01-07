import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PopupState } from '../../types/app-state';
import { getLanguageName } from '../../utils/language-codes';

interface LanguageSwitchPopupProps extends PopupState {
  availableLanguages: string[];
  onSelectLanguage: (lang: string) => void;
  onClose: () => void;
}

export default function LanguageSwitchPopup({
  position,
  lang: currentLang,
  availableLanguages,
  onSelectLanguage,
  onClose
}: LanguageSwitchPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);

    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-50"
      style={{
        top: position.y + 10,
        left: position.x
      }}
    >
      <div className="text-xs font-sans text-gray-500 mb-2">Switch to:</div>
      <div className="flex flex-col gap-1">
        {availableLanguages
          .filter(lang => lang !== currentLang)
          .map(lang => (
            <button
              key={lang}
              onClick={() => onSelectLanguage(lang)}
              className="px-3 py-1.5 text-sm font-sans hover:bg-gray-100 rounded text-left transition-colors"
            >
              {getLanguageName(lang)}
            </button>
          ))}
      </div>
    </div>,
    document.body
  );
}
