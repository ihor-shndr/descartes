import { Paragraph } from '../../types/text';
import { ParagraphText } from './ParagraphText';
import { getLanguageLabel, usesVerbatimLayout } from '../../utils/language-utils';
import clsx from 'clsx';

interface LanguageBlockProps {
    language: string;
    paragraphs: Paragraph[];
}

export function LanguageBlock({ language, paragraphs }: LanguageBlockProps) {
    const isVerbatim = usesVerbatimLayout(language);

    return (
        <div className={clsx("flex flex-col h-full shadow-sm border border-stone-200 rounded-sm overflow-hidden")}>
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-1 text-xs font-bold text-stone-500 uppercase tracking-wider sticky top-0">
                {getLanguageLabel(language)}
            </div>
            <div className="flex-1 overflow-auto p-8 relative overflow-x-auto">
                <div className="max-w-full mx-auto">
                    <ParagraphText
                        paragraphs={paragraphs}
                        language={language}
                        verbatim={isVerbatim}
                    />
                </div>
            </div>
        </div>
    );
}
