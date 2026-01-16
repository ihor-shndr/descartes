
import { Paragraph, TextData } from '../types/text';
import { extractSegmentId, isSegmentMarker, SEGMENT_MARKER_REGEX } from './text-rendering';

/**
 * Finds the segment ID active at a specific line on a specific page
 * Used to resolve Latin Line Numbers -> Segment IDs for cross-language highlighting
 */
export function findSegmentIdForLine(
    textData: TextData,
    pageNumber: number,
    targetLine: number
): string | undefined {
    // Find the page
    const page = textData.pages.find(p => p.pageNumber === pageNumber);
    if (!page) return undefined;

    let lineCounter = 0;
    let currentSegmentId: string | undefined = undefined;

    // Iterate paragraphs like VerbatimText does
    for (const paragraph of page.paragraphs) {
        // Skip headers (h1, h2, h3) as they aren't counted in VerbatimText line numbers 
        // (based on VerbatimText implementation)
        if (paragraph.type === 'h1' || paragraph.type === 'h2' || paragraph.type === 'h3') {
            continue;
        }

        for (const line of paragraph.lines) {
            lineCounter++;

            // Check for segment markers in this line to update current segment
            const parts = line.split(SEGMENT_MARKER_REGEX);
            for (const part of parts) {
                if (isSegmentMarker(part)) {
                    currentSegmentId = extractSegmentId(part);
                }
            }

            // If this is the target line, return the current segment
            if (lineCounter === targetLine) {
                return currentSegmentId;
            }
        }
    }

    return undefined;
}
