# Multilingual Reading Interface - Project Specification

## Project Overview

A web-based multilingual reading interface for Descartes' "Meditations on First Philosophy" that displays parallel translations with segment-level alignment, cross-language hover highlighting, and paginated navigation.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS

---

## Core Requirements

### 1. Layout Architecture

**2x2 Grid System with Dynamic Stretching:**
- **Top Row:** Ukrainian translation variants (1-2 columns)
  - Ukrainian from Latin (`la-ua`)
  - Ukrainian from French (`fr-ua`)
- **Bottom Row:** Source languages (1-2 columns)
  - Latin (`la`)
  - French (`fr`)

**Row Behavior:**
- Each row stretches independently based on selected languages
- When both Ukrainian variants selected: top row shows 2 equal columns
- When only one Ukrainian variant selected: top row shows 1 full-width column
- Same behavior for bottom row with source languages

**Language Selection:**
- 4 independent checkboxes (one per language)
- At least 1 language must be selected at all times
- Selections persist in localStorage
- Default: Ukrainian from Latin + Latin

### 2. Data Format

**Source Files:**
```
texts/
  la.json       # Latin source text (preserves line breaks)
  la-ua.json    # Ukrainian translation from Latin (single block)
  fr.json       # French source text (preserves line breaks)
  fr-ua.json    # Ukrainian translation from French (single block)
```

**JSON Structure:**
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "paragraphs": [
        {
          "newLine": true,
          "lines": ["(1)Text content...", "(2)More text..."]
        }
      ]
    }
  ]
}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `pages` | Array | Collection of page objects |
| `pageNumber` | Number | Sequential page identifier (1, 2, 3, etc.) |
| `paragraphs` | Array | Collection of paragraph objects within the page |
| `newLine` | Boolean | `true` = new paragraph, `false` = continuation from previous page |
| `lines` | Array | Array of text strings containing content |

**Language-Specific Formatting:**

| Language | Line Breaks | Description |
|----------|-------------|-------------|
| Latin (`la.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| French (`fr.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| Ukrainian from Latin (`la-ua.json`) | Single block | One continuous line per paragraph, flowing translation |
| Ukrainian from French (`fr-ua.json`) | Single block | One continuous line per paragraph, flowing translation |

**Rule:** Source languages (Latin, French) preserve original line breaks. Ukrainian translations flow as single blocks.

**Special Markers in Text:**
- Reference numbers: `(1)`, `(2)`, `(6a)`, `(7a)` - segment identifiers for alignment
- Asterisk `*` - marks beginning of new sections
- Pipe `|` - indicates column breaks in original Latin text
- Hyphen at line end - word continuation (Ukrainian)

### 3. Text Segmentation & Alignment

**Segment Markers:**
- Text contains numbered reference markers: (1), (2), (6), (6a), (7), (7a), (8)
- Markers appear inline within the text
- Segments can have letter suffixes (6a, 7a) for sub-divisions
- All languages use the same segment IDs for alignment

**Alignment Logic:**
1. Parse reference markers from all language files
2. Extract text between markers as segments
3. Match segments across languages by ID
4. Display aligned segments in grid layout

**Natural Sorting:**
- Segments sort numerically then alphabetically: 1, 2, 6, 6a, 7, 7a, 8, 10, 10a, 11

**Handling Missing Segments:**
- If a segment exists in one language but not another, show placeholder or skip
- Maintain visual alignment across languages

### 4. Interactive Features

**Cross-Language Hover Highlighting:**
- Hovering over any segment highlights the SAME segment across all displayed languages
- Visual: subtle yellow/amber background
- Smooth transition (200ms)

**Pagination:**
- Navigate through pages using Previous/Next buttons
- Page number synced with URL: `?page=2`
- Display current page / total pages

**Language Selection:**
- 4 checkboxes for: Ukrainian from Latin, Ukrainian from French, Latin, French
- At least 1 language must remain selected
- Selections persist in localStorage
- Dynamic grid adjusts based on selections

### 5. Typography & Design

**Minimalist Design Principles:**
- **Font:** Serif for content (e.g., Crimson Text, Georgia)
- **Size:** 16-18px base, 1.7-1.8 line height
- **Colors:**
  - Text: near-black (#1a1a1a)
  - Background: white or soft cream
  - Borders: subtle gray (#e5e5e5)
  - Hover: soft yellow (#fef3c7)
- **Layout:** Centered content, generous margins, clean spacing

**Text Flow:**
- Latin/French: Preserve line breaks as in original
- Ukrainian: Flow as continuous paragraph
- Segment markers displayed inline as superscript

---

## User Experience Flow

### Initial Load
1. App loads with page 1
2. All JSON files fetched
3. Default languages displayed: Ukrainian from Latin (top) + Latin (bottom)
4. Segments aligned by reference markers

### Navigation
1. User clicks Previous/Next buttons
2. URL updates: `?page=2`
3. New page content rendered
4. Scroll position reset to top

### Language Selection
1. User toggles language checkboxes
2. Grid adjusts dynamically (1 or 2 columns per row)
3. Selection persisted to localStorage

### Hovering
1. User hovers over a segment in any language
2. Same segment highlighted in all displayed languages
3. Highlight removed on mouse leave

---

## Success Criteria

- [ ] JSON files loaded from texts folder
- [ ] 2x2 grid layout with dynamic stretching
- [ ] Language selection with checkboxes
- [ ] Segments aligned by reference markers
- [ ] Cross-language hover highlighting
- [ ] Pagination by page number
- [ ] Latin/French preserve line breaks
- [ ] Ukrainian flows as single block
- [ ] Segment markers displayed as superscript
- [ ] Natural sorting of segments
- [ ] Clean, minimalist typography
- [ ] URL state for page navigation
- [ ] localStorage persistence for language selection

---

## Future Enhancements

- Search across languages
- Bookmarking segments
- Adjustable font size
- Word-level interaction for dictionary lookup
- Export/share functionality
