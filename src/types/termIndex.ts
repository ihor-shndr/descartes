export interface IndexData {
    latin: TermEntry[];
    french: TermEntry[];
}

export interface IndexTarget {
    page: number;
    line: number;
    segment?: string;
}

export interface BookSpan {
    text: string;
    italic?: boolean;
    bold?: boolean;
    position?: 'sup' | 'sub';
    target?: IndexTarget;
}

export interface BookLine {
    sourcePage: number;
    spans: BookSpan[];
    indent?: number;
}

export interface TermEntry {
    id: string;
    term: string;
    count: number | null;
    sourcePage: number;
    bookHeading: BookSpan[];
    bookLines: BookLine[];
    bookIntroduction?: BookLine[];
    occurrences: SectionOccurrence[];
}

export interface SectionOccurrence {
    section: string;
    count: number;
    pages: PageOccurrence[];
}

export interface PageOccurrence {
    page: number;
    lines: LineRef[];
}

export interface LineRef {
    line: number;
    segment?: string;
    isTitle?: boolean;
}
