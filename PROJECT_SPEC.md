# Multilingual Reading Interface - Project Specification

## Project Overview

A web-based multilingual reading interface for Descartes' "Meditations on First Philosophy" that displays parallel translations with segment-level alignment, cross-language hover highlighting, and paginated navigation.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS

---

## Core Requirements

### 1. Layout Architecture

**2x2 Grid System with Configurable Flow:**

The grid displays up to 4 language blocks. Flow direction is configurable via settings:

**Flow Options:**
- **Top-to-bottom:** Each row contains source + translation pair
  - Row 1: Latin (`la`) | Ukrainian from Latin (`la-ua`)
  - Row 2: French (`fr`) | Ukrainian from French (`fr-ua`)
- **Left-to-right:** Each column groups by type
  - Column 1: Source languages (`la`, `fr`)
  - Column 2: Translations (`la-ua`, `fr-ua`)

*Rationale: Top-to-bottom may not show full text on smaller screens; left-to-right allows viewing complete source and translation side-by-side.*

**Source Text Constraints:**
- Source languages (Latin, French) have a fixed max-width
- Prevents justified text from becoming too sparse

### 2. Settings Sidebar

**Access:** Gear icon in the corner opens settings panel

**Settings Contents:**
- **Flow Direction:** Toggle between top-to-bottom and left-to-right layouts
- **Language Selection:** 2x2 checkbox grid that visually mirrors the layout structure

**Language Selection:**
- 4 checkboxes arranged in 2x2 grid matching layout positions
- At least 1 language must be selected at all times
- Selections persist in localStorage
- Default: Ukrainian from Latin + Latin

### 3. Data Format

**Source Files:**
```
public/texts/
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
| `newLine` | Boolean | `true` = paragraph starts with indentation (space), `false` = continuation |
| `lines` | Array | Array of text strings containing content |

**Language-Specific Formatting:**

| Language | Line Breaks | Description |
|----------|-------------|-------------|
| Latin (`la.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| French (`fr.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| Ukrainian from Latin (`la-ua.json`) | Single block | One continuous line per paragraph, flowing translation |
| Ukrainian from French (`fr-ua.json`) | Single block | One continuous line per paragraph, flowing translation |

**Rule:** Source languages (Latin, French) preserve original line breaks verbatim. Ukrainian translations flow as single blocks.

**Rendering Approach:**
- **Source languages (la, fr):** Render original lines verbatim line-by-line as they appear in JSON. Segment markers are inline with hoverable spans wrapping each segment's text. Fixed max-width container.
- **Translations (la-ua, fr-ua):** Render as flowing text, segment by segment, without original line structure.

**Special Markers in Text:**
- Reference numbers: `(1)`, `(2)`, `(6a)`, `(7a)` - segment identifiers for alignment
- Asterisk `*` - marks beginning of new sections
- Pipe `|` - indicates column breaks in original Latin text
- Hyphen at line end - word continuation (Ukrainian)

### 4. Text Segmentation & Alignment

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

### 5. Interactive Features

**Cross-Language Hover Highlighting:**
- Hovering over any segment highlights the SAME segment across all displayed languages
- Smooth transition on hover

**Pagination:**
- Navigate through pages using Previous/Next buttons
- Page number synced with URL: `?page=2`
- Display current page / total pages

**Settings Sidebar:**
- Gear icon toggle in corner
- Flow direction selection
- 2x2 language checkbox grid
- Settings persist in localStorage

### 6. Design Principles

**Minimalist Design:**
- Clean typography with good readability
- Subtle borders and spacing
- Visual hover feedback for segments
- Centered content with generous margins

**Text Flow:**
- Latin/French: Preserve line breaks as in original, fixed max-width
- Ukrainian: Flow as continuous paragraph
- Segment markers displayed inline as superscript

---

## User Experience Flow

### Initial Load
1. App loads with page 1
2. All JSON files fetched
3. Default languages displayed based on stored preferences
4. Segments aligned by reference markers

### Navigation
1. User clicks Previous/Next buttons
2. URL updates: `?page=2`
3. New page content rendered
4. Scroll position reset to top

### Settings
1. User clicks gear icon
2. Settings sidebar opens
3. User can toggle flow direction (top-to-bottom / left-to-right)
4. User can select languages via 2x2 checkbox grid
5. Changes apply immediately and persist

### Hovering
1. User hovers over a segment in any language
2. Same segment highlighted in all displayed languages
3. Highlight removed on mouse leave

---

## Success Criteria

- [ ] JSON files loaded from texts folder
- [ ] 2x2 grid layout with configurable flow direction
- [ ] Settings sidebar with gear icon toggle
- [ ] Language selection via 2x2 visual checkbox grid
- [ ] Segments aligned by reference markers
- [ ] Cross-language hover highlighting
- [ ] Pagination by page number
- [ ] Latin/French preserve line breaks with max-width constraint
- [ ] Ukrainian flows as single block
- [ ] Segment markers displayed as superscript
- [ ] Natural sorting of segments
- [ ] URL state for page navigation
- [ ] localStorage persistence for settings

---

## Future Enhancements

- Search across languages
- Bookmarking segments
- Adjustable font size
- Word-level interaction for dictionary lookup
- Export/share functionality
