
import { TextData } from '../types/text';
import { extractSegmentId, isSegmentMarker, SEGMENT_MARKER_REGEX } from './text-rendering';

/**
 * Finds all segment IDs that are active on a specific line on a specific page.
 * 
 * Latin index references are line-based, not segment-based. A single line may:
 * - Be part of a segment that started on an earlier line
 * - Have new segment(s) starting on it
 * 
 * This function returns ALL segments that intersect with the given line:
 * - The segment that was "active" at the start of the line (spanning from earlier)
 * - Any segments that start on this line
 * 
 * For non-Latin (flowing) texts, all returned segments should be highlighted.
 */
export function findSegmentsForLine(
    textData: TextData,
    pageNumber: number,
    targetLine: number
): string[] {
    // Find the page
    const page = textData.pages.find(p => p.pageNumber === pageNumber);
    if (!page) return [];

    let lineCounter = 0;
    let currentSegmentId: string | undefined = undefined;
    const segments: Set<string> = new Set();

    // Iterate paragraphs like VerbatimText does
    for (const paragraph of page.paragraphs) {
        // Skip headers (h1, h2, h3) as they aren't counted in VerbatimText line numbers 
        if (paragraph.type === 'h1' || paragraph.type === 'h2' || paragraph.type === 'h3') {
            continue;
        }

        for (const line of paragraph.lines) {
            lineCounter++;
            const isTargetLine = lineCounter === targetLine;

            // Save the segment that was active BEFORE this line (spans into this line)
            const segmentBeforeLine = currentSegmentId;

            // Check for segment markers in this line
            const parts = line.split(SEGMENT_MARKER_REGEX);
            let lineStartsWithNewSegment = false;

            // Check if the line starts with a segment marker (first non-empty part is a marker)
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!part) continue;

                if (isSegmentMarker(part)) {
                    lineStartsWithNewSegment = true;
                    break;
                } else if (part.trim()) {
                    // Text content before any marker - line doesn't start with segment
                    break;
                }
            }

            // Process all segment markers to track current segment and collect for target line
            for (const part of parts) {
                if (isSegmentMarker(part)) {
                    currentSegmentId = extractSegmentId(part);
                    // If on target line, add new segments that start here
                    if (isTargetLine && currentSegmentId) {
                        segments.add(currentSegmentId);
                    }
                }
            }

            // If this is the target line and it DOESN'T start with a new segment,
            // include the segment that was spanning into this line from before
            if (isTargetLine && !lineStartsWithNewSegment && segmentBeforeLine) {
                segments.add(segmentBeforeLine);
            }

            // If past the target line, we're done
            if (lineCounter > targetLine) {
                return Array.from(segments);
            }
        }
    }

    return Array.from(segments);
}

/**
 * Legacy function for backward compatibility.
 * Returns the first segment active on the given line.
 */
export function findSegmentIdForLine(
    textData: TextData,
    pageNumber: number,
    targetLine: number
): string | undefined {
    const segments = findSegmentsForLine(textData, pageNumber, targetLine);
    return segments[0];
}
