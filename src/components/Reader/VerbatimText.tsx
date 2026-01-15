import { Paragraph } from '../../types/text';
import { useAppStore } from '../../store/app-store';
import { SEGMENT_MARKER_REGEX, isSegmentMarker, extractSegmentId, getSourceWidth } from '../../utils/text-constants';
import { SegmentMarker, HeaderWithMarkers } from '../shared/TextMarkers';
import clsx from 'clsx';

interface VerbatimTextProps {
    paragraphs: Paragraph[];
    language: string;
}

/**
 * Renders Latin source text with:
 * - Fixed width container (60ch) centered in cell
 * - Line numbers every 5th line
 * - Preserved line breaks from original 1642 edition
 * - Inline superscript markers
 * - Book-style justified text (except last line of paragraphs)
 */
export function VerbatimText({ paragraphs, language }: VerbatimTextProps) {
    const hoveredSegmentId = useAppStore((state) => state.hoveredSegmentId);
    const setHoveredSegment = useAppStore((state) => state.setHoveredSegment);

    const containerWidth = getSourceWidth(language);

    let lineCounter = 0; // Track line numbers across all paragraphs
    let currentSegmentId: string | null = null; // Track segment ID across paragraphs and lines

    return (
        <div className="w-full flex justify-center">
            <div
                className="font-serif text-lg leading-relaxed text-stone-800 pl-10"
                style={{ width: containerWidth, fontFamily: '"Crimson Text", serif' }}
            >
                {paragraphs.map((paragraph, pIdx) => {
                    const isH1 = paragraph.type === 'h1';
                    const isH2 = paragraph.type === 'h2';
                    const isH3 = paragraph.type === 'h3';

                    // Headers
                    if (isH1) {
                        return (
                            <div key={pIdx} className="text-center text-3xl font-bold uppercase tracking-widest my-8 max-w-md mx-auto">
                                {paragraph.lines.join(' ')}
                            </div>
                        );
                    }

                    if (isH2) {
                        return (
                            <HeaderWithMarkers
                                key={pIdx}
                                lines={paragraph.lines}
                                className="text-center text-xl italic my-6 max-w-md mx-auto"
                            />
                        );
                    }

                    if (isH3) {
                        return (
                            <HeaderWithMarkers
                                key={pIdx}
                                lines={paragraph.lines}
                                className="text-center text-lg my-5 max-w-md mx-auto"
                            />
                        );
                    }

                    // Regular paragraph
                    return (
                        <div key={pIdx} className="mb-0 w-full">
                            {paragraph.lines.map((line, lIdx) => {
                                lineCounter++;
                                const showLineNumber = lineCounter % 5 === 0;
                                const hasLeadingSpace = line.startsWith(' ');
                                const isNewPara = hasLeadingSpace;

                                // Check if this is the last line of a paragraph:
                                // - next line starts with space (new paragraph)
                                // - or this is the last line of the paragraph block
                                const nextLine = paragraph.lines[lIdx + 1];
                                const isLastLineOfPara = !nextLine || nextLine.startsWith(' ');

                                const parts = line.split(SEGMENT_MARKER_REGEX);

                                return (
                                    <div
                                        key={lIdx}
                                        className={clsx(
                                            "relative whitespace-pre-wrap",
                                            isLastLineOfPara ? "justified-line-last" : "justified-line",
                                            isNewPara && "indent-[1.5em]"
                                        )}
                                    >
                                        {/* Line number in left margin */}
                                        {showLineNumber && (
                                            <span className="absolute -left-8 text-xs text-stone-400 select-none">
                                                {lineCounter}
                                            </span>
                                        )}

                                        {parts.map((part, partIdx) => {
                                            if (!part) return null;
                                            
                                            // Render marker as superscript and update current segment
                                            if (isSegmentMarker(part)) {
                                                const id = extractSegmentId(part);
                                                currentSegmentId = id; // Update segment ID for subsequent text
                                                return <SegmentMarker key={partIdx} id={id} />;
                                            }

                                            // Text segment with hover - use current segment ID from marker tracking
                                            // This allows hover to work across line breaks in Latin text
                                            const segmentId = currentSegmentId;

                                            return (
                                                <span
                                                    key={partIdx}
                                                    className={clsx(
                                                        "transition-colors duration-200 rounded-sm py-0.5 box-decoration-clone",
                                                        segmentId && hoveredSegmentId === segmentId && "bg-yellow-200"
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
                })}
            </div>
        </div>
    );
}
