import { Paragraph } from '../../types/text';
import { VerbatimText } from './VerbatimText';
import { SegmentFlow } from './SegmentFlow';
import { getDisplayName } from '../../utils/language-codes';
import { isSourceLanguage } from '../../utils/text-constants';
import clsx from 'clsx';

interface LanguageBlockProps {
    language: string;
    paragraphs: Paragraph[];
    className?: string;
    headerVisible?: boolean;
}

export function LanguageBlock({ language, paragraphs, className, headerVisible = true }: LanguageBlockProps) {
    const isSource = isSourceLanguage(language);

    return (
        <div className={clsx("flex flex-col h-full bg-white shadow-sm border border-stone-200 rounded-sm overflow-hidden", className)}>
            {headerVisible && (
                <div className="bg-stone-100 border-b border-stone-200 px-4 py-1 text-xs font-bold text-stone-500 uppercase tracking-wider sticky top-0 z-10">
                    {getDisplayName(language)}
                </div>
            )}
            <div className="flex-1 overflow-auto p-8 custom-scrollbar relative overflow-x-auto">
                <div className="max-w-full mx-auto">
                    {isSource ? (
                        <VerbatimText paragraphs={paragraphs} language={language} />
                    ) : (
                        <SegmentFlow paragraphs={paragraphs} />
                    )}
                </div>
            </div>
        </div>
    );
}
