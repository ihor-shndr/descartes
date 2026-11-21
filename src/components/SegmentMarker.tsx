import { useAppStore } from '../store/app-store';
import clsx from 'clsx';
import { HIGHLIGHT_COLORS } from '../constants/highlights';
import { segmentGroupId } from '../utils/text-rendering';

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
  const selectSegmentGroup = useAppStore((state) => state.selectSegmentGroup);
  const highlightedLocation = useAppStore((state) => state.highlightedLocation);
  const currentPage = useAppStore((state) => state.currentPage);
  const highlightColor = useAppStore((state) => state.highlightColor);

  const isHighlighted =
    hoveredSegmentId === id ||
    (highlightedLocation?.segmentGroups.includes(segmentGroupId(id)) && highlightedLocation.page === currentPage);

  return (
    <sup
      data-segment-id={id}
      className={clsx(
        "text-xs text-stone-500 font-normal select-none mx-0.5 transition-colors duration-200 rounded-sm py-0.5 cursor-pointer",
        isHighlighted && HIGHLIGHT_COLORS[highlightColor].segment
      )}
      onMouseEnter={() => setHoveredSegment(id)}
      onMouseLeave={() => setHoveredSegment(null)}
    >
      <button
        type="button"
        aria-label={`Підсвітити групу фрагментів ${segmentGroupId(id)}`}
        onClick={event => {
          event.stopPropagation();
          selectSegmentGroup(id);
        }}
      >⁽{id}⁾</button>
    </sup>
  );
}
