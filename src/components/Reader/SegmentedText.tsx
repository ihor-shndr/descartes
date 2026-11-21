import { useAppStore } from '../../store/app-store';
import { SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId, segmentGroupId } from '../../utils/text-rendering';
import { SegmentMarker } from '../SegmentMarker';
import clsx from 'clsx';
import { HIGHLIGHT_COLORS } from '../../constants/highlights';
import { BookOpen } from 'lucide-react';
import { EditionMarker } from '../../types/text';
import { IndexFilterLanguage } from '../../types/termIndex';

interface SegmentedTextProps {
    text: string;
    initialSegmentId: string | null;
    onSegmentIdChange?: (id: string | null) => void;
    termsBySegment?: Map<string, string[]>;
    editionMarkers?: EditionMarker[];
}

interface ProcessedPart {
    type: 'marker' | 'text' | 'bar';
    content: string;
    segmentId: string | null;
}

/**
 * Pre-process text into parts with segment IDs assigned.
 * This ensures segment IDs are computed before render, avoiding side effects during render.
 */
function processText(text: string, initialSegmentId: string | null): { parts: ProcessedPart[]; finalSegmentId: string | null } {
    const rawParts = text.split(new RegExp(`(${SEGMENT_MARKER_REGEX.source.slice(1, -1)}|\\|)`, 'gi'));
    const parts: ProcessedPart[] = [];
    let currentSegmentId = initialSegmentId;

    for (const part of rawParts) {
        if (!part) continue;

        if (part === '|') {
            parts.push({ type: 'bar', content: part, segmentId: currentSegmentId });
        } else if (isSegmentMarker(part)) {
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
export function SegmentedText({ text, initialSegmentId, onSegmentIdChange, termsBySegment, editionMarkers }: SegmentedTextProps) {
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

    let barIndex = 0;
    const renderEditionMarkers = (bar: number | null) => editionMarkers?.filter(marker => marker.bar === bar).map((marker, index) => (
        <span key={`${marker.label}-${index}`} className={clsx('absolute whitespace-nowrap text-xs font-normal not-italic text-stone-400 select-none', /^[\[<]/.test(marker.label) ? '-right-8' : '-right-16')}>
            {marker.label}
        </span>
    ));

    return (
        <>
            {renderEditionMarkers(null)}
            {parts.map((part, partIdx) => {
                if (part.type === 'bar') {
                    const markers = renderEditionMarkers(barIndex++);
                    return <span key={partIdx}>{part.content}{markers}</span>;
                }
                if (part.type === 'marker') {
                    const id = part.segmentId!;
                    const termIds = termsBySegment?.get(id);
                    return <span key={partIdx} className="inline">
                        <SegmentMarker id={id} />
                        {termIds && <button type="button" className="inline-flex align-super mx-0.5 items-center justify-center rounded-full bg-blue-100 p-1 text-blue-700 hover:bg-blue-200" aria-label={`Показати терміни французького фрагмента ${id}`} title={`Показати терміни французького фрагмента ${id}`} onClick={event => {
                            event.stopPropagation();
                            useAppStore.getState().setIndexFilter({ language: IndexFilterLanguage.French, termIds, segment: id });
                            useAppStore.getState().toggleIndexModal(true);
                        }}><BookOpen size={12} /></button>}
                    </span>;
                }

                const segmentId = part.segmentId;

                return (
                    <span
                        key={partIdx}
                        className={clsx(
                            "transition-colors duration-200 rounded-sm py-0.5 box-decoration-clone",
                            segmentId && (
                                hoveredSegmentId === segmentId ||
                                (highlightedLocation?.segmentGroups.includes(segmentGroupId(segmentId)) && highlightedLocation.page === currentPage)
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
