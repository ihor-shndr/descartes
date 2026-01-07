import { Segment } from '../../types/page';
import { getDisplayName, shouldPreserveLineBreaks } from '../../utils/language-codes';

interface LanguageBlockProps {
  lang: string;
  segments: Segment[];
  hoveredSegmentId: string | null;
  onHoverSegment: (id: string | null) => void;
}

export default function LanguageBlock({
  lang,
  segments,
  hoveredSegmentId,
  onHoverSegment
}: LanguageBlockProps) {
  // Check if this language has any content
  const hasContent = segments.some(seg => seg.texts[lang]);

  if (!hasContent) {
    return null; // Don't render empty language blocks
  }

  const displayName = getDisplayName(lang);
  const preserveLineBreaks = shouldPreserveLineBreaks(lang);

  return (
    <div className="language-block mb-8 max-w-full">
      {/* Language header */}
      <div className="mb-4 pb-2 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-700 font-sans">
          {displayName}
        </h2>
      </div>

      {/* Flowing paragraph text */}
      <div
        className={`text-base leading-loose break-words ${preserveLineBreaks ? 'whitespace-pre-wrap' : ''}`}
        style={{ overflowWrap: 'anywhere' }}
      >
        {segments.map((segment) => {
          const text = segment.texts[lang];

          if (!text) return null;

          const isHovered = hoveredSegmentId === segment.id;

          return (
            <span
              key={segment.id}
              id={`seg-${segment.id}-${lang}`}
              className={`segment-inline transition-colors duration-200 px-1 py-0.5 rounded ${isHovered ? 'bg-yellow-200' : ''}`}
              onMouseEnter={() => onHoverSegment(segment.id)}
              onMouseLeave={() => onHoverSegment(null)}
            >
              {/* Segment marker as superscript */}
              <sup className="text-xs text-gray-500 mr-0.5">
                {segment.marker}
              </sup>
              {/* Segment text */}
              <span>{text}</span>
              {' '}
            </span>
          );
        })}
      </div>
    </div>
  );
}
