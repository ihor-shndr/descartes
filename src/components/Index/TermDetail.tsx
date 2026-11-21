import { ReactNode } from 'react';
import { BookLine, BookSpan, TermEntry } from '../../types/termIndex';
import { useAppStore } from '../../store/app-store';
import { extractSegmentId, SEGMENT_MARKER_REGEX } from '../../utils/text-rendering';

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
            const { page, line, segment, printedLine, alignedSegment } = span.target;
            const source = allTexts?.[segment ? 'fr' : 'la']?.pages.find(p => p.pageNumber === page);
            const available = !!source && (!segment || source.paragraphs.some(p =>
                p.lines.some(({ text }) => Array.from(text.matchAll(SEGMENT_MARKER_REGEX))
                    .some(([marker]) => extractSegmentId(marker) === segment))
            ));
            const destination = segment ? `фрагмент ${segment}` : line === 0 ? 'заголовок' : `рядок ${line}`;
            const unavailable = source ? ' — фрагмент відсутній у французькому тексті' : ' — текст ще не імпортовано';
            const printedReference = printedLine === undefined ? '' : ` (у друкованому покажчику: рядок ${printedLine})`;
            return <button
                key={index}
                disabled={!available}
                title={`Сторінка ${page}, ${destination}${printedReference}${available ? '' : unavailable}`}
                onClick={() => navigate(page, line, segment, alignedSegment)}
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

export function BookIntroduction({ lines }: { lines: BookLine[] }) {
    const blocks: { kind: 'heading' | 'paragraph'; spans: BookSpan[]; end: string }[] = [];

    for (const line of lines) {
        const rawText = line.spans.map(span => span.text).join('');
        const text = rawText.replace(/\u00ad/g, '').trim();
        if (!text) continue;
        const previous = blocks[blocks.length - 1];
        const heading = line.spans.every(span => span.bold) ||
            /^(Латинські терміни|Французькі терміни|Таблиця ужитку|Умовні позначення$)/.test(text);
        const headingContinuation = previous?.kind === 'heading' &&
            (/^термінології(?:\s|$)/.test(text) || /^в окремих підрозділах(?:\s|$)/.test(text));
        const startsListItem = /^(?:SC|PL|SY|FM|PN|TL|GT)\s*[*–]/.test(text);
        const newBlock = !previous || (!headingContinuation && (
            heading || previous.kind === 'heading' || startsListItem ||
            (/[.!?:;]$/.test(previous.end) && /^[А-ЯІЇЄҐA-Z0-9]/.test(text))
        ));

        if (newBlock) blocks.push({ kind: heading ? 'heading' : 'paragraph', spans: [], end: '' });
        const block = blocks[blocks.length - 1];
        if (block.spans.length && !/[-\u00ad]$/.test(block.end)) block.spans.push({ text: ' ' });
        const cleanedSpans = line.spans.map(span => ({ ...span, text: span.text.replace(/\u00ad/g, '') }));
        cleanedSpans[0].text = cleanedSpans[0].text.trimStart();
        cleanedSpans[cleanedSpans.length - 1].text = cleanedSpans[cleanedSpans.length - 1].text.trimEnd();
        block.spans.push(...cleanedSpans);
        block.end = rawText.trimEnd();
    }

    return <div className="space-y-4 font-serif text-sm leading-relaxed text-stone-700">
        {blocks.map((block, index) => block.kind === 'heading'
            ? <h4 key={index} className="pt-2 font-semibold text-stone-900"><BookText spans={block.spans} /></h4>
            : <p key={index}><BookText spans={block.spans} /></p>)}
    </div>;
}

export const TermDetail = ({ term }: { term: TermEntry }) => (
    <article className="mb-6 pb-4 border-b border-gray-100 last:border-0">
        <h3 className="text-lg font-serif mb-2"><BookText spans={term.bookHeading} /></h3>
        <BookLines lines={term.bookLines} />
        <a
            href={`/descartes/original-index.pdf#page=${term.sourcePage - 382}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-xs text-gray-500 hover:underline"
        >Книжка, с. {term.sourcePage}</a>
    </article>
);
