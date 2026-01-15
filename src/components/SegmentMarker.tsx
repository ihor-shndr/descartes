import { isSegmentMarker, extractSegmentId } from '../utils/text-constants';
import { useAppStore } from '../store/app-store';
import clsx from 'clsx';

interface SegmentMarkerProps {
  id: string;
}

/**
 * Shared component for rendering segment markers as superscript
 * Used in both VerbatimText and SegmentFlow
 * Includes hover handlers for cross-language highlighting
 */
export function SegmentMarker({ id }: SegmentMarkerProps) {
  const hoveredSegmentId = useAppStore((state) => state.hoveredSegmentId);
  const setHoveredSegment = useAppStore((state) => state.setHoveredSegment);

  return (
    <sup
      className={clsx(
        "text-xs text-stone-500 font-normal select-none mx-0.5 transition-colors duration-200 rounded-sm py-0.5 cursor-pointer",
        hoveredSegmentId === id && "bg-yellow-200"
      )}
      onMouseEnter={() => setHoveredSegment(id)}
      onMouseLeave={() => setHoveredSegment(null)}
    >
      ⁽{id}⁾
    </sup>
  );
}

