import { useAppStore } from '../../store/app-store';
import { SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId } from '../../utils/text-rendering';
import { SegmentMarker } from '../SegmentMarker';
import clsx from 'clsx';
import { HIGHLIGHT_COLORS } from '../../constants/highlights';

interface SegmentedTextProps {
    text: string;
    initialSegmentId: string | null;
    onSegmentIdChange?: (id: string | null) => void;
}

interface ProcessedPart {
    type: 'marker' | 'text';
    content: string;
    segmentId: string | null;
}

/**
 * Pre-process text into parts with segment IDs assigned.
 * This ensures segment IDs are computed before render, avoiding side effects during render.
 */
function processText(text: string, initialSegmentId: string | null): { parts: ProcessedPart[]; finalSegmentId: string | null } {
    const rawParts = text.split(SEGMENT_MARKER_REGEX);
    const parts: ProcessedPart[] = [];
    let currentSegmentId = initialSegmentId;

    for (const part of rawParts) {
        if (!part) continue;

        if (isSegmentMarker(part)) {
            const id = extractSegmentId(part);
            parts.push({ type: 'marker', content: part, segmentId: id });
            currentSegmentId = id; // Update for subsequent text
        } else {
            parts.push({ type: 'text', content: part, segmentId: currentSegmentId });
        }
    }

    return { parts, finalSegmentId: currentSegmentId };
}

/**
 * Shared component for rendering text with segment markers and highlighting.
 *
 * Handles:
 * - Splitting text by segment markers
 * - Rendering segment markers as superscripts
 * - Highlighting on hover
 * - Highlighting on navigation (from index)
 */
export function SegmentedText({ text, initialSegmentId, onSegmentIdChange }: SegmentedTextProps) {
    const hoveredSegmentId = useAppStore((state) => state.hoveredSegmentId);
    const setHoveredSegment = useAppStore((state) => state.setHoveredSegment);
    const highlightedLocation = useAppStore((state) => state.highlightedLocation);
    const currentPage = useAppStore((state) => state.currentPage);
    const highlightColor = useAppStore((state) => state.highlightColor);

    // Pre-compute segment IDs before rendering (pure computation, no side effects)
    const { parts, finalSegmentId } = processText(text, initialSegmentId);

    // Report final segment ID to parent (for tracking across lines)
    // This is called during render but only affects the next render cycle
    if (onSegmentIdChange && finalSegmentId !== initialSegmentId) {
        onSegmentIdChange(finalSegmentId);
    }

    return (
        <>
            {parts.map((part, partIdx) => {
                if (part.type === 'marker') {
                    return <SegmentMarker key={partIdx} id={part.segmentId!} />;
                }

                const segmentId = part.segmentId;

                return (
                    <span
                        key={partIdx}
                        className={clsx(
                            "transition-colors duration-200 rounded-sm py-0.5 box-decoration-clone",
                            segmentId && (
                                hoveredSegmentId === segmentId ||
                                (highlightedLocation?.segments.includes(segmentId) && highlightedLocation.page === currentPage)
                            ) && HIGHLIGHT_COLORS[highlightColor].segment
                        )}
                        onMouseEnter={() => segmentId && setHoveredSegment(segmentId)}
                        onMouseLeave={() => segmentId && setHoveredSegment(null)}
                    >
                        {part.content}
                    </span>
                );
            })}
        </>
    );
}
