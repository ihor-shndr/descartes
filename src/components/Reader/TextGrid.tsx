import { LanguageBlock } from './LanguageBlock';
import { ProcessedPageData } from '../../types/text';

interface TextGridProps {
  pageData: ProcessedPageData;
}

/**
 * 2x2 Grid layout component
 * Renders pre-validated, ordered language blocks in a fixed 2x2 grid
 */
export default function TextGrid({ pageData }: TextGridProps) {
  return (
    <div className="w-full px-8 py-8">
      <div className="grid grid-cols-2 gap-8 items-start">
        {pageData.languageBlocks.map((block) => (
          <LanguageBlock
            key={block.code}
            language={block.code}
            paragraphs={block.paragraphs}
          />
        ))}
      </div>
    </div>
  );
}
