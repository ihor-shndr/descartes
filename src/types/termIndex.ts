export interface IndexData {
    latin: TermEntry[];
    french: TermEntry[];
}

export interface TermEntry {
    id: string;
    term: string;
    count: number;
    translations: LanguageTranslation[];
    occurrences: SectionOccurrence[];
}

export interface LanguageTranslation {
    language: 'fr' | 'ua' | 'la';
    terms: TranslationTerm[];
    specialTerms?: SpecialTerm[];
}

export interface TranslationTerm {
    term: string;
    count: string;
    modifier?: string;
}

export interface SpecialTerm {
    term: string;
    count: string;
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
    modifier1?: string;
    modifier2?: string;
    modifier3?: string;
}
