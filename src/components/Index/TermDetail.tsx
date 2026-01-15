
import React from 'react';
import { TermEntry, Occurrence, LineRef } from '../../types/termIndex';
import { useAppStore } from '../../store/app-store';

interface TermDetailProps {
    term: TermEntry;
}

export const TermDetail: React.FC<TermDetailProps> = ({ term }) => {
    const navigateToLocation = useAppStore(state => state.navigateToLocation);

    const handleLinkClick = (page: number, line: number, segment?: string) => {
        navigateToLocation(page, line, segment);
    };

    const renderLines = (occurrence: Occurrence) => {
        // Group lines if needed, or just list them
        // Format: "1: 7, 10" (Page 1, lines 7 and 10)
        // The data might have multiple occurrences with same page but different line lists? 
        // In our JSON, lines is an array.

        // We render: "{Page}: {Line}, {Line}..."
        const lineLinks = occurrence.lines.map((l, i) => {
            let label = l.line > 0 ? l.line.toString() : '';
            if (l.segment && l.line === 0) label = l.segment; // Use segment ID if no line number

            // Handle metadata like title, note
            if (l.isTitle) label += ' (tit)';
            if (l.note) label = l.note; // Override label if note exists (e.g. TL(16))

            // If label is empty (e.g. just segment but I want to show it?), logic above ensures it has something.
            // If both line and segment exist? Latin usually has line. French has segment.

            return (
                <span key={i}>
                    <button
                        onClick={() => handleLinkClick(occurrence.page, l.line, l.segment)}
                        className="text-blue-600 hover:text-blue-800 hover:underline mx-0.5"
                    >
                        {label}
                        {l.countInLine ? <sub className="text-xs">x{l.countInLine}</sub> : ''}
                        {l.note && !label.includes(l.note) ? <sup className="text-xs">{l.note}</sup> : ''}
                    </button>
                    {i < occurrence.lines.length - 1 ? ', ' : ''}
                </span>
            );
        });

        return (
            <div key={`${occurrence.section}-${occurrence.page}`} className="mr-4 mb-2 inline-block">
                <span className="font-semibold text-gray-700">{occurrence.section !== 'I' && occurrence.section !== 'II' && occurrence.section !== 'III' && occurrence.section !== 'IV' && occurrence.section !== 'V' && occurrence.section !== 'VI' ? occurrence.section + ' ' : ''}</span>
                <span className="text-gray-900 mx-1">{occurrence.page}:</span>
                {lineLinks}
            </div>
        );
    };

    return (
        <div className="mb-6 pb-4 border-b border-gray-100 last:border-0">
            {/* Header: Term [Count] */}
            <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
                {term.term} <span className="text-sm font-sans font-normal text-gray-500">[{term.count}]</span>
            </h3>

            {/* Translations */}
            <div className="ml-4 mb-3 space-y-1">
                {term.translations.fr && term.translations.fr.length > 0 && (
                    <div className="text-sm">
                        <span className="font-semibold text-gray-600 w-8 inline-block">fr:</span>
                        {term.translations.fr.map((t, i) => (
                            <span key={i} className="mr-2 text-gray-800 italic">
                                {t.term} {t.count > 0 && `[${t.count}]`}
                                {i < term.translations.fr!.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                )}
                {term.translations.ua && term.translations.ua.length > 0 && (
                    <div className="text-sm">
                        <span className="font-semibold text-gray-600 w-8 inline-block">ua:</span>
                        {term.translations.ua.map((t, i) => (
                            <span key={i} className="mr-2 text-gray-800">
                                {t.term} {t.count > 0 && `[${t.count}]`}
                                {i < term.translations.ua!.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Occurrences */}
            <div className="ml-4 text-sm leading-relaxed">
                {term.occurrences.map(occ => renderLines(occ))}
            </div>
        </div>
    );
};
