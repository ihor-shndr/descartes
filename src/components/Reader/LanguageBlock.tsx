import { Segment, RawPageData } from '../../types/text';
import { getDisplayName, shouldPreserveLineBreaks } from '../../utils/language-codes';
import VerbatimText from './VerbatimText';
import SegmentFlow from './SegmentFlow';

interface LanguageBlockProps {
  lang: string;
  segments: Segment[];
  rawPageData?: RawPageData;
  hoveredSegmentId: string | null;
  onHoverSegment: (id: string | null) => void;
}

/**
 * Simplified Language Block component
 * Renders a single language with appropriate formatting
 * - Source languages (la, fr): VerbatimText with preserved line breaks
 * - Translations (la-ua, fr-ua): SegmentFlow with flowing text
 */
export default function LanguageBlock({
  lang,
  segments,
  rawPageData,
  hoveredSegmentId,
  onHoverSegment
}: LanguageBlockProps) {
  const displayName = getDisplayName(lang);
  const preserveLineBreaks = shouldPreserveLineBreaks(lang);

  // Check if this language has any content
  const hasContent = preserveLineBreaks
    ? rawPageData && rawPageData.paragraphs.length > 0
    : segments.some((seg) => seg.texts[lang]);

  if (!hasContent) {
    return null;
  }

  // Determine if this is a source language (for max-width constraint)
  const isSourceLang = lang === 'la' || lang === 'fr';

  return (
    <div className="language-block mb-8 max-w-full">
      {/* Language header */}
      <div className="mb-4 pb-2 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-700 font-sans">
          {displayName}
        </h2>
      </div>

      {/* Text content */}
      <div
        className={`text-base leading-relaxed ${
          preserveLineBreaks
            ? `font-serif ${isSourceLang ? 'max-w-md mx-auto' : ''}`
            : 'font-sans'
        }`}
        style={{ fontFamily: preserveLineBreaks ? undefined : 'Inter, system-ui, -apple-system, sans-serif' }}
      >
        {preserveLineBreaks && rawPageData ? (
          // Source language: render verbatim with inline hoverable segments
          <VerbatimText
            paragraphs={rawPageData.paragraphs}
            hoveredSegmentId={hoveredSegmentId}
            onHoverSegment={onHoverSegment}
          />
        ) : (
          // Translation: render segment-based flow with paragraph structure
          rawPageData ? (
            <SegmentFlow
              lang={lang}
              segments={segments}
              paragraphs={rawPageData.paragraphs}
              hoveredSegmentId={hoveredSegmentId}
              onHoverSegment={onHoverSegment}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
