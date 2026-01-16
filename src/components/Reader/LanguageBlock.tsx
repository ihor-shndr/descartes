import { Paragraph } from '../../types/text';
import { VerbatimText } from './VerbatimText';
import { FlowingText } from './FlowingText';
import { getLanguageLabel, usesVerbatimLayout } from '../../utils/language-utils';
import clsx from 'clsx';

interface LanguageBlockProps {
    language: string;
    paragraphs: Paragraph[];
    className?: string;
}

export function LanguageBlock({ language, paragraphs, className }: LanguageBlockProps) {
    const isSource = usesVerbatimLayout(language);

    return (
        <div className={clsx("flex flex-col h-full shadow-sm border border-stone-200 rounded-sm overflow-hidden", className)}>
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-1 text-xs font-bold text-stone-500 uppercase tracking-wider sticky top-0">
                {getLanguageLabel(language)}
            </div>
            <div className="flex-1 overflow-auto p-8 custom-scrollbar relative overflow-x-auto">
                <div className="max-w-full mx-auto">
                    {isSource ? (
                        <VerbatimText paragraphs={paragraphs} language={language} />
                    ) : (
                        <FlowingText paragraphs={paragraphs} />
                    )}
                </div>
            </div>
        </div>
    );
}
