import { Segment } from '../../types/text';

interface SegmentFlowProps {
  lang: string;
  segments: Segment[];
  hoveredSegmentId: string | null;
  onHoverSegment: (id: string | null) => void;
}

/**
 * Render segment-based flowing text (for translations)
 * Used for Ukrainian translations (la-ua, fr-ua)
 */
export default function SegmentFlow({
  lang,
  segments,
  hoveredSegmentId,
  onHoverSegment
}: SegmentFlowProps) {
  return (
    <>
      {segments.map((segment) => {
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
    </>
  );
}
