---
name: figma-to-code
description: >
  Use this skill whenever the user shares a Figma link, Figma URL, Figma node ID,
  or asks you to implement, build, replicate, or pixel-match any design from Figma —
  even if they just say "build this from Figma", "implement the design", "match the
  Figma", "here's the Figma link", "convert Figma to code", or paste a figma.com URL.
  Use it for any target framework: React (Next.js / Vite / CRA), React Native
  (Expo / bare), or Flutter. This skill handles designs of ANY complexity — from simple
  components to massive multi-screen files — using a REST API pre-extractor for reliable
  pixel-perfect (>=90% fidelity) production code.
---

# Figma → Code v2 (>=95% Fidelity, Production-Ready)

## Core Philosophy

You are a **principal engineer** building production software from a Figma design.
Not a code generator. Not a pixel copier. A principal engineer who:

1. **Understands before building** — reads the full design, understands what each
   component IS (a tab bar, not buttons), how sections connect, what's dynamic
   vs static, and asks when anything is unclear.

2. **Builds with precision** — every value from the spec appears in the code.
   Every padding, every letterSpacing, every borderRadius, every shadow.
   Missing one property = the component doesn't match. There is no "close enough."

3. **Verifies against reality** — builds one component, screenshots it, compares
   to the Figma screenshot, identifies mismatches, fixes them, re-verifies.
   Never ships unverified work.

4. **Thinks beyond the visual** — Figma shows how it LOOKS. A principal engineer
   also thinks: what happens on a small screen? What if the list is empty?
   What about accessibility? What data model backs this? How does state flow?

5. **Never guesses** — if a value isn't in the spec, it's not in the code.
   If something is ambiguous, asks the user. If an asset is missing, flags it.
   Hallucinated code is worse than no code.

## The Fundamental Problem

Large Figma designs (100K+ tokens) consistently produce output that looks nothing
like the original. This happens because:

- **Data loss**: MCP tools truncate at ~10K tokens. Half the design is invisible.
- **Style loss**: extractors drop properties (borderRadius, shadows, letterSpacing,
  gradients, absolute positioning, text truncation, mixed styles, etc.).
- **Context loss**: on large pages, the builder loses semantic meaning — tabs become
  buttons, lists become columns, the relationship between sections is lost.
- **No verification**: build everything, hope it matches. It never does.
- **No production thinking**: visual matching without responsive, accessible,
  state-managed, data-ready code is just a screenshot, not software.

## How v2 Solves This

```
EXTRACT ──→ UNDERSTAND ──→ BUILD+VERIFY ──→ HARDEN ──→ SHIP
   │              │              │               │          │
   │              │              │               │          │
Full REST API  Semantic map   Per-component    Responsive  Production
fetches ALL    identifies     atomic loop:     a11y        code ready
node data.     WHAT each      build → screenshot state     to merge.
No truncation. component IS.  → compare → fix  data
All styles.    Dynamic vs     → re-verify.     navigation
Smart assets.  static. Ask    Max 3 tries.     edge cases
               when unclear.  Lock & advance.  theme, perf
```

**The core loop is: Extract → Understand → Build one → Verify one → Iterate → Next**

Not: Extract → Build everything → Hope.

## Non-Negotiable Principles

These rules override everything else. If a phase instruction conflicts with
these principles, the principles win.

### 1. Every Value From the Spec
If the spec says `padding: 12px 8px 12px 16px`, the code has exactly that.
Not `padding: 12px`. Not `padding: 16px`. The exact value. This applies to
EVERY property: colors, fonts, sizes, spacing, radii, shadows, opacity,
alignment, constraints, text properties, gradients — everything.

### 2. Never Substitute or Hallucinate
- No Material Icons when SVGs are missing → flag it with `// TODO`
- No buttons when the design shows tabs → use the correct component
- No guessed colors, spacing, or behavior → ask the user
- No invented states or interactions → only what's in the design

### 3. Understand Before Building
Read the full-screen screenshot before writing ANY code. Map every section
to its semantic pattern. Understand parent-child relationships. Identify
what's dynamic. Flag what's unclear. This 10-minute investment prevents
hours of rework.

### 4. Verify Every Component
After building each component, capture a screenshot and compare it to the
Figma screenshot. Generate a structured diff. Fix mismatches. Re-verify.
Never mark a component as done without visual verification.

### 5. Read Top-Down, Build Bottom-Up
Read the FULL design top-down first — screen → sections → components → leaves.
Understand the complete context, relationships, and semantic patterns.
Then BUILD bottom-up — smallest leaves first, verify each one, assemble
upward. Each buildable unit ≤ 10K tokens. If too big, drill deeper until
it fits. This ensures full precision at every level — errors don't compound.

### 6. Think Like a Principal Engineer
The design shows the happy path at one screen size. Production code handles:
- Every screen size (320px → tablet)
- Every state (loading, error, empty, full)
- Every user (screen reader users, RTL languages, large text)
- Every failure (network down, image 404, slow connection)
- Every data shape (empty list, single item, very long text)

## Technical Architecture

Instead of calling Figma MCP tools directly (which truncate at ~10K tokens and
fail on large designs), this skill runs a Node.js extractor that fetches the full
design via Figma REST API, analyzes it, and writes pre-chunked specs to disk.
You read those specs and build bottom-up with per-component verification.

The extractor captures **every** Figma style property:
- Layout: direction, padding (4 sides), gap, alignment (both axes), wrap,
  absolute positioning, constraints, min/max sizes, overflow, clips
- Fills: solid (with opacity), linear/radial/angular/diamond gradients (with
  angle from handlePositions + stops), image fills (scaleMode, rotation, filters)
- Borders: weight, color, align, cap, join, dash, individual weights, radius
  (all 4 corners), corner smoothing (squircle)
- Effects: drop/inner shadow (offset, blur, spread, color), layer/backdrop blur
- Text: font, weight, size, lineHeight, letterSpacing, color, italic, textCase,
  textDecoration, hAlign, vAlign, autoResize, truncation, maxLines,
  paragraphSpacing, characterStyleOverrides (mixed rich text styles)
- Node: opacity, blendMode, rotation, visible, isMask/maskType
- Assets: smart-filtered icons (INSTANCE/FRAME/STAR, 12-48px, skip sub-paths),
  fill images via getImageFills API

---

## Prerequisites

The user needs a Figma Personal Access Token set as an environment variable:
```
export FIGMA_ACCESS_TOKEN=figd_xxxxx
```

If not set, ask the user to generate one at:
Figma → Settings → Account → Personal access tokens

---

## Phase 0 — Detect Framework & Project Context

Before anything else, determine the target framework and understand the project.

### Framework Detection
- Files present? (`pubspec.yaml` → Flutter, `app.json`/`expo` → React Native,
  `next.config.*` / `vite.config.*` / `package.json` with `react` → React)
- User stated it explicitly? Use that.
- Not clear? Ask: "Which framework — React, React Native, or Flutter?"

Load the matching reference file:
- React/Next.js → `references/react.md`
- React Native / Expo → `references/react-native.md`
- Flutter → `references/flutter.md`

### Project Context Discovery (non-negotiable)

Scan the project to understand its conventions:
1. **Styling approach** — CSS Modules? Tailwind? StyleSheet? Check existing files.
2. **Theme / design tokens** — look for token files. Map extracted tokens to existing ones.
3. **Existing components** — scan component directories for reusable matches.
4. **Assets directory** — find where icons/images are stored.
5. **State management** — follow the project's pattern.
6. **API layer** — follow existing patterns.
7. **Font setup** — check layout files, CSS imports, font config.

---

## Phase 1 — Extract Design Data

Extract the file key and node ID from the Figma URL:
- `figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>` → convert `-` to `:` in nodeId
- `figma.com/design/<fileKey>/branch/<branchKey>/<fileName>` → use branchKey as fileKey

Run the extractor:

```bash
node <plugin-path>/src/figma-extract.js \
  --file=<fileKey> \
  --node=<nodeId> \
  --token=$FIGMA_ACCESS_TOKEN \
  --out=.figma-extract
```

Wait for it to complete. It will output:
- `blueprint.md` — full structure, build order, reusables, tokens, assets
- `chunks/` — per-component specs (~10K tokens each)
- `reusables/` — component specs that are used multiple times
- `screenshots/` — visual references per chunk
- `raw/` — raw Figma JSON per chunk (source of truth — nothing dropped)
- `AUDIT.md` — flags any node properties NOT captured by chunk-writer
- `assets/icons/` — smart-filtered SVG icons (only real icons, not sub-paths)
- `assets/images/` — fill images (PNG) downloaded via Figma Image Fills API

**Raw JSON fallback**: The formatted chunk specs (`chunks/`) are readable but might
miss edge-case properties. The raw JSON files (`raw/`) contain the COMPLETE Figma
node data — nothing is dropped. If verification reveals a mismatch not explained by
the formatted spec, check the raw JSON for the corresponding chunk.

**Property audit**: `AUDIT.md` lists any Figma node properties found in the data
but not explicitly handled by the chunk-writer. Review this during Phase 2 — if any
flagged property could affect visual output, check the raw JSON for that node.

**Asset filtering**: The extractor only exports real icons — INSTANCE components,
semantic-named FRAMEs at icon sizes (12-48px), and STAR nodes. It skips junk
sub-paths (Vector, Rectangle, Line, path* nodes inside compound shapes/groups).
This typically reduces exports from thousands of nodes to ~10-30 real icons.

**Layering data in output**: The chunk specs include `pos:ABSOLUTE` for elements
that overlay siblings, `clip:true` for containers that clip overflow, `isFixed`
for elements pinned to viewport, and `constraints` for positioning rules. These
are critical for correct rendering — they determine Stack vs Column/Row,
clipBehavior, and fixed vs scrolling placement. Pay attention to these during
Phase 2 reading, not just during Phase 3 building.

If the extractor fails, check:
1. Is `$FIGMA_ACCESS_TOKEN` set?
2. Is the file key / node ID correct?
3. Does the user have a Full/Dev seat (not View/Collab)?

**MCP Fallback**: If the REST API is unavailable, fall back to Figma MCP tools
(`get_design_context`, `get_figma_data`, `get_screenshot`) for individual small
components only. Never use MCP for the full design fetch.

---

## Phase 2 — Top-Down Reading (Understand First, Build Nothing)

**READ TOP-DOWN. The entire design must be understood before a single line of code.**

This is where you build the FULL mental model of the design. You read from the
top of the tree to the bottom — screen → sections → components → leaf elements.
By the time you finish Phase 2, you know:
- What every section IS (semantic pattern)
- How every section CONNECTS to its siblings
- What the page FLOW looks like
- Where dividers, gaps, and visual rhythm exist
- What scrolls, what's fixed, what overlaps
- What's dynamic data vs static labels

### Step 1: Read the Blueprint

1. Read `.figma-extract/blueprint.md` — understand the complete tree structure
2. Read the **full-screen screenshot** (`screenshots/full-screen.png`) to visually
   understand what the whole page looks like
3. Review the **Build Order** — this is the bottom-up sequence for building
4. Review **Reusable Components** — these get built first, reused everywhere
5. Review **Design Tokens** — map extracted colors/fonts to project's existing tokens
6. Review **Assets** — confirm icons and images are exported
7. Review **AUDIT.md** (if present) — check for flagged uncaptured properties.
   If any flagged property could affect visual output (e.g., a new Figma feature),
   note it and check `raw/*.json` during building.

### Step 2: Understand the Decomposition

The extractor chunks the design into ~10K token pieces. Each chunk is one
buildable unit. But YOU need to understand HOW these chunks connect:

```
READING ORDER (top-down — understand):
Full Screen → Section → Component → Frame → Inner Frame → Leaf

Screen (Futures/Home)                    ← you read this FIRST
├─ Section: Header                       ← then understand each section
│  └─ Component: TopHeader (chunk)       ← then what each component IS
├─ Section: P&L                          ← and how they connect
│  └─ Component: PnlGradient (chunk)
├─ Section: Start Trading
│  ├─ Component: CoinTabs (chunk)        ← this is a TAB BAR, not buttons
│  ├─ Component: Chart (chunk)           ← this is CHART data, not an image
│  └─ Component: TradeButtons (chunk)    ← these are CTAs, connected to coin
├─ Section: Watchlist
│  ├─ Component: WatchlistTabs (chunk)
│  └─ Component: CoinList (chunk)        ← this is a LIST, not hardcoded rows
└─ Section: Bottom Nav (chunk)           ← this is NAVIGATION, not a toolbar
```

By reading top-down, you capture the CONTEXT that each component exists within.
The CoinTabs component isn't just "a row of pills" — it's the selector that
controls which coin the chart and trade buttons show. That context matters.

**While reading the tree, identify layering relationships:**
- Look for `pos:ABSOLUTE` in the chunk specs — these are elements that OVERLAY
  their siblings (badges, glow effects, gradient backgrounds, floating indicators)
- Look for `clip:true` — these parents clip overflowing children
- Note which elements are `isFixed` — they stay in place while content scrolls
- In the tree structure, children listed AFTER siblings paint ON TOP of them
- Mark every layering relationship you find — you'll need Stack/Positioned for these

### Step 3: Chunk Sizing Rule

**Each buildable component must be ≤ 9.5K-10K tokens.**

If a chunk is still too large or complex, drill deeper:

```
Section too large?
└─ Drill into its children (nodes)
   └─ Node still too large?
      └─ Drill into its frames
         └─ Frame still too large?
            └─ Drill into underlying frames
               └─ Build at the leaf level where one component
                  fits within ~10K tokens
```

The extractor already does this chunking automatically. But when BUILDING,
if a component feels too complex to get right in one pass — break it down
further yourself. Build the inner pieces first, verify each one, then
assemble the parent.

**Never try to build a 30K+ token component in one shot.** Decompose until
each piece is small enough to hold in full context with every style property.

### Step 4: Present Inventory

Present the inventory to the user:

```
Figma Design: <name>
──────────────────────────────────
Sections: <N> top-level
Components: <N> unique, <M> total instances
Build order: <N> steps (leaves first → full screen)

Decomposition:
  Screen
  ├─ Header section (2 chunks)
  ├─ Content section (8 chunks)
  └─ Navigation (1 chunk)

Reusable components:
  - ComponentA (used Nx)
  - ComponentB (used Nx)
  ...

Design tokens mapped: <N> colors, <N> typography, <N> spacing values

Ready to build. Proceed?
```

Wait for user confirmation. Do NOT write code yet.

---

## Phase 2.5 — Semantic Design Mapping (non-negotiable)

Before building ANYTHING, read the `screenshots/full-screen.png` and understand
the DESIGN as a principal engineer would. This prevents context loss on large pages.

### Step 1: Identify Every UI Pattern

Read the full-screen screenshot and map each section to its semantic UI pattern:

```
Example:
- Horizontal items with underline on active → TAB BAR (not buttons)
- Rows with icon + text + price + chevron → LIST ITEMS (not cards)
- Horizontal scrollable cards with tags → CAROUSEL CARDS
- Fixed bar at bottom with icons + labels → BOTTOM NAVIGATION BAR
- Grid of small icon+text items → QUICK ACTION GRID
- Badge overlapping card corner → STACK with ABSOLUTE positioned badge
- Blurred circle behind section content → STACK with background glow layer
- Gradient rectangle behind text → STACK with gradient overlay behind content
- Floating price label on chart → STACK with positioned indicator
```

**Rules:**
- A tab bar is a tab bar, not a row of buttons — use TabBar/TabController
- A list is a list — use ListView.builder, not Column with mapped children
- A bottom nav is a bottom nav — use BottomNavigationBar or equivalent
- A horizontal scroller is a horizontal scroller — use ListView horizontal
- Cards are cards, chips are chips, badges are badges — use correct semantics
- An absolute-positioned overlay IS a Stack — never flatten it into the flow

### Step 2: Map Parent-Child & Layering Relationships

Understand how sections CONNECT and how they LAYER. The full page has flow,
hierarchy, AND depth:
- What scrolls? What's fixed? (fixed = different z-layer)
- Which sections are siblings? Which are nested?
- Where are dividers? What's the visual rhythm?
- What's the tab content vs. tab bar vs. page scaffold?
- **What overlaps?** Which elements sit ON TOP of others?
- **What's behind?** Which elements are background/decoration layers?
- **What clips?** Which containers hide overflow from children?

Write this semantic map BEFORE building, annotating layering with `[STACK]`,
`[ABSOLUTE]`, `[FIXED]`, and `[CLIPS]`:

```
Scaffold
├─ [FIXED] TopHeader (app bar) — stays above scroll content
├─ Scrollable body:
│  ├─ P&L gradient section
│  │  └─ [STACK] gradient rect [ABSOLUTE behind] + content on top
│  ├─ Explore/Strategies TAB BAR (2 tabs)
│  ├─ Quick actions HORIZONTAL SCROLL
│  ├─ Announcements section (header + HORIZONTAL CARD SCROLL)
│  │  └─ Each card: [STACK] glow ellipse [ABSOLUTE behind] + card content
│  ├─ Divider
│  ├─ Start Trading (header + COIN TAB BAR + chart + buttons)
│  │  └─ Chart: [STACK] grid lines + candles + floating price badge [ABSOLUTE]
│  ├─ Watchlist TAB BAR (5 tabs)
│  ├─ Coin LIST (5 rows)
│  ├─ View All button
│  └─ Contests (header + HORIZONTAL CARD SCROLL)
│     └─ Each card: [STACK] card content + status badge [ABSOLUTE top-left]
│                    [CLIPS] card container clips image overflow
└─ [FIXED] Bottom NAVIGATION BAR (5 items) — stays above scroll content
   └─ [STACK] angled polygon bg [painted] + nav items on top
```

**Every `pos:ABSOLUTE` in the spec = a Stack in code. Missing this = wrong layout.**
**Every `clip:true` = clipBehavior on the container. Missing this = visual bleed.**
**Every `isFixed` or constraint to TOP/BOTTOM = positioned outside scroll.**

### Step 3: Identify Visual Complexity Per Section

For EACH section in the semantic map, scan for properties that need special
handling (not just simple layout + text):

```
For each section, flag if it contains:
□ GRADIENTS — any non-solid fills? (linear, radial, angular, diamond?)
□ MASKS — any masked images? (circle crop, custom shape clip?)
□ SHADOWS — drop shadow or inner shadow? (affects depth perception)
□ BLUR — layer blur or backdrop blur? (glow effects, frosted glass?)
□ BLEND MODES — any non-PASS_THROUGH blend? (MULTIPLY, SCREEN, OVERLAY?)
□ NEGATIVE GAP — overlapping children? (stacked cards, overlapping badges?)
□ MIXED TEXT — any text with characterStyleOverrides? (bold words, colored spans?)
□ PER-SIDE BORDERS — any borders with different weights per side?
□ SCROLL — does this section scroll? Which axis? Nested within page scroll?
□ IMAGES — any image fills? What scale mode? Any filters applied?
□ ABSOLUTE CHILDREN — any pos:ABSOLUTE overlays? (badges, glow, gradients)
□ CUSTOM SHAPES — any vector paths that aren't standard rectangles/circles?
□ ROTATION — any rotated elements? (decorative angles, tilted icons)
□ WRAP — do flex items wrap to next line? Or single-line with scroll?
```

This inventory prevents surprises during Phase 3 building — you'll know
upfront which sections need Stack, ClipPath, RichText, gradient borders,
custom painters, or special blur handling.

### Step 4: Identify Dynamic vs Static Content

Mark each section as STATIC or DYNAMIC:
- **STATIC**: logos, labels, icons, navigation text, section headers
- **DYNAMIC**: user data, prices, lists from API, counts, percentages, timestamps

For each DYNAMIC section, note the data dependency:
```
Example:
- P&L value (₹11,453.87) → DYNAMIC (user portfolio API)
- Coin list (ZLQA, ECSH...) → DYNAMIC (market API, paginated)
- "Announcements" header → STATIC
- Contest rank (#23 / 3.2K) → DYNAMIC (contest API)
```

This informs Phase 5c (State & Data Layer Pass) — every DYNAMIC value becomes
a constructor parameter on the widget, backed by a data model.

### Step 4: Flag Ambiguity — ASK, Don't Guess

If ANY of the following is unclear, STOP and ask the user:
- "Is this a tab bar or a button group?"
- "Should this section scroll horizontally or wrap?"
- "Is this a bottom sheet or a card?"
- "What happens when this list has more items?"

**NEVER hallucinate or imagine behavior not visible in the design.**
**NEVER substitute one component type for another because it's easier to build.**

---

## Phase 3 — Build-Verify-Iterate (Per Component)

**BUILD BOTTOM-UP. Smallest leaves first, assemble upward, verify at every level.**

```
BUILDING ORDER (bottom-up — opposite of reading):

BUILD: Leaf widgets first (smallest, most atomic)
  └─ Verify each leaf against its chunk screenshot
THEN: Assemble leaves into parent frames
  └─ Verify parent against its chunk screenshot
THEN: Assemble parents into sections
  └─ Verify section against its section screenshot
THEN: Assemble sections into full screen
  └─ Verify full screen against full-screen screenshot
```

The key insight: **you READ top-down to get context, you BUILD bottom-up for
precision.** By the time you're assembling parents, the children are already
verified — errors don't compound upward.

### The 10K Token Rule

Each component you build must be **≤ 9.5K-10K tokens** of complexity.
This ensures you can hold the FULL spec + screenshot + code in context
simultaneously, with nothing dropped or approximated.

If a chunk feels too large:
1. Read its children list in the chunk spec
2. Build each child as a separate widget first
3. Verify each child individually
4. Then assemble the parent using the already-verified children

Example — a "Start Trading" section is too complex as one unit:
```
Start Trading (too big — ~25K tokens)
├─ CoinTabs widget (build first, ~5K tokens) ✅ verified
├─ ChartArea widget (build next, ~8K tokens) ✅ verified
├─ PriceInfo widget (build next, ~3K tokens) ✅ verified
└─ TradeButtons widget (build next, ~3K tokens) ✅ verified
→ Now assemble StartTradingSection from verified children (~4K tokens)
→ Verify assembled section against screenshot
```

### Step 1: Build Reusable Components First

For each entry in `reusables/`:
1. Read the reusable spec file — these are small, usually ≤ 5K tokens
2. Check codebase for an existing component that matches
3. If no match exists, build it following the framework reference file
4. **Verify** (see Step 4 below)

Reusables are built first because they're referenced by multiple chunks.
Building them first means they're verified and ready when parent chunks need them.

### Step 2: Build Each Leaf Chunk (numbered order)

For each leaf chunk in `chunks/` (the extractor numbers them in build order):

**2a — Read BOTH the spec AND the screenshot**
1. Read the chunk `.md` file — exact layout, typography, colors, children
2. Read the chunk screenshot — understand WHAT this component IS visually
3. Recall the semantic UI pattern from Phase 2.5 (you already know what this IS)
4. Recall the parent context from Phase 2 (you already know where this fits)

**2b — Check every style property** (non-negotiable)
Before writing code, mentally go through EVERY property in the spec:

**Layout & Sizing:**
- [ ] Layout direction: HORIZONTAL (Row) or VERTICAL (Column) or NONE (Stack)
- [ ] Width: FIXED (exact px) / FILL (Expanded, stretch to parent) / HUG (shrink-wrap)
- [ ] Height: FIXED / FILL / HUG — same rules
- [ ] Padding: all 4 sides exactly (top, right, bottom, left)
- [ ] Gap: item spacing (can be NEGATIVE for overlapping items — use Transform.translate)
- [ ] Alignment: main axis AND cross axis independently (SPACE_BETWEEN ≠ CENTER)
- [ ] Wrap: NO_WRAP (single line) vs WRAP (Wrap widget, items flow to next line)
- [ ] Grow/flex factor: `grow:1` = Expanded/Flexible in Flutter, `flex:1` in CSS
- [ ] Min/max width & height constraints (ConstrainedBox / min-width, max-width)
- [ ] Overflow: HORIZONTAL_SCROLLING / VERTICAL_SCROLLING / clip / visible
- [ ] Clips content: clip:true = clipBehavior: Clip.hardEdge (hides overflow)

**Positioning & Layering:**
- [ ] **Z-index / layering / stacking order** (see detailed guide below)
- [ ] Absolute positioning: pos:ABSOLUTE = Stack + Positioned, NOT in flex flow
- [ ] Absolute coordinates: exact x, y from spec for positioned elements
- [ ] Constraints: h=LEFT/RIGHT/CENTER/SCALE/STRETCH, v=TOP/BOTTOM/CENTER/SCALE/STRETCH
- [ ] isFixed: elements pinned to viewport, outside scroll container
- [ ] isMask/maskType: alpha/vector masks clip children to shape (ClipPath/ShaderMask)

**Visual Surface:**
- [ ] Fills: solid (with fill-level opacity), linear/radial/angular/diamond gradients
      (angle, stops, type ALL matter — angular/diamond need special handling)
- [ ] Fill vs node opacity: fill opacity affects only that fill; node opacity affects ALL children
- [ ] Border: per-side weights (top/right/bottom/left can differ), color, strokeAlign
      (INSIDE/CENTER/OUTSIDE — affects layout dimensions)
- [ ] Border radius: all 4 corners independently (topLeft ≠ topRight is valid)
- [ ] Corner smoothing: squircle vs circular arc (SmoothBorderRadius in Flutter)
- [ ] Stroke cap (BUTT/ROUND/SQUARE) and join (BEVEL/MITER/ROUND) for path strokes
- [ ] Stroke dash pattern: [dashLength, gapLength] for dashed/dotted lines
- [ ] Effects: drop shadow vs inner shadow (inset) — different visual meaning
      Each shadow has: x-offset, y-offset, blur, spread, color (all 5 matter)
- [ ] Blur effects: layer blur (blurs element) vs backdrop blur (blurs what's behind)
- [ ] Blend mode: PASS_THROUGH/MULTIPLY/SCREEN/OVERLAY (affects layer compositing)
- [ ] Rotation: exact degrees, affects layout flow and child rendering
- [ ] Image fills: scale mode (FILL/FIT/CROP/TILE), rotation, filters (brightness/saturation)

**Typography (every text node):**
- [ ] Font family, weight, size, italic
- [ ] Line height (as px value — convert to multiplier: lineHeightPx / fontSize)
- [ ] Letter spacing (can be negative for tight headers)
- [ ] Paragraph spacing (space between paragraphs, different from line height)
- [ ] Color (check spec, not assumption — grays are often subtly different)
- [ ] Text case transform: UPPER/LOWER/TITLE (use textTransform, not hardcoded text)
- [ ] Text decoration: underline, strikethrough, overline
- [ ] Horizontal alignment: LEFT/CENTER/RIGHT/JUSTIFY
- [ ] Vertical alignment: TOP/CENTER/BOTTOM within text frame
- [ ] Auto-resize: WIDTH_AND_HEIGHT (hug both) / HEIGHT (fixed width, grow height) /
      NONE (fixed both) — determines if text wraps, truncates, or overflows
- [ ] Truncation: maxLines + overflow: ellipsis (only if autoResize ≠ WIDTH_AND_HEIGHT)
- [ ] Mixed text styles (characterStyleOverrides): bold/colored/different-font spans
      within one text node — requires RichText/Text.rich, not single Text widget

**Z-Index / Layering / Stacking Order — critical for correct rendering:**

Figma layers elements top-to-bottom in the panel (last child renders on top).
Many designs rely on precise stacking:

- **`pos: ABSOLUTE` children**: these are positioned OVER their siblings. In the
  spec, look for `pos:ABSOLUTE` — these MUST use `Stack` + `Positioned` (Flutter),
  `position: absolute` (React), or equivalent. They are NOT part of the auto-layout
  flow. Common examples: status badges on cards, glow ellipses behind content,
  gradient overlay rectangles, floating price indicators, blur rectangles.
- **Child order = paint order**: in a `Stack`, the FIRST child in the spec is the
  bottom layer, the LAST child is the top layer. Match this order exactly.
- **Clip behavior**: `clip: true` on a parent means children that overflow are
  clipped. Without it, absolute children can bleed outside the parent bounds.
  Use `clipBehavior: Clip.hardEdge` (Flutter) or `overflow: hidden` (CSS).
- **Elevation / shadows**: shadows in the spec imply visual depth. Elements with
  shadows should appear to float above elements without shadows.
- **Blur effects behind content**: `effects: [blur(Xpx)]` on a rectangle means
  it's a backdrop blur or glow. These are often absolute-positioned with low
  opacity, creating depth behind the main content.
- **`isFixed` / fixed position**: elements marked `isFixed: true` or with
  `constraints: v=BOTTOM` on the root frame should be fixed (not scroll).
  Use `Positioned` within the scaffold, not inside `SingleChildScrollView`.

**Common layering patterns in Figma designs:**
```
Card with status badge:
  Stack [
    Card content (fills parent)          ← bottom layer
    Status badge (pos:ABSOLUTE, top:12)  ← floats on top
  ]

Section with glow:
  Stack [
    Glow ellipse (pos:ABSOLUTE, opacity:0.3, blur:31px)  ← behind
    Content column                                         ← on top
  ]

Gradient overlay:
  Stack [
    Background rectangle (pos:ABSOLUTE, gradient fill)    ← behind
    Foreground content                                    ← on top
  ]
```

**If ANY style property exists in the spec, it MUST be in the code.**
Missing a single `letterSpacing: 0.2` or `borderRadius: 8` makes it not match.

**2c — Build the component**
- Use exact values from spec — no rounding, no approximation
- Use actual SVG icons from `.figma-extract/assets/` — never Material Icons
- Map colors to project tokens — if no match, use the exact hex
- Follow the semantic pattern identified in Phase 2.5
- **Respect stacking order** — use Stack for absolute children, maintain paint order

### Step 3: Assemble Parents

For each assembly chunk:
1. Read assembly spec — direction, gap, padding, alignment, background
2. Compose already-built children in order
3. **Verify against parent screenshot** (Step 4)

### Step 4: Visual Verification (per component)

After building each component:

**4a — Capture the built component screenshot**

For Flutter, write a golden test that renders the widget in isolation:
```dart
testWidgets('WidgetName matches design', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: Scaffold(body: RepaintBoundary(child: WidgetName())),
  ));
  await expectLater(
    find.byType(WidgetName),
    matchesGoldenFile('goldens/widget_name.png'),
  );
});
```
Run: `flutter test --update-goldens test/goldens/widget_name_test.dart`

**4b — Compare using Claude Vision (primary comparator)**

Read BOTH images simultaneously:
1. Figma reference: `.figma-extract/screenshots/<chunk>.png` (pre-downloaded, consistent)
2. Built component: `test/goldens/widget_name.png` (captured from golden test)

**Why Claude Vision over pixel-diff tools:**
- Flutter and Figma use different renderers (Skia vs Figma engine). Font rasterization,
  anti-aliasing, and sub-pixel rendering ALWAYS differ. A pixel-perfect component will
  still show 3-5% pixel diff from rendering noise alone.
- Claude Vision understands semantic similarity: "same text, slightly different font hinting"
  is a MATCH, not a mismatch. Pixel-diff would flag it as 5% different.
- Claude Vision gives ACTIONABLE feedback: "padding-left is ~4px too wide" instead of
  just "5.2% pixels differ."

**Why pre-downloaded screenshots (not MCP `get_screenshot`):**
- Already on disk from extraction — instant access, no API calls
- Consistent rendering — same Figma server-side render for all chunks
- Batch-fetched (50 at a time) — fast and reliable
- If design was updated since extraction → re-run extractor, don't use stale screenshots

Compare visually, checking:
- Layout/spacing — padding, gap, alignment, width/height proportions
- Colors — background, text, borders, shadows
- Typography — font, weight, size, line height, letter spacing
- Elements — missing, extra, wrong order
- Shape — border radius, corners, shadows, opacity
- Semantic correctness — IS it the right component type?

**4c — Generate structured diff**

For every visual property, explicitly state MATCH or MISMATCH:

```
MATCH:    layout direction (horizontal) ✓
MATCH:    background color (#1B1E2D) ✓
MATCH:    font family (Manrope) ✓
MATCH:    font size (12px) ✓
MISMATCH: padding-left should be 12px, appears ~16px → fix to 12
MISMATCH: border-radius should be 8px, currently 0 → add borderRadius: 8
MISMATCH: text color should be #A0AEC0, currently #FFFFFF → fix color
MISSING:  letterSpacing: 0.2px not applied → add letterSpacing
MISSING:  shadow (0,2,8,0 #00000014) not applied → add BoxShadow
IGNORED:  font hinting difference (rendering noise, not a real mismatch)
```

**Important:** Font rendering differences between Flutter and Figma are EXPECTED
and should be marked IGNORED, not MISMATCH. Only flag actual style mismatches.

**4d — Fix and re-verify**

Apply specific fixes from the diff. Re-capture screenshot. Re-compare.

**Keep iterating until 90-95% pixel-to-pixel match (up to 5 iterations).**

Each iteration should fix specific mismatches from the structured diff:
- Iteration 1: layout + spacing corrections
- Iteration 2: typography + color corrections
- Iteration 3: border radius + shadow + opacity corrections
- Iteration 4: fine-tuning alignment, sub-pixel adjustments
- Iteration 5: final polish

If the formatted spec doesn't explain a mismatch, check `raw/*.json` for
the corresponding chunk — the raw JSON has every Figma property, nothing dropped.

If still below 90% after 5 iterations:
- Flag the specific remaining mismatches to the user
- Show both screenshots (Figma vs built)
- Ask: "These differences remain. Should I continue, or should we adjust the approach?"

**4e — Lock the component**

Only lock when the component reaches **90-95% visual match** against the Figma
screenshot. Keep iterating until it does (up to 5 times).

```
✅ PnlSection — verified (1 iteration, 95% match)
✅ QuickActions — verified (3 iterations, fixed padding + icon size + gap, 93% match)
⚠️ CandlestickChart — 88% match after 5 iterations (chart rendering differs from Figma rasterization)
⏳ WatchlistTabs — building...
```

### Step 5: Final Screen Assembly & Verification

1. Compose all sections into the full screen
2. Capture full-screen screenshot
3. Compare against `screenshots/full-screen.png`
4. Check: does the FLOW between sections match? Spacing between sections? Dividers?
5. Report final status with any remaining mismatches

---

## Phase 3.5 — Full-Page Holistic Comparison & Iteration (non-negotiable)

**After ALL per-component builds are done, BEFORE moving to production hardening,
do a full-page holistic visual comparison and fix EVERY visual deviation — whether
it's spacing, component-level rendering, missing elements, wrong colors, incorrect
shapes, bad icon usage, or anything else that doesn't match the Figma design.**

This is NOT just a spacing check. This is a comprehensive visual audit of the
entire built page against the Figma screenshot.

### Why This Phase Exists

Per-component verification catches ~70% of issues. The remaining ~30% only
become visible when the full page is assembled:

- **Inter-section spacing**: gaps between sections drift from spec
- **Missing structural elements**: tab bars, dividers, decorative layers,
  gradient overlays, glow effects that aren't "components" but are in the tree
- **Component rendering at page context**: a component verified in isolation
  may look different when surrounded by its actual siblings (colors blend wrong,
  borders overlap, text clips differently)
- **Icon/asset mismatches**: Material Icons used where SVGs were needed, wrong
  icon colors, missing coin logos, placeholder images not replaced
- **Typography drift**: text styles that were close enough per-component but
  visibly wrong when seen next to correct text on the same page
- **Shape/decoration errors**: missing border radius, wrong gradient angles,
  absent shadows, incorrect opacity, missing custom painted shapes
- **State/interaction errors**: wrong selected state on tabs, incorrect active
  indicator placement, missing hover/press states
- **Scroll/flow issues**: sections that looked fine in isolation don't flow
  correctly when composed — content overlaps fixed elements, wrong scroll axis

### Step 1: Read the Assembly Specs

Read the **root assembly chunk** (usually the last numbered chunk):
- **Direction**: VERTICAL for most screens
- **Gap**: gap between direct children = section-to-section spacing
- **Padding**: outer padding of the whole page
- **Child Chunks**: the exact order sections should appear

Also read **parent assembly chunks** (intermediate containers) — their `gap`
values define inter-section spacing within groups.

**Common miss**: assembly says `gap: 24px` but code uses mixed values
(12px, 16px, 24px). Standardize to match.

### Step 2: Full-Screen Visual Comparison (COMPREHENSIVE)

Read `screenshots/full-screen.png` alongside the individual section screenshots.
Go through the page **top to bottom**, examining EVERY visual aspect.

**For EACH component within each section, re-read both the chunk screenshot and
the built output, checking ALL of the following:**

```
STRUCTURAL CHECKS (page-level):
□ Section count matches — no missing or extra sections
□ Section order matches the assembly child chunk order
□ Gap between every section pair matches assembly spec exactly
□ No missing structural elements (tab bars, dividers, separators, overlays)
□ Fixed elements (header, bottom nav) are fixed, not scrolling
□ Overall page background color correct
□ Scroll content doesn't overflow under fixed elements

COMPONENT-LEVEL CHECKS (per section, re-examine against Figma screenshot):
□ Background colors/gradients match exactly (type: linear/radial/angular, angle, stops)
□ Fill opacity vs node opacity — correct level applied
□ Border radius on all containers matches spec (all 4 corners independently)
□ Per-side border weights correct (top/right/bottom/left can differ)
□ Stroke align correct (INSIDE/CENTER/OUTSIDE affects box dimensions)
□ Shadows present: drop shadow AND/OR inner shadow, with correct type
□ Shadow properties: x-offset, y-offset, blur, spread, color (all 5)
□ Blur effects: layer blur vs backdrop blur, correct radius
□ Blend modes applied where non-default (MULTIPLY/SCREEN/OVERLAY)
□ Opacity values correct (0.3 glow, 0.5 grid lines, etc.)
□ Masks applied: circle crop, custom shape clip (ClipPath/ClipOval)
□ Corner smoothing (squircle) where specified
□ Dashed/dotted borders with correct dash pattern
□ Rotation angle correct on rotated elements

SIZING & FLEX CHECKS:
□ Width/height sizing modes correct (FIXED/FILL/HUG per component)
□ Grow/flex factor applied where spec says grow:1 (Expanded in Flutter)
□ Min/max size constraints applied
□ Negative gap handled (overlapping items via Transform or Stack)
□ Wrap behavior correct (single-line scroll vs multi-line wrap)
□ Layout direction correct per container (Row vs Column vs Stack)

ICON & ASSET CHECKS:
□ Every icon uses extracted SVG from assets/, NOT Material Icons or placeholders
□ Coin logos correct per-coin (BTC = bitcoin SVG, others = their specific logo)
□ Image fills use actual exported PNGs, not colored rectangles
□ Image scale mode correct (FILL/FIT/CROP — BoxFit.cover vs contain vs fill)
□ Image filters applied if specified (brightness, saturation)
□ Icon colors match spec (not default white when spec says #718096, etc.)
□ Icon sizes match spec exactly

TYPOGRAPHY CHECKS (scan full page for visible text mismatches):
□ Font family correct (Manrope vs Roboto vs Rubik)
□ Font weights visually distinguishable where spec differs (500 vs 600 vs 700)
□ Text colors match — especially grays (#A0AEC0 vs #718096 vs #4A5568)
□ Letter spacing applied where specified (0.36px, 0.42px, including negative)
□ Line height matches (px value / fontSize = multiplier)
□ Text case transforms applied (UPPER/LOWER via textTransform, not hardcoded)
□ Text decoration correct (underline, strikethrough where specified)
□ Vertical text alignment matches (TOP/CENTER/BOTTOM within frame)
□ Auto-resize mode correct (hug vs fixed-width-grow-height vs fixed-both)
□ Text truncation/maxLines applied on dynamic text
□ Mixed text styles rendered with RichText (bold words, colored spans)

LAYOUT & SPACING CHECKS:
□ Horizontal padding matches (usually 16px from screen edge)
□ Section header alignment (left text, right action links)
□ Internal component gaps match per-component spec
□ Scroll direction correct (horizontal for card lists, vertical for main)
□ Selected/active state indicators positioned correctly
□ Tab underlines, pills, badges in correct position

SHAPE & DECORATION CHECKS:
□ Custom shapes rendered (angled nav selectors, pill badges, gradient borders)
□ Gradient borders present where spec shows them (e.g., gold gradient border)
□ Divider lines present with correct color and position
□ Card border styles correct (solid vs gradient vs none)

Z-INDEX / LAYERING / STACKING CHECKS:
□ Absolute-positioned elements render ON TOP of their siblings (badges, overlays)
□ Glow/blur ellipses render BEHIND content, not on top or missing
□ Status badges on cards overlap the card edge correctly (not clipped or misplaced)
□ Gradient overlay rectangles behind content sections are present and layered correctly
□ Stack child order matches Figma layer order (first child = bottom, last = top)
□ Clip behavior correct — overflow hidden where spec says clip:true
□ Fixed elements (header, bottom nav) layer above scrollable content
□ Floating indicators (price badges, dot markers) positioned over their context
□ Cards with both absolute children AND auto-layout children render correctly
□ Opacity on background layers doesn't bleed through incorrectly
```

### Step 3: Build the Comprehensive Diff

Create a section-by-section diff covering ALL issue types. Be specific:

```
SECTION: Header (mWeb_Header)
MATCH:    height 40px, bg #000000 ✓
MATCH:    chevron-left.svg at 24x24 ✓
MATCH:    CS PRO logo mini ✓
COMPONENT: hamburger icon — using Icons.menu, should use extracted SVG → fix
COMPONENT: wallet icon size should be 16x16 → verify

GAP: Header → P&L = 0px (flush) ✓

SECTION: P&L (Frame 2147225832)
MATCH:    gradient 180deg #12131900 → #1B1E2D ✓
MATCH:    amount text Manrope 700 24px #26D08D ✓
SPACING:  outer padding should be 0, was 20px horizontal → fix
COMPONENT: percentage badge radius should be 16px → verify

GAP: P&L → Explore Tab = 0px ✓
MISSING:  Explore/Strategies tab bar (Frame 2147225831) not built → ADD
          — has angled edge shape, "Explore" selected, "Strategies" with "3 New" badge

GAP: Explore Tab → Quick Actions = per spec
SECTION: Quick Actions (Frame 2147225699)
MATCH:    horizontal scroll, 8px gap ✓
COMPONENT: first chip "Telegram Connect" should have gradient border
           (linear-gradient 13deg #7b653233 → #7B6532 → #7b65324d) → fix
ICON:     all chips use generic icon.svg, should use per-action icons
          (Telegram vector, scalper lines, Smart Invest diamond, etc.) → flag TODO

...continue for EVERY section...

SECTION: Bottom Nav (Nav Items)
COMPONENT: "Futures" selector missing angled polygon background shape → fix
ICON:     nav icons using Material Icons, should use custom vectors → fix if SVGs available
COMPONENT: gold tab indicator position under "Home" → verify alignment
```

### Step 4: Fix ALL Mismatches

Fix in this priority order — **all types, not just spacing**:

1. **Missing elements** — add structural components that exist in Figma but
   are absent: tab bars, dividers, decorative overlays, gradient layers
2. **Component rendering** — fix backgrounds, borders, shadows, shapes,
   gradients, opacity, border-radius on EVERY container that doesn't match
3. **Icons & assets** — replace any Material Icons or placeholders with
   actual extracted SVGs. Fix icon colors and sizes
4. **Typography** — fix font family/weight/size/color/letterSpacing mismatches
5. **Spacing & layout** — standardize section gaps, fix padding, alignment
6. **Polish** — selected states, active indicators, glow effects, blur effects

**For each fix, re-read the relevant chunk spec to get the EXACT values.**
Do not guess from the screenshot — the spec is the source of truth.

### Step 5: Re-verify Full Page (iterate)

After applying all fixes:
1. Re-capture full-screen screenshot (golden test or device screenshot)
2. Re-compare against `screenshots/full-screen.png`
3. If new mismatches are visible, go back to Step 3

**Max 3 full-page iterations.** Each iteration should have FEWER issues.
If issues remain after 3 iterations:
- List every remaining mismatch with specific details
- Show both screenshots (Figma vs built)
- Ask the user: "These differences remain. Should I keep iterating,
  or are these acceptable?"

### What This Phase Should Catch (examples from real builds)

These are real issues found only during page-level comparison that
per-component verification missed:

| Issue type | Example |
|-----------|---------|
| Missing element | Explore/Strategies tab bar between P&L and quick actions |
| Wrong spacing | 12px gap used instead of 24px between Announcements and Start Trading |
| Component shape | Bottom nav "Futures" selector missing angled polygon cutout |
| Icon mismatch | Watchlist tab icons missing — only star was rendered, not gainers/losers arrows |
| Coin logo | ETH/SOL tabs showing placeholder instead of actual coin logo images |
| Tab styling | Selected coin tab using green fill instead of dark fill with border |
| Padding drift | P&L section had extra 20px horizontal margin not in spec |
| Gradient border | First quick action chip missing gold gradient border |
| Badge missing | "3 New" red badge on Strategies tab not rendered |
| Decoration | Green glow ellipse behind announcement card positioned wrong |
| Z-index/layering | Status badge (ATTENDING) should overlap card edge but was clipped by parent |
| Z-index/layering | Glow ellipse rendered ON TOP of text instead of behind it (wrong Stack order) |
| Z-index/layering | Gradient overlay rectangle (pos:ABSOLUTE) missing entirely — content has no depth |
| Z-index/layering | Floating price indicator on chart not positioned over candles (missing Stack) |
| Z-index/layering | Card clip:true was missing — absolute badge bled outside card bounds |

---

## Phase 4 — Rules & Guardrails

### Asset Rule (absolute, no exceptions)
- NEVER write inline SVG, Icon() widgets, or hand-code any vector
- NEVER use Material Icons, CupertinoIcons, or framework placeholder icons
- Every icon/illustration/image = use from `.figma-extract/assets/` or project assets
- If an icon is missing from `.figma-extract/assets/`, flag it — do NOT substitute
- Render with the framework's image component (SvgPicture.asset, Image.asset, etc.)
- Fill images (backgrounds, photos) are in `assets/images/` as PNG

### Never Hallucinate Rule (absolute, no exceptions)
- NEVER guess what a component should look like
- NEVER substitute a UI pattern for a different one (tabs→buttons, list→column)
- NEVER invent spacing, colors, or typography not in the spec
- NEVER assume behavior not visible in the design
- If ANYTHING is unclear → ASK the user before proceeding
- If an asset is missing → FLAG it, don't substitute
- If a spec seems wrong → SHOW the screenshot to the user and ask

### Style Completeness Rule
- Every style property in the spec MUST appear in the code
- After writing each component, re-read the spec and verify every property
- Check: padding? gap? radius? border? shadow? opacity? rotation? constraints?
- Check text: font? weight? size? lineHeight? letterSpacing? color? case? align?
- Missing ANY property = the component will not match the design

### The 95% Fidelity Checklist

Run through this for every component before marking it done:

**Spacing & Layout**
- [ ] Layout direction correct (HORIZONTAL=Row, VERTICAL=Column, NONE=Stack)
- [ ] Every padding matches spec exactly — all 4 sides (no rounding)
- [ ] Gap matches exactly (including NEGATIVE gap for overlapping items)
- [ ] Container sizing modes correct: FIXED (exact px) / FILL (Expanded) / HUG (shrink)
- [ ] Main axis + cross axis alignment BOTH match independently
- [ ] Grow/flex factor applied where spec says grow:1
- [ ] Wrap behavior correct (NO_WRAP=single line, WRAP=multi-line Wrap widget)
- [ ] Absolute positioned elements at correct x,y coordinates
- [ ] Min/max width/height constraints applied where specified
- [ ] Clips content / overflow behavior matches (clip:true = Clip.hardEdge)
- [ ] Scroll direction correct (HORIZONTAL_SCROLLING / VERTICAL_SCROLLING)
- [ ] Nested scroll works (horizontal list inside vertical page scroll)

**Typography (every text node)**
- [ ] Font family matches exactly
- [ ] Font weight matches exactly
- [ ] Font size matches exactly
- [ ] Font style: italic applied where specified
- [ ] Line height matches (as multiplier: lineHeightPx / fontSize)
- [ ] Letter spacing applied (including negative for tight headers)
- [ ] Paragraph spacing applied for multi-paragraph text
- [ ] Text color matches (check spec — grays differ subtly: #A0AEC0 ≠ #718096)
- [ ] Text case transform via textTransform (UPPER/LOWER), not hardcoded text
- [ ] Text decoration: underline, strikethrough, overline where specified
- [ ] Horizontal text alignment matches (LEFT/CENTER/RIGHT/JUSTIFY)
- [ ] Vertical text alignment matches (TOP/CENTER/BOTTOM within frame)
- [ ] Auto-resize mode: WIDTH_AND_HEIGHT (hug) / HEIGHT (fixed width) / NONE (fixed)
- [ ] Truncation / maxLines applied where auto-resize ≠ WIDTH_AND_HEIGHT
- [ ] Mixed styles: RichText/Text.rich for characterStyleOverrides (bold/colored spans)

**Color & Surface**
- [ ] All fills match — solid colors with correct fill-level opacity
- [ ] Gradient type correct: linear / radial / angular / diamond
- [ ] Gradient angle, stops, and positions match exactly
- [ ] Fill opacity vs node opacity: correct level (fill-only vs all children)
- [ ] Border weight matches — per-side if spec has individual weights
- [ ] Border color, strokeAlign (INSIDE/CENTER/OUTSIDE) correct
- [ ] Border radius matches — all 4 corners independently
- [ ] Corner smoothing (squircle) applied where specified
- [ ] Stroke cap (BUTT/ROUND/SQUARE) and join (BEVEL/MITER/ROUND) correct
- [ ] Dashed/dotted borders with correct dash pattern
- [ ] Drop shadow: x-offset, y-offset, blur, spread, color (all 5)
- [ ] Inner shadow (inset): separate from drop shadow, different visual effect
- [ ] Blur effects: layer blur vs backdrop blur, correct radius
- [ ] Blend mode applied where non-default (MULTIPLY/SCREEN/OVERLAY)
- [ ] Rotation angle matches exactly

**Masks & Clipping**
- [ ] isMask elements create correct clip shape (ClipOval, ClipPath, ClipRRect)
- [ ] Masked images render in shape (circle, custom path), not as rectangles
- [ ] Custom vector shapes rendered via SVG or CustomPaint (not approximated)

**Semantic Correctness**
- [ ] Component type matches design intent (tab bar IS a tab bar)
- [ ] Interactive patterns correct (scrollable where needed)
- [ ] List items use builder pattern, not hardcoded children
- [ ] Navigation patterns use proper framework widgets

**Z-Index / Layering / Stacking**
- [ ] Absolute-positioned children use Stack + Positioned, not in flex flow
- [ ] Stack child order matches Figma paint order (first = bottom, last = top)
- [ ] Glow/blur elements layered behind content, not on top
- [ ] Status badges overlay card edges correctly
- [ ] clip:true containers use clipBehavior, preventing overflow bleed
- [ ] Fixed elements (header/nav) stay above scroll content

**Assets & Images**
- [ ] All icons from `.figma-extract/assets/` at exact size
- [ ] No icon is hand-coded, substituted, or replaced with Material Icons
- [ ] Image fills use correct scale mode (FILL=cover, FIT=contain, CROP=clip)
- [ ] Image filters applied if specified (brightness, saturation adjustments)
- [ ] Image rotation applied if specified

---

## Error Handling & Recovery

### When extraction fails
1. Check: Is `$FIGMA_ACCESS_TOKEN` set and valid?
2. Check: Is the file key / node ID correct?
3. Check: Does the user have a Full/Dev seat (not View/Collab)?
4. **Tell the user** exactly what failed and why
5. Suggest: "Try re-running with `--token=<new-token>`" or "Check your Figma permissions"

### When a component fails to build
1. Do NOT silently skip or substitute
2. **Tell the user**: "I couldn't build [component] because [reason]"
3. Show the screenshot and spec that's causing the issue
4. Ask: "Would you like me to try a different approach, or should we skip this?"

### When verification fails after 5 iterations
1. List the specific remaining mismatches with percentages
2. Show both screenshots (Figma vs built)
3. Check `raw/*.json` — maybe the formatted spec missed a property
4. Ask: "After 5 iterations, these differences remain at ~X% match. Should I keep going, try a different approach, or do you want to fix manually?"

### When an asset is missing
1. Do NOT use a Material Icon or placeholder
2. **Tell the user**: "Icon [name] was not exported. It may need manual export from Figma."
3. Leave a `// TODO: missing icon - [name]` placeholder
4. Continue building the rest

### When the spec is ambiguous or contradicts the screenshot
1. Show the user both the spec data and the screenshot
2. Ask: "The spec says [X] but the screenshot shows [Y]. Which should I follow?"
3. Wait for answer — do not proceed on assumption

### When the skill encounters an unexpected error
1. Do NOT get stuck in a loop
2. Capture the error message
3. **Tell the user**: "I hit an error: [error]. Here's what I was trying to do: [context]"
4. Suggest alternatives: "We could try [A], [B], or [C]. What would you prefer?"
5. If completely blocked, provide manual steps the user can take

---

## Phase 5 — Production Hardening (per screen)

Figma is the VISUAL spec. Production code also needs behavioral, responsive,
accessible, and data-ready code. After visual fidelity is achieved, run this pass.

### 5a — Responsive Layout Pass

Figma designs are usually at 375px (1x iPhone). Production code must work everywhere.
- Replace hardcoded widths with `Expanded`, `Flexible`, `double.infinity`, or `FractionallySizedBox`
- Keep hardcoded values ONLY for: icon sizes, padding, gap, border radius, font sizes
- Wrap screens with `SafeArea` (or verify `Scaffold` handles it)
- Set `SystemUiOverlayStyle` to match design header background (light/dark icons)
- For content that scrolls: verify it doesn't overflow at 320px (iPhone SE) width
- Add `resizeToAvoidBottomInset` for screens with input fields
- Use `EdgeInsetsDirectional` instead of `EdgeInsets` for RTL support

### 5b — Accessibility Pass

Every screen must pass basic accessibility requirements:
- Every `GestureDetector`/`InkWell` tap target >= 48x48 logical pixels
- Every icon has a `semanticLabel` (or wrapped in `ExcludeSemantics` if decorative)
- Every image has a `semanticLabel`
- Use `InkWell` (not `GestureDetector`) for tap feedback on interactive elements
- `MergeSemantics` for compound interactive widgets (icon + text = one tap target)
- Text handles `MediaQuery.textScaleFactorOf(context)` up to 1.5x without overflow
- Focus order is logical for screen reader traversal

### 5c — State & Data Layer Pass

Convert static mock data into production-ready architecture:
- **Identify dynamic data**: which values come from API? (prices, user data, lists, counts)
- **Generate data models**: for each data shape visible in design (e.g., `CoinListItem`)
- **Parameterize widgets**: accept data via constructor, not hardcoded strings
- **Generate repository stubs**: `abstract class XRepository { Future<List<X>> getAll(); }`
- **Add loading/error/empty states**:
  - Loading: skeleton shimmer or placeholder (even if not in Figma)
  - Error: retry button + error message
  - Empty: "No items" state for lists
- **All visible text**: accept via constructor parameter (for future i18n)
- Mark all static strings with `// TODO: localize` if project uses localization

### 5d — Navigation Wiring (multi-screen only)

If multiple screens are extracted:
- Map navigation graph: which screen leads to which?
- Register routes (GoRouter / Navigator for Flutter, Next.js App Router, React Navigation)
- Wire bottom navigation bar with proper index state + tab persistence
- Add `Hero` tags for elements shared between screens
- Set up deep link configuration if applicable
- Handle back navigation correctly per platform

### 5e — Edge Case Hardening

- Every `Text` with dynamic data: set `maxLines` + `overflow: TextOverflow.ellipsis`
- Every list: handle 0 items (empty state), 1 item, many items
- Every network image: add `errorWidget` and `placeholder`
- Every tappable element: consider disabled state
- Verify no overflow at extreme text lengths (2x English length for German)

### 5f — Theme Integration

- Wire colors through `ThemeData` / `ColorScheme` (not static `AppColors` class)
- Access colors via `Theme.of(context)` in widgets
- If Figma has dark + light variants: generate both themes
- If only one variant: still wire through `ThemeData` for future theming
- Generate `ThemeExtension` for custom tokens beyond Material's `ColorScheme`

### 5g — Performance Review

- Widget tree depth: flatten if >15 levels nested
- `Column` with >5 homogeneous children → `ListView.builder`
- All `const` constructors where possible
- `RepaintBoundary` around scroll-independent expensive sections
- Network images: `CachedNetworkImage` with appropriate cache dimensions
- No unnecessary rebuilds: avoid `setState` in assembled screens

---

## Phase 6 — Checkpoint Before Next Screen

After each screen:
1. List all files created/modified
2. List all data models and repository stubs generated
3. Call out any deviations from the design
4. Call out any production concerns flagged (missing states, accessibility gaps)
5. **Pause. Wait for user to confirm** before starting the next screen

---

## Figma MCP Fallback Reference

Only use these if the REST API extractor is unavailable:

| Goal | Tool |
|------|------|
| Get design context (small nodes only) | `get_design_context(fileKey, nodeId)` |
| Get screenshot | `get_screenshot(fileKey, nodeId)` |
| Get metadata | `get_metadata(fileKey, nodeId)` |
