import { ReactNode } from 'react';
import { BookLine, BookSpan, TermEntry } from '../../types/termIndex';
import { useAppStore } from '../../store/app-store';

const BookText = ({ spans }: { spans: BookSpan[] }) => {
    const navigate = useAppStore(state => state.navigateToLocation);
    const allTexts = useAppStore(state => state.allTexts);

    return <>{spans.map((span, index) => {
        let content: ReactNode = span.text;
        if (span.italic) content = <em>{content}</em>;
        if (span.bold) content = <strong>{content}</strong>;
        if (span.position === 'sup') content = <sup>{content}</sup>;
        if (span.position === 'sub') content = <sub>{content}</sub>;
        if (span.target) {
            const { page, line, segment } = span.target;
            const available = allTexts?.[segment ? 'fr' : 'la']?.pages.some(p => p.pageNumber === page) ?? false;
            const destination = segment ? `fragment ${segment}` : line === 0 ? 'title' : `line ${line}`;
            return <button
                key={index}
                disabled={!available}
                title={`Page ${page}, ${destination}${available ? '' : ' — text not imported yet'}`}
                onClick={() => navigate(page, line, segment)}
                className="text-blue-600 hover:underline disabled:text-gray-500 disabled:cursor-help disabled:no-underline"
            >{content}</button>;
        }
        return <span key={index}>{content}</span>;
    })}</>;
};

export const BookLines = ({ lines }: { lines: BookLine[] }) => (
    <div className="text-sm leading-relaxed font-serif">
        {lines.map((line, index) => <div key={index} style={{ paddingLeft: line.indent ?? 0 }}>
            <BookText spans={line.spans} />
        </div>)}
    </div>
);

export const TermDetail = ({ term }: { term: TermEntry }) => (
    <article className="mb-6 pb-4 border-b border-gray-100 last:border-0">
        <h3 className="text-lg font-serif mb-2"><BookText spans={term.bookHeading} /></h3>
        <BookLines lines={term.bookLines} />
        <a
            href={`/descartes/original-index.pdf#page=${term.sourcePage - 382}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-xs text-gray-500 hover:underline"
        >Book, p. {term.sourcePage}</a>
    </article>
);
