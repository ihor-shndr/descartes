import { Paragraph } from '../../types/text';
import clsx from 'clsx';

interface ParagraphHeadingProps {
    paragraph: Paragraph;
    className?: string;
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
export function ParagraphHeading({ paragraph, className }: ParagraphHeadingProps) {
    if (!isHeading(paragraph.type)) {
        return null;
    }

    return (
        <div className={clsx(HEADING_STYLES[paragraph.type], className)}>
            {paragraph.lines.join(' ')}
        </div>
    );
}
