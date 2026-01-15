# Descartes Multilingual Reading Interface

A scholarly web-based reading interface for René Descartes' *Meditations on First Philosophy* (Meditationes de Prima Philosophia), designed for comparative multilingual study.

## Overview

This application presents Descartes' foundational philosophical work in its original Latin and French texts alongside Ukrainian translations. The interface enables readers to:

- **Compare source texts side-by-side** - Latin (1641/1642 editions) and French (1647 edition) in parallel
- **Study translations** - Ukrainian translations from both Latin and French sources
- **Navigate aligned segments** - Numbered markers sync corresponding passages across all languages
- **Preserve historical typography** - Original line breaks and page markers from early editions

Designed for scholars, students, and readers who want to engage with Descartes' text in its multiple authoritative versions, comparing philosophical nuances across languages and examining how ideas were expressed differently in Latin versus French.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand

---

## 1. Data Format

### 1.1 Source Files

```
public/descartes/meditations/
  la.json       # Latin source text
  la-ua.json    # Ukrainian translation from Latin
  fr.json       # French source text
  fr-ua.json    # Ukrainian translation from French
```

### 1.2 JSON Structure

```json
{
  "pages": [
    {
      "pageNumber": 1,
      "paragraphs": [
        {
          "type": "h1",
          "lines": ["MEDITATION V"]
        },
        {
          "type": "h2",
          "lines": ["On the essence of material things..."]
        },
        {
          "type": "h3",
          "lines": ["Subheading text..."]
        },
        {
          "lines": [" (1)Text content...", "(2)More text..."]
        }
      ]
    }
  ]
}
```

### 1.3 Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `pages` | Array | Collection of page objects |
| `pageNumber` | Number | Sequential page identifier (1, 2, 3...) |
| `paragraphs` | Array | Collection of paragraph objects |
| `type` | String (optional) | Paragraph type: `"h1"`, `"h2"`, `"h3"`. Omit for regular paragraphs |
| `lines` | Array | Text strings within the paragraph |

### 1.4 Paragraph Structure in JSON

**Consecutive paragraphs:**
When paragraphs flow one after another in the text, they can be stored in a single `paragraphs` array entry. A **leading space** before a line indicates a new paragraph:

```json
{
  "paragraphs": [
    { "lines": [
      " (1)First paragraph starts with space...",
      "(2)Continuation - no leading space",
      " (3)New paragraph - starts with space"
    ]}
  ]
}
```

**Separate entries for headers:**
Headers (h1, h2, h3) always require their own paragraph entry:

```json
{
  "paragraphs": [
    { "type": "h1", "lines": ["MEDITATION V"] },
    { "type": "h2", "lines": ["On the essence of material things..."] },
    { "type": "h3", "lines": ["Subheading text..."] },
    { "lines": [" (1)Body text starts..."] }
  ]
}
```

**Rules:**
- Leading space before a line → New paragraph (visual indent applied)
- No leading space → Continuation of previous paragraph
- Headers always get separate paragraph entries with `type` field
- Regular text can have multiple paragraphs in one entry using leading spaces

### 1.5 Segment Markers

Text contains numbered reference markers for cross-language alignment:

| Marker Type | Example | Description |
|------------|---------|-------------|
| Number | `(1)`, `(2)`, `(10)` | Primary segment |
| With suffix | `(6a)`, `(7a)`, `(10a)` | Sub-segment |

### 1.6 Paragraph Types

| Type | Rendering | Container Width | Alignment | Example |
|------|-----------|----------------|-----------|---------|
| `h1` | Large, bold | ~50% (narrower than text) | Center | "MEDITATION V" |
| `h2` | Italic | ~50% (narrower than text) | Center | "On the essence of material things..." |
| `h3` | Smaller heading | ~50% (narrower than text) | Center | "Subheading text..." |
| Omitted (default) | Regular paragraph | Fixed for originals, full for Ukrainian | Justified | Body text |

**Rules:**
- Headings use `lines` array (consistent with paragraphs)
- Narrow container (~50% width) keeps headers visually distinct from body text
- Headers can wrap/flow across multiple lines in any language
- All header types (h1, h2, h3) are center-aligned
- Headers never contain segment markers - only regular paragraph text is segmented
- Omitting `type` → treated as regular paragraph

**Special characters:** `*` and `|` are scholarly notation markers rendered as plain text.

### 1.7 Language-Specific Line Handling

| Language | Line Breaks | Data Format | Rationale |
|----------|-------------|-------------|-----------|
| Latin (`la`) | Preserved | Each original line is separate entry | Match original edition layout with line numbers |
| French (`fr`) | Flow continuously | Paragraphs joined, breaks at leading spaces | Modern flowing text like translations |
| Ukrainian (`la-ua`, `fr-ua`) | Flow continuously | Paragraphs joined, breaks at leading spaces | Modern translation, no fixed layout |

---

## 2. Text Rendering

### 2.1 Typography Principles

Both source and translation languages use **book-style justified typography** for body text:

- **Alignment:** Fully justified (edge-to-edge)
- **Last line of paragraph:** Left-aligned (not stretched), unless it's also the first line
- **Paragraph indent:** 1.5em for new paragraphs (detected by leading space)
- **Segment markers:** Superscript format
- **Headings (h1, h2):** Center-aligned, narrower container (~50% width)

### 2.2 Latin Source Text

```
Font:       Serif (Crimson Text)
Width:      60ch (longest lines ~61 chars), centered in cell
Justify:    Yes (book-style, like all languages)
Lines:      Preserved exactly from JSON
Markers:    Inline superscript ⁽¹⁾ within text
Line nums:  Every 5th line numbered (5, 10, 15, 20...)
```

Each line from the JSON array is rendered as a separate block, maintaining the original typographic structure of Descartes' Latin text. The 60ch width prevents line wrapping.

**Line numbering (Latin only):**
- Display line number on every 5th line (5, 10, 15, 20, 25, 30...)
- Numbers appear in the left margin
- Calculated on frontend based on line position within each page
- Mimics scholarly edition conventions

### 2.3 French and Ukrainian Texts

```
Font:       Serif (PT Serif for Ukrainian Cyrillic, Crimson Text for French)
Max-width:  None (full container width)
Lines:      Flow continuously, wrap naturally
Paragraphs: Detected by leading spaces in source data
Markers:    Superscript ⁽¹⁾ before each segment
```

French text and Ukrainian translations flow as continuous prose. Paragraph breaks determined by leading space in source data. All three (fr, la-ua, fr-ua) use identical rendering logic with no fixed line breaks or line numbering.

---

## 3. Segment Alignment

### 3.1 Parsing

1. Extract markers using regex: `/\((\d+[a-z]?)\)/g`
2. Extract text between markers as segment content
3. **Preserve spaces** — Do not trim segment boundaries
4. Only trim leading space from the very first segment

### 3.2 Cross-Language Alignment

All languages use the same segment IDs:

```
Latin:     (1)Tam justa causa... (2)& tam justam...
Ukrainian: (1)Настільки справедлива... (2)і такою ж справедливою...
```

Segments are matched by ID across all displayed languages.

### 3.3 Natural Sorting

Segments sort numerically, then alphabetically:
`1, 2, 6, 6a, 7, 7a, 8, 10, 10a, 11`

### 3.4 Missing Segments

If a segment exists in one language but not another:
- Skip rendering that segment for the missing language
- Log warning to console
- Continue rendering available segments

---

## 4. Interactive Features

### 4.1 Cross-Language Hover Highlighting

- Hover over any segment → highlight same segment in all displayed languages
- Visual feedback: Yellow background (`bg-yellow-200`)
- Smooth transition on hover state change

### 4.2 Pagination

- Navigate via Previous/Next buttons
- URL state: `?page=N`
- Page number persists in localStorage
- Scroll position resets to top on page change

---

## 5. Layout

### 5.1 Grid System

2x2 grid displaying up to 4 language blocks simultaneously.

**Main container:** Full viewport width with responsive padding. No max-width limit — on large screens uses comfortable margins, on smaller screens fills most of the screen.

### 5.2 Flow Direction Options

**Top-to-bottom (default):** Each row is source + translation pair
```
Row 1: Latin (la)        | Ukrainian from Latin (la-ua)
Row 2: French (fr)       | Ukrainian from French (fr-ua)
```

**Left-to-right:** Columns group by type
```
Col 1: Latin (la)        | Col 2: Ukrainian from Latin (la-ua)
       French (fr)       |        Ukrainian from French (fr-ua)
```

*Rationale: Left-to-right allows viewing complete source and translation side-by-side on smaller screens.*

### 5.3 Latin Fixed Width

Only Latin uses **fixed width** to preserve original book layout:

**Fixed width:**
- **Latin:** `60ch` (longest lines ~61 characters)

The 60ch block is centered within its grid cell (not left-aligned). Horizontal scroll if needed.

**Benefits:**
- Preserves original line breaks exactly as in historical editions
- No artificial text wrapping
- Consistent, stable layout across all pages
- Mimics physical book experience (pages don't resize)
- Simpler implementation than dynamic calculation

**Note:** The width matches the original Latin edition line lengths. French flows like Ukrainian translations with no fixed width.

### 5.4 Language Selection and Grid Stability

The 2x2 grid layout is **fixed** and does not collapse when languages are disabled:

**Grid positions (Top-to-bottom flow):**
```
Row 1, Col 1: Latin (la)          | Row 1, Col 2: Ukrainian from Latin (la-ua)
Row 2, Col 1: French (fr)         | Row 2, Col 2: Ukrainian from French (fr-ua)
```

**Grid positions (Left-to-right flow):**
```
Row 1, Col 1: Latin (la)          | Row 1, Col 2: Ukrainian from Latin (la-ua)
Row 2, Col 1: French (fr)         | Row 2, Col 2: Ukrainian from French (fr-ua)
```

**Behavior when languages are disabled:**
- Unselected languages simply don't appear (cell is not rendered)
- Other language blocks **do not shift or move** to fill empty space
- Grid structure stays consistent regardless of which languages are selected
- This preserves spatial memory and prevents disorienting layout changes

---

## 6. Settings Sidebar

### 6.1 Access

Gear icon in the corner opens a slide-in panel from the right.

### 6.2 Flow Direction Toggle

Radio buttons for layout direction:
- Top to Bottom
- Left to Right

### 6.3 Language Selection

2x2 checkbox grid matching the layout structure:

```
[ ] Latin        [ ] Ukrainian (Latin)
[ ] French       [ ] Ukrainian (French)
```

**Constraints:**
- At least 1 language must be selected
- Last remaining checkbox is disabled

### 6.4 Persistence

All settings saved to localStorage:
- Selected languages
- Flow direction
- Current page number

---

## 7. State Management

### 7.1 Zustand Store

Single source of truth for all application state:

```typescript
interface AppStore {
  // Data
  allTexts: Record<LanguageCode, TextData> | null;
  currentPage: number;
  totalPages: number;

  // Settings (persisted)
  selectedLanguages: LanguageCode[];
  flowDirection: 'top-to-bottom' | 'left-to-right';
  settingsSidebarOpen: boolean;

  // UI
  hoveredSegmentId: string | null;
  loading: boolean;
  error: string | null;
}
```

### 7.2 Data Loading

All 4 JSON files are loaded once at app startup. No lazy loading per page.

---

## 8. Component Architecture

```
App
├── ErrorBoundary
└── Reader
    ├── ReaderHeader
    │   ├── Pagination
    │   └── SettingsToggle (gear icon)
    ├── SettingsSidebar
    │   ├── FlowDirectionToggle
    │   └── LanguageGrid2x2
    └── TextGrid (2x2 layout)
        └── LanguageBlock (x4)
            ├── VerbatimText (source languages)
            └── SegmentFlow (translations)
```

---

## 9. Error Handling

- React ErrorBoundary catches rendering errors
- Network errors displayed to user with retry option
- Missing pages handled gracefully (no crash)
- Console warnings for missing segments (debugging aid)

---

## 10. Success Criteria

### Core
- [ ] All 4 JSON files load at startup
- [ ] Segments aligned by markers across languages
- [ ] Cross-language hover highlighting
- [ ] Pagination with URL sync (?page=N)

### Typography
- [ ] Latin: Crimson Text serif, fixed width (60ch), centered
- [ ] Latin only: Preserved line breaks from 1642 edition
- [ ] Latin only: Line numbers every 5th line in left margin
- [ ] French and Ukrainian: PT Serif (Ukrainian) / Crimson Text (French)
- [ ] French and Ukrainian: Flowing text, full container width, paragraph breaks at leading spaces
- [ ] All: Justified alignment, last line left-aligned (unless first line)
- [ ] Paragraph indentation (1.5em) detected by leading space
- [ ] Headers: ~50% width, center-aligned, can wrap in any language

### Layout
- [ ] 2x2 grid with configurable flow direction
- [ ] Settings sidebar with gear icon toggle
- [ ] Language selection via 2x2 checkbox grid
- [ ] At least 1 language enforced

### Persistence
- [ ] Settings in localStorage
- [ ] Page number in URL and localStorage
