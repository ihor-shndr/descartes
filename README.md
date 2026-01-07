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