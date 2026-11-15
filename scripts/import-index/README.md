# Import the terminology indexes from the book

The source is `public/original-index.pdf`, printed pages 383–398. It includes 29 Latin articles and 20 French articles, together with explanatory notes, footnotes and nested GT/TL/PN blocks.

From the repository root:

```sh
uv run --with pymupdf==2.1 python scripts/import-index/import_index.py
uv run --with pymupdf==2.1 python -m unittest discover -s scripts/import-index -v
uv run --with pymupdf==2.1 python scripts/import-index/import_index.py --check
npm run build
```

The importer writes both JSON files in `public/meditations/index`. The build copies them to `docs/meditations/index` for publishing. `--check` regenerates in memory and checks exact equality with the checked-in JSON.

## Data and verification

`bookHeading`, `bookLines` and `bookIntroduction` preserve the source wording, superscripts, subscripts, italics and bold text. The importer asserts that every extracted body row is represented exactly once and that adding destinations changes no characters. Only running page numbers are excluded. Physical PDF lines are retained for comparison; browser wrapping may add more lines.

Every baseline reference is linked separately. Latin destinations use page/line; French destinations use page/segment. Superscript Arabic numerals identify translation equivalents and never become part of a line number. Cyrillic lookalikes are normalized only for parsing destinations, while the displayed source text remains unchanged. Structured `occurrences` are derived from these same references for Latin inline markers.

The first entry in each language also carries the book's introductory instructions. Special blocks belong to their main article. Footnotes stay where they occur in the printed sequence. Every article links back to its starting PDF page.

References to text pages not yet imported are displayed but disabled, to prevent the reader's page clamping from redirecting them to a different page. Availability is checked in the corresponding source language. Available French references pass the segment identifier to the existing reader navigation.

## Source anomalies are preserved

The importer does not invent counts or silently correct printed references. Examples:

- `anima [11]`: section counts sum to 12, although 11 locations are listed.
- `intelligence []` and `faculté (puissance) de concevoir []`: the printed totals are empty (`count: null`).
- Empty counts in special blocks, inconsistent equivalent numbering, starred references, italic references and printed punctuation are retained as printed.

The six regression checks cover article inventory, superscript ambiguity, recovered French references and nested blocks, blank source counts, cross-page continuations and the printed `anima` discrepancy. This verifies the import; it does not claim that every reference printed in the book is factually correct against the complete Meditations text.
