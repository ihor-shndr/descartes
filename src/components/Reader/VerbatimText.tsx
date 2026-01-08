import React from 'react';
import { Paragraph } from '../../types/text';

/**
 * Regex to match segment markers
 */
const SEGMENT_REGEX = /\((\d+[a-zа-я]?)\)/g;

/**
 * Normalize segment ID (convert Cyrillic 'а' to Latin 'a')
 */
function normalizeSegmentId(id: string): string {
  return id.replace(/а/g, 'a');
}

/**
 * Parsed part of a line
 */
interface ParsedPart {
  type: 'text' | 'marker';
  content: string;
  segmentId: string | null;
}

/**
 * Parse a line into segments, tracking continuation from previous segment
 */
function parseLineWithContinuation(
  line: string,
  continuationSegmentId: string | null
): { parts: ParsedPart[]; lastSegmentId: string | null } {
  const parts: ParsedPart[] = [];
  let currentSegmentId = continuationSegmentId;
  let lastIndex = 0;

  // Reset regex state
  SEGMENT_REGEX.lastIndex = 0;
  const matches = [...line.matchAll(SEGMENT_REGEX)];

  for (const match of matches) {
    const matchIndex = match.index!;
    const segmentId = normalizeSegmentId(match[1]);

    // Text before this marker belongs to current segment (could be continuation)
    if (matchIndex > lastIndex) {
      const textBefore = line.slice(lastIndex, matchIndex);
      parts.push({
        type: 'text',
        content: textBefore,
        segmentId: currentSegmentId
      });
    }

    // The marker itself
    parts.push({
      type: 'marker',
      content: match[0],
      segmentId: segmentId
    });

    currentSegmentId = segmentId;
    lastIndex = matchIndex + match[0].length;
  }

  // Remaining text after last marker (or entire line if no markers)
  if (lastIndex < line.length) {
    parts.push({
      type: 'text',
      content: line.slice(lastIndex),
      segmentId: currentSegmentId
    });
  }

  return { parts, lastSegmentId: currentSegmentId };
}

/**
 * Hoverable segment span
 */
function SegmentSpan({
  segmentId,
  isHovered,
  onHoverSegment,
  children
}: {
  segmentId: string | null;
  isHovered: boolean;
  onHoverSegment: (id: string | null) => void;
  children: React.ReactNode;
}) {
  if (!segmentId) {
    return <span>{children}</span>;
  }

  return (
    <span
      className={`transition-colors duration-200 ${
        isHovered ? 'bg-yellow-200' : ''
      }`}
      onMouseEnter={() => onHoverSegment(segmentId)}
      onMouseLeave={() => onHoverSegment(null)}
    >
      {children}
    </span>
  );
}

interface VerbatimTextProps {
  paragraphs: Paragraph[];
  hoveredSegmentId: string | null;
  onHoverSegment: (id: string | null) => void;
}

/**
 * Render verbatim text with original line breaks and hoverable segments
 * Tracks segment continuation across lines
 * Used for source languages (Latin, French)
 */
export default function VerbatimText({
  paragraphs,
  hoveredSegmentId,
  onHoverSegment
}: VerbatimTextProps) {
  // Track current segment across all paragraphs and lines
  let currentSegmentId: string | null = null;

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const lineElements = paragraph.lines.map((line, lIndex) => {
          const { parts, lastSegmentId } = parseLineWithContinuation(
            line,
            currentSegmentId
          );
          currentSegmentId = lastSegmentId;

          // Check if this is the last line of the paragraph
          const isLastLine = lIndex === paragraph.lines.length - 1;

          return (
            <div
              key={`${pIndex}-${lIndex}`}
              className="text-justify"
              style={{ textAlignLast: isLastLine ? 'left' : 'justify' }}
            >
              {parts.map((part, partIndex) => {
                if (part.type === 'marker') {
                  return (
                    <SegmentSpan
                      key={`marker-${pIndex}-${lIndex}-${partIndex}`}
                      segmentId={part.segmentId}
                      isHovered={hoveredSegmentId === part.segmentId}
                      onHoverSegment={onHoverSegment}
                    >
                      <sup className="text-xs text-gray-500">{part.content}</sup>
                    </SegmentSpan>
                  );
                } else {
                  // Text part
                  if (part.segmentId) {
                    return (
                      <SegmentSpan
                        key={`text-${pIndex}-${lIndex}-${partIndex}`}
                        segmentId={part.segmentId}
                        isHovered={hoveredSegmentId === part.segmentId}
                        onHoverSegment={onHoverSegment}
                      >
                        {part.content}
                      </SegmentSpan>
                    );
                  } else {
                    // Text before any segment marker
                    return (
                      <span key={`plain-${pIndex}-${lIndex}-${partIndex}`}>
                        {part.content}
                      </span>
                    );
                  }
                }
              })}
            </div>
          );
        });

        return (
          <div
            key={pIndex}
            className={paragraph.newLine && pIndex > 0 ? 'mt-4' : ''}
            style={{ textIndent: paragraph.newLine ? '1.5em' : '0' }}
          >
            {lineElements}
          </div>
        );
      })}
    </>
  );
}
