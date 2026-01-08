# Multilingual Reading Interface - Project Specification

## Project Overview

A web-based multilingual reading interface for Descartes' "Meditations on First Philosophy" that displays parallel translations with segment-level alignment, cross-language hover highlighting, and paginated navigation.

**Tech Stack:**
- React 18 (UI framework)
- TypeScript (type safety)
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- React Router (routing)

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
- Source languages (Latin, French) have a fixed max-width (`max-w-md` = 28rem ≈ 448px)
- Centered within their grid cell
- Prevents justified text from becoming too sparse or creating large word gaps
- Ensures optimal line length for readability (typically 50-75 characters per line)

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
| `newLine` | Boolean | `true` = new paragraph with first-line indentation (1.5em), `false` = continuation of previous paragraph |
| `lines` | Array | Array of text strings containing content |

**Language-Specific Formatting:**

| Language | Line Breaks | Description |
|----------|-------------|-------------|
| Latin (`la.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| French (`fr.json`) | Preserved | Multiple lines per paragraph, matching original text layout |
| Ukrainian from Latin (`la-ua.json`) | Single block | One continuous line per paragraph, flowing translation |
| Ukrainian from French (`fr-ua.json`) | Single block | One continuous line per paragraph, flowing translation |

**Rule:** Source languages (Latin, French) preserve original line breaks verbatim. Ukrainian translations flow as single blocks.

**Key Difference:**
- **Layout**: Both use justified book-style typography
- **Line Breaking**: Source languages preserve original lines; Ukrainian flows continuously

**Rendering Approach:**

**Source Languages (Latin, French):**
- Render original lines verbatim line-by-line as they appear in JSON
- Fixed max-width container (`max-w-md` / ~28rem) with centered alignment
- Segment markers are inline with hoverable spans wrapping each segment's text
- **Typography:**
  - Font: Serif (Crimson Text)
  - Alignment: Fully justified (edge-to-edge)
  - Last line of each paragraph: Left-aligned (not stretched)
  - This creates traditional book typography
- Each line is a separate div, but only the final line of each paragraph is left-aligned

**Translations (Ukrainian):**
- Render as flowing text, segment by segment, without original line structure
- Full-width container (no max-width constraint)
- Segment markers displayed as superscripts before each segment
- **Typography:**
  - Font: Sans-serif (Inter, system-ui)
  - Alignment: **Fully justified** (edge-to-edge) like a book page
  - Text flows naturally and wraps as needed (no fixed line breaks)
  - Last line of paragraph naturally left-aligned by browser
- Segments flow inline with spaces preserved between them
- Creates book-like appearance but with continuous flowing text

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
- Supports both Latin 'a' and Cyrillic 'а' in markers (normalized to Latin)

**Segment Parsing:**
1. Parse reference markers from all language files
2. Extract text between markers as segments
3. **Important:** Do NOT trim spaces from segment boundaries
   - Preserves natural spacing between segments
   - Only trim leading space from the very first segment
4. Match segments across languages by ID
5. Display aligned segments in grid layout

**Natural Sorting:**
- Segments sort numerically then alphabetically: 1, 2, 6, 6a, 7, 7a, 8, 10, 10a, 11

**Handling Missing Segments:**
- If a segment exists in one language but not another, skip rendering it
- Log warning to console for debugging
- Continue rendering available segments
- Maintain visual alignment across languages

**Rendering:**
- **Source languages:** Segments are embedded within justified lines, hoverable inline
- **Translations:** Each segment renders as `<sup>(N)</sup><span>text</span>` flowing inline
- All segments within same language block share hover state for cross-language highlighting

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

**Typography & Text Flow:**

Both source and translation languages use **book-style justified typography** for a cohesive reading experience. The key difference is in line breaking:

**Source Languages (Latin, French):**
- Font: Serif (Crimson Text) for classical readability
- Alignment: **Fully justified** with last line of each paragraph left-aligned
- Layout: Fixed max-width container (28rem), centered
- Line breaks: **Preserved exactly as in original source** (each line from JSON rendered separately)
- Paragraphs: First-line indentation (1.5em) when `newLine: true`
- Segment markers: Inline superscript markers like `⁽¹⁾` within justified text
- Creates traditional book page with original formatting intact

**Translations (Ukrainian):**
- Font: Sans-serif (Inter) for modern readability
- Alignment: **Fully justified** with natural last line left-aligned
- Layout: Full-width, no max-width constraint
- Line breaks: **Not preserved** - text flows continuously as single paragraph
- Paragraphs: First-line indentation (1.5em) when `newLine: true`, vertical spacing between paragraphs
- Segment markers: Superscript markers like `⁽¹⁾` at the start of each segment
- Spacing: Preserved between segments (no trimming)
- Creates book page appearance with modern flowing text layout

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

- [x] JSON files loaded from texts folder at app startup
- [x] 2x2 grid layout with configurable flow direction (top-to-bottom / left-to-right)
- [x] Settings sidebar with gear icon toggle (slide-in from right)
- [x] Language selection via 2x2 visual checkbox grid
- [x] Segments aligned by reference markers across all languages
- [x] Cross-language hover highlighting with smooth transitions
- [x] Pagination by page number with prev/next navigation
- [x] Latin/French preserve line breaks with justified alignment and max-width constraint
- [x] Ukrainian flows as single block with sans-serif font
- [x] Segment markers displayed as superscript
- [x] Natural sorting of segments (1, 2, 6, 6a, 7, 7a, etc.)
- [x] URL state for page navigation (?page=N)
- [x] localStorage persistence for settings (languages, flow direction, page number)
- [x] Text spacing preserved between segments (no trimming bugs)
- [x] Last line of paragraphs left-aligned (not justified)
- [x] Error boundary for graceful error handling
- [x] All texts loaded once at startup (no lazy loading per page)

---

## Future Enhancements

- Search across languages
- Bookmarking segments
- Adjustable font size
- Word-level interaction for dictionary lookup
- Export/share functionality
