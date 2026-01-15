export interface IndexData {
    latin: TermEntry[];
    french: TermEntry[];
}

export interface TermEntry {
    id: string;
    term: string;
    count: number;
    translations: {
        fr?: TranslationRef[];
        ua?: TranslationRef[];
        la?: TranslationRef[];
    };
    occurrences: Occurrence[];
}

export interface TranslationRef {
    term: string;
    count: number;
}

export interface Occurrence {
    section: string;
    page: number;
    lines: LineRef[];
}

export interface LineRef {
    line: number;
    segment?: string; // Optional segment ID (e.g., "6a", "24a")
    isTitle?: boolean;
    countInLine?: number;
    note?: string; // For FM, PN etc
}
