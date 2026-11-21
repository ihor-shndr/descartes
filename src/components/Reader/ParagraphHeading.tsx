import { Paragraph } from '../../types/text';
import clsx from 'clsx';
import { SegmentedText } from './SegmentedText';
import { useAppStore } from '../../store/app-store';
import { HIGHLIGHT_COLORS } from '../../constants/highlights';
import { SEGMENT_MARKER_REGEX, extractSegmentId } from '../../utils/text-rendering';

interface ParagraphHeadingProps {
    paragraph: Paragraph;
    className?: string;
    termsBySegment?: Map<string, string[]>;
}

/**
 * Heading style mapping for both VerbatimText and SegmentFlow
 */
export const HEADING_STYLES = {
    h1: 'text-center text-3xl font-bold uppercase tracking-widest my-8 max-w-md mx-auto',
    h2: 'text-center text-xl italic my-6 max-w-md mx-auto',
    h3: 'text-center text-lg my-5 max-w-md mx-auto'
} as const;

/**
 * Check if paragraph is a heading
 */
export function isHeading(type: string | undefined): type is keyof typeof HEADING_STYLES {
    return type !== undefined && type in HEADING_STYLES;
}

/**
 * Shared heading component for VerbatimText and SegmentFlow
 * Renders h1, h2, h3 headings with consistent styling
 */
export function ParagraphHeading({ paragraph, className, termsBySegment }: ParagraphHeadingProps) {
    const highlightedLocation = useAppStore(state => state.highlightedLocation);
    const currentPage = useAppStore(state => state.currentPage);
    const highlightColor = useAppStore(state => state.highlightColor);
    const highlightWholeLine = highlightedLocation?.segmentGroups.length === 0;
    if (!isHeading(paragraph.type)) {
        return null;
    }

    const startLine = paragraph.startLine;
    let segmentId: string | null = null;
    return (
        <div className={clsx(HEADING_STYLES[paragraph.type], className)}>
            {startLine === undefined ? (
                <SegmentedText text={paragraph.lines.map(line => line.text).join(' ')} initialSegmentId={null} termsBySegment={termsBySegment} />
            ) : paragraph.lines.map(({ text }, index) => {
                const initialSegmentId = segmentId;
                const markers = [...text.matchAll(SEGMENT_MARKER_REGEX)];
                if (markers.length) segmentId = extractSegmentId(markers[markers.length - 1][0]);
                const lineNumber = startLine + index;
                return (
                    <div key={lineNumber} id={`line-${lineNumber}`} className={clsx(
                        'relative',
                        highlightWholeLine && highlightedLocation?.page === currentPage && highlightedLocation.line === lineNumber && HIGHLIGHT_COLORS[highlightColor].line
                    )}>
                        {lineNumber % 5 === 0 && <span className="absolute -left-8 text-xs text-stone-400 select-none font-normal">{lineNumber}</span>}
                        <SegmentedText text={text} initialSegmentId={initialSegmentId} termsBySegment={termsBySegment} />
                    </div>
                );
            })}
        </div>
    );
}
