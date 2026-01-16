import { useRef, useEffect } from 'react';
import { Paragraph } from '../../types/text';
import { useAppStore } from '../../store/app-store';
import { SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId } from '../../utils/text-rendering';
import { SegmentMarker } from '../SegmentMarker';
import clsx from 'clsx';

interface SegmentFlowProps {
    paragraphs: Paragraph[];
}

/**
 * Renders Ukrainian translation text with:
 * - Continuous flowing text (lines join with spaces)
 * - Serif font (PT Serif for Cyrillic support)
 * - Superscript markers before each segment
 * - Full container width
 * - Justified alignment with proper last-line handling
 */
export function SegmentFlow({ paragraphs }: SegmentFlowProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const hoveredSegmentId = useAppStore((state) => state.hoveredSegmentId);
    const setHoveredSegment = useAppStore((state) => state.setHoveredSegment);

    // Highlight/Scroll feature
    const highlightedLocation = useAppStore((state) => state.highlightedLocation);
    const currentPage = useAppStore((state) => state.currentPage);

    useEffect(() => {
        if (highlightedLocation && highlightedLocation.page === currentPage && highlightedLocation.segment && containerRef.current) {
            const marker = containerRef.current.querySelector(`[data-segment-id="${highlightedLocation.segment}"]`);
            if (marker) {
                marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: Trigger a visual flash here if needed, but the scroll guides the eye
            }
        }
    }, [highlightedLocation, currentPage]);

    return (
        <div ref={containerRef} className="font-serif text-lg leading-relaxed text-stone-800 w-full" style={{ fontFamily: '"PT Serif", "Crimson Text", serif' }}>
            {(() => {
                let currentSegmentId: string | null = null;

                return paragraphs.map((paragraph, pIdx) => {
                    const isH1 = paragraph.type === 'h1';
                    const isH2 = paragraph.type === 'h2';
                    const isH3 = paragraph.type === 'h3';

                    // Headers
                    if (isH1 || isH2 || isH3) {
                        return (
                            <div
                                key={pIdx}
                                className={clsx(
                                    "text-center max-w-md mx-auto",
                                    isH1 ? "text-3xl font-bold uppercase tracking-widest my-8" : isH2 ? "text-xl italic my-6" : "text-lg my-5"
                                )}
                            >
                                {paragraph.lines.join(' ')}
                            </div>
                        );
                    }

                    // Split into sub-paragraphs based on leading spaces
                    // Track which original lines start each sub-paragraph for indent detection
                    const subParagraphs: { lines: string[]; shouldIndent: boolean }[] = [];
                    let currentSubPara: string[] = [];
                    let currentShouldIndent = false;

                    paragraph.lines.forEach((line, idx) => {
                        const hasLeadingSpace = line.startsWith(' ');
                        const trimmedLine = line.trimStart();

                        if (hasLeadingSpace && currentSubPara.length > 0) {
                            // New paragraph - save current and start new
                            subParagraphs.push({ lines: currentSubPara, shouldIndent: currentShouldIndent });
                            currentSubPara = [trimmedLine];
                            currentShouldIndent = true; // New paragraphs get indented
                        } else {
                            // Continue current paragraph or start first one
                            if (currentSubPara.length === 0 && idx === 0) {
                                currentShouldIndent = hasLeadingSpace; // First line sets indent for first paragraph
                            }
                            currentSubPara.push(trimmedLine);
                        }
                    });

                    // Push last sub-paragraph
                    if (currentSubPara.length > 0) {
                        subParagraphs.push({ lines: currentSubPara, shouldIndent: currentShouldIndent });
                    }

                    // Render each sub-paragraph
                    return (
                        <div key={pIdx}>
                            {subParagraphs.map((subPara, subIdx) => {
                                const fullText = subPara.lines.join(' ');
                                const parts = fullText.split(SEGMENT_MARKER_REGEX);

                                return (
                                    <div
                                        key={subIdx}
                                        className={clsx(
                                            "mb-4 w-full justified-text",
                                            subPara.shouldIndent && "indent-[1.5em]"
                                        )}
                                    >
                                        {parts.map((part, partIdx) => {
                                            if (!part) return null;

                                            // Render marker as superscript
                                            if (isSegmentMarker(part)) {
                                                const id = extractSegmentId(part);
                                                currentSegmentId = id; // Update running state
                                                return <SegmentMarker key={partIdx} id={id} />;
                                            }

                                            // Text segment - use running state
                                            const segmentId = currentSegmentId;

                                            return (
                                                <span
                                                    key={partIdx}
                                                    className={clsx(
                                                        "transition-colors duration-200 rounded-sm py-0.5 box-decoration-clone",
                                                        segmentId && (
                                                            hoveredSegmentId === segmentId ||
                                                            (highlightedLocation?.segment === segmentId && highlightedLocation.page === currentPage)
                                                        ) && "bg-yellow-200"
                                                    )}
                                                    onMouseEnter={() => segmentId && setHoveredSegment(segmentId)}
                                                    onMouseLeave={() => segmentId && setHoveredSegment(null)}
                                                >
                                                    {part}
                                                </span>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                });
            })()}
        </div>
    );
}
