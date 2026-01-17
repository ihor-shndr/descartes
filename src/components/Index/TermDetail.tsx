import React from 'react';
import { TermEntry, LanguageTranslation, SectionOccurrence, PageOccurrence, LineRef } from '../../types/termIndex';
import { useAppStore } from '../../store/app-store';

interface TermDetailProps {
    term: TermEntry;
}

export const TermDetail: React.FC<TermDetailProps> = ({ term }) => {
    const navigateToLocation = useAppStore(state => state.navigateToLocation);

    const frTranslation = term.translations.find(t => t.language === 'fr');
    const uaTranslation = term.translations.find(t => t.language === 'ua');

    return (
        <div className="mb-6 pb-4 border-b border-gray-100 last:border-0">
            {/* Header: Term [Count] */}
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                {term.term} <span className="text-sm font-sans font-normal text-gray-500">[{term.count}]</span>
            </h3>

            {/* Translations */}
            <div className="ml-6 mb-2 text-sm leading-relaxed">
                {frTranslation && (
                    <TranslationLine translation={frTranslation} type="fr" />
                )}
                {uaTranslation && (
                    <TranslationLine translation={uaTranslation} type="ua" />
                )}
            </div>

            {/* Occurrences by Section */}
            <div className="text-sm leading-relaxed">
                {term.occurrences.map(occ => (
                    <SectionLine
                        key={occ.section}
                        occurrence={occ}
                        onNavigate={navigateToLocation}
                    />
                ))}
            </div>
        </div>
    );
};

interface TranslationLineProps {
    translation: LanguageTranslation;
    type: 'fr' | 'ua';
}

const TranslationLine: React.FC<TranslationLineProps> = ({ translation, type }) => {
    const terms = translation.terms || [];
    const specialTerms = translation.specialTerms || [];

    return (
        <div className={type === 'fr' ? 'italic text-gray-800' : 'text-gray-800'}>
            {terms.map((t, i) => (
                <span key={i}>
                    {t.term}
                    {t.modifier && (
                        <sup className="text-xs">{t.modifier}</sup>
                    )}
                    {' '}[{t.count}]
                    {i < terms.length - 1 ? ', ' : ''}
                </span>
            ))}
            {specialTerms.length > 0 && (
                <>
                    {terms.length > 0 && ' / '}
                    {specialTerms.map((st, i) => (
                        <span key={i}>
                            {st.term} [{st.count}]
                            {i < specialTerms.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </>
            )}
        </div>
    );
};

interface SectionLineProps {
    occurrence: SectionOccurrence;
    onNavigate: (page: number, line: number, segment?: string) => void;
}

const SectionLine: React.FC<SectionLineProps> = ({ occurrence, onNavigate }) => {
    const { section, count, pages } = occurrence;

    return (
        <div className="mb-1">
            <span className="font-semibold text-gray-700 w-8 inline-block italic">{section}</span>
            <span className="text-gray-500 mx-1">[{count}]</span>
            <PageReferences pages={pages} onNavigate={onNavigate} />
        </div>
    );
};

interface PageReferencesProps {
    pages: PageOccurrence[];
    onNavigate: (page: number, line: number, segment?: string) => void;
}

const PageReferences: React.FC<PageReferencesProps> = ({ pages, onNavigate }) => {
    return (
        <span>
            {pages.map((pageOcc, pageIdx) => (
                <span key={pageIdx}>
                    <span className="text-gray-900">{pageOcc.page}:</span>
                    {' '}
                    {pageOcc.lines.map((lineRef, lineIdx) => (
                        <LineReference
                            key={lineIdx}
                            lineRef={lineRef}
                            page={pageOcc.page}
                            onNavigate={onNavigate}
                            isLast={lineIdx === pageOcc.lines.length - 1}
                        />
                    ))}
                    {pageIdx < pages.length - 1 ? '; ' : ''}
                </span>
            ))}
        </span>
    );
};

interface LineReferenceProps {
    lineRef: LineRef;
    page: number;
    onNavigate: (page: number, line: number, segment?: string) => void;
    isLast: boolean;
}

const LineReference: React.FC<LineReferenceProps> = ({ lineRef, page, onNavigate, isLast }) => {
    const { line, modifier1, modifier2, modifier3 } = lineRef;

    const handleClick = () => {
        onNavigate(page, line);
    };

    // modifier1: pre-line superscript (Arabic number or FM/PN)
    const renderModifier1 = () => {
        if (!modifier1) return null;
        return <sup className="text-xs">{modifier1}</sup>;
    };

    // modifier2: post-line superscript (Roman numeral)
    const renderModifier2 = () => {
        if (!modifier2) return null;
        return <sup className="text-xs">{modifier2}</sup>;
    };

    // modifier3: subscript (x2)
    const renderModifier3 = () => {
        if (!modifier3) return null;
        return <sub className="text-xs">{modifier3}</sub>;
    };

    return (
        <span>
            {renderModifier1()}
            <button
                onClick={handleClick}
                className="text-blue-600 hover:text-blue-800 hover:underline"
            >
                {line}
            </button>
            {renderModifier2()}
            {renderModifier3()}
            {!isLast ? ', ' : ''}
        </span>
    );
};
