# Descartes - Multilingual Reading Interface

A web-based reading interface for Descartes' Meditations supporting up to 4 parallel language columns with segment-level alignment, cross-language hover highlighting, and minimalist typography-focused design.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Node.js (parser scripts)

## Getting Started

### Installation

```bash
npm install
```

### Parse Text Files

Convert markdown text files to JSON:

```bash
npm run parse
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Term Index

The reader uses the unified graph in `public/meditations/index/graph.json`.
`src/types/termIndex.ts` defines its shared constants and derived literal-union
types for languages, nodes, edges, mapping resolutions, notations and markers.
Use those constants in application logic rather than repeating serialized
strings. The JSON values remain unchanged.

The loader validates the schema before exposing typed graph data, including
node fields, edge endpoints and ownership, notes, duplicate IDs and dangling references.
Language-level editorial notes may reference terms as numbered footnotes.
Counts come from linked usages, with GT subentries counted separately. When
the printed index differs from the imported text, the graph can retain the
printed reference or reported multiplicity alongside the corrected location
or actual occurrence count. References without a verifiable text location
remain disabled.
Verify the types and index behavior with:

```bash
npm run type-check
node --import tsx --test src/services/text-loader.test.ts src/components/Index/IndexModal.test.tsx src/components/Index/TermDetail.test.tsx src/components/Reader/ParagraphHeading.test.tsx
```

## Project Structure

- `texts/` - Source markdown files with segment markers
- `scripts/` - Parser scripts to convert markdown to JSON
- `public/data/` - Generated JSON files (created by parser)
- `src/` - React application source code

## Features

- Up to 4 parallel language columns
- Cross-language hover highlighting
- Word-level language switching
- Deep linking to specific segments
- localStorage persistence of column preferences
- Minimalist, typography-focused design

## Import remaining text from PDF

See [the batch import guide](scripts/import-pages/README.md) for PDF preparation, one Terra agent per reader page, validation, and merging into the existing text JSON.
