import { Segment, Paragraph } from '../../types/text';

interface SegmentFlowProps {
  lang: string;
  segments: Segment[];
  paragraphs: Paragraph[];
  hoveredSegmentId: string | null;
  onHoverSegment: (id: string | null) => void;
}

/**
 * Render segment-based flowing text (for translations)
 * Used for Ukrainian translations (la-ua, fr-ua)
 * Text flows naturally with justified alignment like a book
 * Respects paragraph boundaries from source data
 */
export default function SegmentFlow({
  lang,
  segments,
  paragraphs,
  hoveredSegmentId,
  onHoverSegment
}: SegmentFlowProps) {
  // Group segments by paragraph by matching segment positions in text
  const paragraphGroups: Segment[][] = [];

  // Parse each paragraph to extract segment IDs
  const SEGMENT_REGEX = /\((\d+[a-zа-я]?)\)/g;

  paragraphs.forEach((paragraph) => {
    const paragraphText = paragraph.lines.join(' ');
    const matches = [...paragraphText.matchAll(SEGMENT_REGEX)];
    const segmentIds = matches.map(m => m[1].replace(/а/g, 'a')); // Normalize Cyrillic

    // Find segments that belong to this paragraph
    const paragraphSegments = segments.filter(seg => segmentIds.includes(seg.id));
    if (paragraphSegments.length > 0) {
      paragraphGroups.push(paragraphSegments);
    }
  });

  return (
    <>
      {paragraphGroups.map((paragraphSegments, pIndex) => {
        const paragraph = paragraphs[pIndex];

        return (
          <div
            key={pIndex}
            className={`text-justify ${paragraph?.newLine && pIndex > 0 ? 'mt-4' : ''}`}
            style={{ textIndent: paragraph?.newLine ? '1.5em' : '0' }}
          >
            {paragraphSegments.map((segment) => {
              const text = segment.texts[lang];
              if (!text) return null;

              const isHovered = hoveredSegmentId === segment.id;

              return (
                <span
                  key={segment.id}
                  id={`seg-${segment.id}-${lang}`}
                  className={`segment-inline transition-colors duration-200 px-1 py-0.5 rounded ${
                    isHovered ? 'bg-yellow-200' : ''
                  }`}
                  onMouseEnter={() => onHoverSegment(segment.id)}
                  onMouseLeave={() => onHoverSegment(null)}
                >
                  <sup className="text-xs text-gray-500 mr-0.5">
                    {segment.marker}
                  </sup>
                  <span>{text}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
