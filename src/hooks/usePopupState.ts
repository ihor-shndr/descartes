import { useState } from 'react';
import { PopupState } from '../types/app-state';

interface PopupStateHook {
  popupState: PopupState | null;
  openPopup: (
    segmentId: string,
    tokenIndex: number,
    lang: string,
    event: React.MouseEvent
  ) => void;
  closePopup: () => void;
}

/**
 * Hook for managing language switch popup state
 */
export function usePopupState(): PopupStateHook {
  const [popupState, setPopupState] = useState<PopupState | null>(null);

  const openPopup = (
    segmentId: string,
    tokenIndex: number,
    lang: string,
    event: React.MouseEvent
  ) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupState({
      segmentId,
      tokenIndex,
      lang,
      position: {
        x: rect.left,
        y: rect.bottom
      }
    });
  };

  const closePopup = () => {
    setPopupState(null);
  };

  return { popupState, openPopup, closePopup };
}
