import { useRef, useEffect, useMemo } from 'react';
import { Paragraph } from '../../types/text';
import { useAppStore } from '../../store/app-store';
import { getSourceWidth, SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId } from '../../utils/text-rendering';
import { ParagraphHeading, isHeading } from './ParagraphHeading';
import { SegmentedText } from './SegmentedText';
import clsx from 'clsx';

interface TextUnit {
    text: string;
    shouldIndent: boolean;
    lineNumber?: number;
    isLastInParagraph?: boolean;
    initialSegmentId: string | null; // Pre-computed segment ID for this unit
}

interface ParagraphTextProps {
    paragraphs: Paragraph[];
    language: string;
    /** If true, use verbatim layout: preserve line breaks, show line numbers, fixed width (Latin source text). */
    verbatim: boolean;
}

/**
 * Compute the final segment ID after processing text.
 * Used to track segment IDs across lines.
 */
function computeFinalSegmentId(text: string, initialSegmentId: string | null): string | null {
    const parts = text.split(SEGMENT_MARKER_REGEX);
    let currentSegmentId = initialSegmentId;

    for (const part of parts) {
        if (part && isSegmentMarker(part)) {
            currentSegmentId = extractSegmentId(part);
        }
    }

    return currentSegmentId;
}

/**
 * Pre-process all paragraphs into text units with segment IDs computed.
 * This ensures segment IDs are assigned correctly across lines before rendering.
 */
function preprocessParagraphs(
    paragraphs: Paragraph[],
    preserveLineBreaks: boolean
): { units: TextUnit[]; paragraphIndices: number[] } {
    const allUnits: TextUnit[] = [];
    const paragraphIndices: number[] = []; // Track where each paragraph starts in allUnits
    let lineCounter = 0;
    let currentSegmentId: string | null = null;

    for (const paragraph of paragraphs) {
        // Skip headers - they're handled separately
        if (isHeading(paragraph.type)) {
            paragraphIndices.push(-1); // Mark as header
            continue;
        }

        paragraphIndices.push(allUnits.length);

        if (preserveLineBreaks) {
            // Each line is its own unit
            paragraph.lines.forEach((line, idx) => {
                lineCounter++;
                const hasLeadingSpace = line.startsWith(' ');
                const nextLine = paragraph.lines[idx + 1];
                const isLastInParagraph = !nextLine || nextLine.startsWith(' ');

                allUnits.push({
                    text: line,
                    shouldIndent: hasLeadingSpace,
                    lineNumber: lineCounter,
                    isLastInParagraph,
                    initialSegmentId: currentSegmentId
                });

                // Update segment ID for next unit
                currentSegmentId = computeFinalSegmentId(line, currentSegmentId);
            });
        } else {
            // Group lines into sub-paragraphs by leading spaces
            let currentLines: string[] = [];
            let shouldIndent = false;

            paragraph.lines.forEach((line, idx) => {
                const hasLeadingSpace = line.startsWith(' ');
                const trimmedLine = line.trimStart();

                if (hasLeadingSpace && currentLines.length > 0) {
                    // New sub-paragraph - save current and start new
                    const text = currentLines.join(' ');
                    allUnits.push({
                        text,
                        shouldIndent,
                        initialSegmentId: currentSegmentId
                    });
                    currentSegmentId = computeFinalSegmentId(text, currentSegmentId);

                    currentLines = [trimmedLine];
                    shouldIndent = true;
                } else {
                    if (currentLines.length === 0 && idx === 0) {
                        shouldIndent = hasLeadingSpace;
                    }
                    currentLines.push(trimmedLine);
                }
            });

            // Push last sub-paragraph
            if (currentLines.length > 0) {
                const text = currentLines.join(' ');
                allUnits.push({
                    text,
                    shouldIndent,
                    initialSegmentId: currentSegmentId
                });
                currentSegmentId = computeFinalSegmentId(text, currentSegmentId);
            }
        }
    }

    return { units: allUnits, paragraphIndices };
}

/**
 * Unified text rendering component for both source (Latin) and translation text.
 *
 * Modes:
 * - preserveLineBreaks=true: Each line is its own unit (Latin source)
 * - preserveLineBreaks=false: Lines grouped into sub-paragraphs by leading spaces (translations)
 */
export function ParagraphText({
    paragraphs,
    language,
    verbatim
}: ParagraphTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const highlightedLocation = useAppStore((state) => state.highlightedLocation);
    const currentPage = useAppStore((state) => state.currentPage);

    const shouldScroll = highlightedLocation && highlightedLocation.page === currentPage;

    // Pre-compute all units with segment IDs BEFORE rendering
    const { units: allUnits, paragraphIndices } = useMemo(
        () => preprocessParagraphs(paragraphs, verbatim),
        [paragraphs, verbatim]
    );

    // Scroll to highlighted location - only in verbatim (Latin) view
    // Since index references are line-based for Latin, we scroll Latin into view
    // and let the user see translations naturally in their grid position
    useEffect(() => {
        if (!shouldScroll || !containerRef.current || !verbatim) return;

        if (highlightedLocation?.line) {
            // Latin: scroll to line number
            const element = document.getElementById(`line-${highlightedLocation.line}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [shouldScroll, highlightedLocation, verbatim]);

    const containerWidth = verbatim ? getSourceWidth(language) : undefined;

    // Helper to get units for a specific paragraph
    function getUnitsForParagraph(pIdx: number): TextUnit[] {
        const startIdx = paragraphIndices[pIdx];
        if (startIdx === -1) return []; // Header

        const nextStartIdx = paragraphIndices.slice(pIdx + 1).find(i => i !== -1);
        const endIdx = nextStartIdx !== undefined ? nextStartIdx : allUnits.length;

        return allUnits.slice(startIdx, endIdx);
    }

    return (
        <div
            ref={containerRef}
            className={"font-serif text-lg leading-relaxed text-stone-800 w-full flex justify-center cursor-default"}
            onClick={() => useAppStore.getState().clearHighlight()}
        >
            <div
                className={clsx(
                    verbatim && "pl-10"
                )}
                style={verbatim ? { width: containerWidth } : undefined}
            >
                {paragraphs.map((paragraph, pIdx) => {
                    // Headers
                    if (isHeading(paragraph.type)) {
                        return <ParagraphHeading key={pIdx} paragraph={paragraph} />;
                    }

                    const units = getUnitsForParagraph(pIdx);

                    return (
                        <div key={pIdx} className={verbatim ? "mb-0 w-full" : ""}>
                            {units.map((unit, uIdx) => (
                                <div
                                    key={uIdx}
                                    id={unit.lineNumber ? `line-${unit.lineNumber}` : undefined}
                                    className={clsx(
                                        verbatim
                                            ? clsx(
                                                "relative whitespace-pre-wrap transition-colors duration-1000",
                                                unit.isLastInParagraph ? "justified-line-last" : "justified-line",
                                                unit.shouldIndent && "indent-[1.5em]",
                                                shouldScroll && highlightedLocation?.line === unit.lineNumber && "bg-yellow-100 shadow-sm"
                                            )
                                            : clsx(
                                                "mb-4 w-full justified-text",
                                                unit.shouldIndent && "indent-[1.5em]"
                                            )
                                    )}
                                >
                                    {/* Line number in left margin */}
                                    {verbatim && unit.lineNumber && unit.lineNumber % 5 === 0 && (
                                        <span className="absolute -left-8 text-xs text-stone-400 select-none">
                                            {unit.lineNumber}
                                        </span>
                                    )}

                                    <SegmentedText
                                        text={unit.text}
                                        initialSegmentId={unit.initialSegmentId}
                                    />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
