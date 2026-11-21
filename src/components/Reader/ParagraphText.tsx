import { useRef, useEffect, useMemo } from 'react';
import { EditionMarker, Paragraph } from '../../types/text';
import { useAppStore } from '../../store/app-store';
import { getSourceWidth, SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId } from '../../utils/text-rendering';
import { ParagraphHeading, isHeading } from './ParagraphHeading';
import { SegmentedText } from './SegmentedText';
import clsx from 'clsx';
import { IndexData, IndexLanguage, IndexNodeType, TITLE_LINE_NUMBER } from '../../types/termIndex';
import { HIGHLIGHT_COLORS } from '../../constants/highlights';
import { getLocationTermIds } from '../../utils/index-graph';
import { IndexLineButton } from './IndexLineButton';

interface TextUnit {
    text: string;
    shouldIndent: boolean;
    lineNumber?: number;
    isLastInParagraph?: boolean;
    initialSegmentId: string | null; // Pre-computed segment ID for this unit
    editionMarkers?: EditionMarker[];
}

interface ParagraphTextProps {
    paragraphs: Paragraph[];
    language: string;
    /** If true, use verbatim layout: preserve line breaks, show line numbers, fixed width (Latin source text). */
    verbatim: boolean;
}

function buildTermsByLineMap(indexData: IndexData, page: number): Map<number, string[]> {
    const map = new Map<number, string[]>();

    for (const location of indexData.nodes) {
        if (location.type !== IndexNodeType.Location || location.page !== page || location.segment || location.line === undefined) continue;
        const terms = getLocationTermIds(indexData, IndexLanguage.Latin, page, location.line);
        if (terms.length) map.set(location.line, terms);
    }

    return map;
}

function buildTermsBySegmentMap(indexData: IndexData, page: number): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const location of indexData.nodes) {
        if (location.type !== IndexNodeType.Location || location.page !== page || !location.segment) continue;
        const terms = getLocationTermIds(indexData, IndexLanguage.French, page, location.segment);
        if (terms.length) map.set(location.segment, terms);
    }
    return map;
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
        if (preserveLineBreaks && paragraph.startLine !== undefined) {
            lineCounter = paragraph.startLine - 1;
        }
        // Skip headers - they're handled separately
        if (isHeading(paragraph.type)) {
            currentSegmentId = computeFinalSegmentId(paragraph.lines.map(line => line.text).join(' '), currentSegmentId);
            if (preserveLineBreaks && paragraph.startLine !== undefined) {
                lineCounter += paragraph.lines.length;
            }
            paragraphIndices.push(-1); // Mark as header
            continue;
        }

        paragraphIndices.push(allUnits.length);

        if (preserveLineBreaks) {
            // Each line is its own unit
            paragraph.lines.forEach(({ text, editionMarkers }, idx) => {
                lineCounter++;
                const hasLeadingSpace = text.startsWith(' ');
                const nextLine = paragraph.lines[idx + 1];
                const isLastInParagraph = !nextLine?.text || nextLine.text.startsWith(' ');

                allUnits.push({
                    text,
                    editionMarkers,
                    shouldIndent: hasLeadingSpace,
                    lineNumber: lineCounter,
                    isLastInParagraph,
                    initialSegmentId: currentSegmentId
                });

                // Update segment ID for next unit
                currentSegmentId = computeFinalSegmentId(text, currentSegmentId);
            });
        } else {
            // Group lines into sub-paragraphs by leading spaces
            let currentLines: string[] = [];
            let currentMarkers: EditionMarker[] = [];
            let barCount = 0;
            let shouldIndent = false;

            paragraph.lines.forEach(({ text, editionMarkers }, idx) => {
                const hasLeadingSpace = text.startsWith(' ');
                const trimmedLine = text.trimStart();

                if (hasLeadingSpace && currentLines.length > 0) {
                    // New sub-paragraph - save current and start new
                    const text = currentLines.join(' ');
                    allUnits.push({
                        text,
                        editionMarkers: currentMarkers,
                        shouldIndent,
                        initialSegmentId: currentSegmentId
                    });
                    currentSegmentId = computeFinalSegmentId(text, currentSegmentId);

                    currentLines = [trimmedLine];
                    currentMarkers = [];
                    barCount = 0;
                    shouldIndent = true;
                } else {
                    if (currentLines.length === 0 && idx === 0) {
                        shouldIndent = hasLeadingSpace;
                    }
                    currentLines.push(trimmedLine);
                }
                for (const marker of editionMarkers ?? []) {
                    currentMarkers.push({ ...marker, bar: marker.bar === null ? null : marker.bar + barCount });
                }
                barCount += (text.match(/\|/g) ?? []).length;
            });

            // Push last sub-paragraph
            if (currentLines.length > 0) {
                const text = currentLines.join(' ');
                allUnits.push({
                    text,
                    editionMarkers: currentMarkers,
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
    const indexData = useAppStore((state) => state.indexData);
    const indexLoading = useAppStore((state) => state.indexLoading);
    const indexError = useAppStore((state) => state.indexError);
    const loadIndexData = useAppStore((state) => state.loadIndexData);
    const showIndexHighlights = useAppStore((state) => state.showIndexHighlights);
    const highlightColor = useAppStore((state) => state.highlightColor);
    const highlightWholeLine = highlightedLocation?.segmentGroups.length === 0;

    const shouldScroll = highlightedLocation && highlightedLocation.page === currentPage;

    // Pre-compute all units with segment IDs BEFORE rendering
    const { units: allUnits, paragraphIndices } = useMemo(
        () => preprocessParagraphs(paragraphs, verbatim),
        [paragraphs, verbatim]
    );

    // Preload index data when line markers are requested
    useEffect(() => {
        if ((language === IndexLanguage.Latin || language === IndexLanguage.French) && showIndexHighlights && !indexData && !indexLoading && !indexError) {
            loadIndexData();
        }
    }, [language, showIndexHighlights, indexData, indexLoading, indexError, loadIndexData]);

    const termsByLine = useMemo(() => {
        if (!indexData || language !== IndexLanguage.Latin || !showIndexHighlights) return new Map<number, string[]>();
        return buildTermsByLineMap(indexData, currentPage);
    }, [indexData, currentPage, language, showIndexHighlights]);

    const termsBySegment = useMemo(() => {
        if (!indexData || language !== IndexLanguage.French || !showIndexHighlights) return undefined;
        return buildTermsBySegmentMap(indexData, currentPage);
    }, [indexData, currentPage, language, showIndexHighlights]);

    useEffect(() => {
        if (!shouldScroll || !containerRef.current || !highlightedLocation) return;

        if (highlightedLocation.segment && language === IndexLanguage.French) {
            const markers = containerRef.current.querySelectorAll('[data-segment-id]');
            const marker = Array.from(markers).find(element => element.getAttribute('data-segment-id') === highlightedLocation.segment);
            marker?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!highlightedLocation.segment && highlightedLocation.line !== null && verbatim) {
            if (highlightedLocation.line === TITLE_LINE_NUMBER) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                document.getElementById(`line-${highlightedLocation.line}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [shouldScroll, highlightedLocation, verbatim, language]);

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
                    verbatim ? "pl-16 pr-16" : language === IndexLanguage.French && "pr-16"
                )}
                style={verbatim ? { width: `calc(${containerWidth} + 6rem)` } : undefined}
            >
                {paragraphs.map((paragraph, pIdx) => {
                    // Headers
                    if (isHeading(paragraph.type)) {
                        return <ParagraphHeading key={pIdx} paragraph={paragraph} termsBySegment={termsBySegment} termsByLine={termsByLine} showEditionMarkers={language === IndexLanguage.Latin || language === IndexLanguage.French} />;
                    }

                    const units = getUnitsForParagraph(pIdx);

                    return (
                        <div key={pIdx} className={verbatim ? "mb-0 w-full" : ""}>
                            {units.map((unit, uIdx) => {
                                const isLatinWithHighlights = verbatim && language === IndexLanguage.Latin && showIndexHighlights;
                                const lineTermIds = isLatinWithHighlights && unit.lineNumber ? termsByLine.get(unit.lineNumber) : undefined;

                                return (
                                    <div
                                        key={uIdx}
                                        id={unit.lineNumber ? `line-${unit.lineNumber}` : undefined}
                                        className={clsx(
                                            verbatim
                                            ? clsx(
                                                    "relative whitespace-pre-wrap transition-colors duration-1000",
                                                    unit.isLastInParagraph ? "justified-line-last" : "justified-line",
                                                    unit.shouldIndent && "indent-[1.5em]",
                                                    shouldScroll && highlightWholeLine && highlightedLocation?.line === unit.lineNumber && `${HIGHLIGHT_COLORS[highlightColor].line} shadow-sm`
                                                )
                                                : clsx(
                                                    "relative mb-4 w-full justified-text",
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
                                            termsBySegment={termsBySegment}
                                            editionMarkers={language === IndexLanguage.Latin || language === IndexLanguage.French ? unit.editionMarkers : undefined}
                                        />

                                        {lineTermIds?.length && unit.lineNumber !== undefined ? (
                                            <IndexLineButton lineNumber={unit.lineNumber} termIds={lineTermIds} />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
