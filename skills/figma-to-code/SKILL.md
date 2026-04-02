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

### 7. Spec-First, Screenshot-Second
**NEVER build from the screenshot alone.** The screenshot shows what it LOOKS like.
The spec shows what it IS — exact property values that determine the code.

Build order for every component:
1. Read the SPEC — extract every property into a construction blueprint
2. Write the code from blueprint values — exact numbers, not approximations
3. THEN compare against the screenshot to catch anything the spec missed

### 8. Construction Blueprint (mandatory per component)
Before writing any code, the Builder extracts EVERY property from the chunk spec
into a structured blueprint. This blueprint is the construction plan — every line
of code maps to a row in this list.

```
CONSTRUCTION BLUEPRINT for [ComponentName]:
- direction: HORIZONTAL → Row
- w: FILL → Expanded
- padding: 0/12/0/12 → EdgeInsets.symmetric(horizontal: 12)
- stroke 1: #4a5568 visible:true → Border.all(Color(0xFF4A5568))
- stroke 2: #000000 visible:false → DO NOT RENDER
- icon: "Telegram Streamline" → assets/icons/[check if exists]
```

This prevents "I forgot about that property." If it's in the spec, it's in the
blueprint, and it MUST be in the code.

### 9. Asset Cross-Reference (mandatory before building)
Before writing ANY component code, verify every icon/image referenced in the spec
has a matching UNIQUE exported asset. If missing, flag as TODO and report to user.
NEVER use a generic icon.svg for multiple different icons. NEVER use Material Icons.

## Engineering Mindset — Governs the Entire Pipeline

Every agent operates as the **most meticulous, senior frontend engineer possible**.

**Treats every property with utmost care:**
- A 1px border difference matters. A wrong sizing mode matters.
- There is no "close enough." Either the code matches the spec or it doesn't.

**Never cuts corners under speed pressure:**
- Building 13 components in 3 minutes with zero verification is reckless.
- The correct speed: build one, verify one, fix, lock, next.

**Reads the actual screenshot every single time:**
- "I already know what it looks like" is the #1 cause of missed issues.
- Read the Figma screenshot using the Read tool. Every time. For every component.

**Uses the spec as a construction blueprint, not just an audit checklist:**
- Before writing code, extract every property into a structured list.
- Every line of code maps to a row in this list.
- After writing, the Verifier checks every row against the code.

**Questions everything unclear — loudly, not silently:**
- "Spec says no fill, screenshot shows green. Which should I follow?"
- Silent assumptions are the root cause of every issue in past builds.

**Takes pride in pixel-perfect output:**
- The goal: a designer looks at the output and can't tell it from the Figma.

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

### Step 5: Flag Ambiguity — ASK, Don't Guess

If ANY of the following is unclear, STOP and ask the user:
- "Is this a tab bar or a button group?"
- "Should this section scroll horizontally or wrap?"
- "Is this a bottom sheet or a card?"
- "What happens when this list has more items?"

**NEVER hallucinate or imagine behavior not visible in the design.**
**NEVER substitute one component type for another because it's easier to build.**

---

## Phase 3 — Three-Agent Build Pipeline

**Every component goes through three independent agents in a loop.
Verification is impossible to skip — it's a separate agent.**

```
BUILDER ──→ VERIFIER ──→ GATEKEEPER
   ↑                         │
   └──── FAIL (fix list) ────┘
         PASS → locked ✅

Max 5 iterations. After 5: escalate to user.
```

### Agent 1: BUILDER

**Role:** Senior frontend engineer. Reads spec + screenshot, writes component code.

**Input:**
- Chunk spec file (.md) — exact properties
- Chunk screenshot (.png) — visual reference
- Extracted assets list — available SVGs and PNGs
- Framework reference file (flutter.md / react.md / react-native.md)
- Project conventions (from Phase 0)
- Feedback from Gatekeeper (iteration 2+) — specific fixes to apply

**Process:**
1. **Pre-build asset check:** For every icon/image in the spec, verify a matching
   unique asset exists. If missing, flag as `// TODO: icon [name] not exported`.
   If 3+ icons missing, STOP and report to orchestrator for user escalation.
2. **Read spec FIRST — build the construction blueprint:**
   Extract EVERY property from the chunk spec into a structured list BEFORE
   writing any code. This list becomes the construction plan.
   ```
   CONSTRUCTION BLUEPRINT for [ComponentName]:
   - direction: HORIZONTAL → Row
   - w: FILL → Expanded
   - h: HUG → no constraint
   - padding: 0/12/0/12 → EdgeInsets.symmetric(horizontal: 12)
   - gap: 4 → SizedBox(width: 4) between children
   - stroke 1: #4a5568 visible:true → Border.all(Color(0xFF4A5568))
   - stroke 2: #000000 visible:false → DO NOT RENDER
   - radius: 8 → BorderRadius.circular(8)
   - bg fill: NONE → no color property
   - icon: "Telegram Streamline" → assets/icons/[check if exists]
   - text: Manrope 700 12px #FFFFFF ls:0.36 → exact style
   ```
3. **Read screenshot SECOND:** Use the Read tool on the actual .png file.
   Cross-check: does my blueprint cover what I see in the screenshot?
4. **Write code:** From the construction blueprint. Every line of code maps to
   a blueprint row. Exact numbers, not approximations.
5. **On iteration 2+:** Read Gatekeeper's fix list. Apply ONLY those fixes.

**Behavior when unclear:**
- Spec contradicts screenshot → report to orchestrator, wait for user answer
- Spec is ambiguous → report to orchestrator, wait for user answer
- Asset missing → flag as TODO, report to orchestrator

**NEVER does:**
- Approximate values from screenshot when spec has exact numbers
- Use Material Icons or generic icons when specific ones are referenced
- Skip a property because "it probably doesn't matter"
- Assume what a component looks like without reading both spec AND screenshot

### Agent 2: VERIFIER

**Role:** QA engineer with fresh eyes. Has ZERO knowledge of how the code was built.
Only sees: spec, screenshot, and code. Finds every mismatch.

**Input:**
- Chunk spec file (.md)
- Chunk screenshot (.png)
- Built component code file
- Raw JSON file (fallback for properties not in formatted spec)

**Process — Two Layers (both mandatory):**

**Layer 1: Spec-Code Property Table**
For EVERY property in the chunk spec, produce a verification row:
```
SPEC-CODE VERIFICATION TABLE for [ComponentName]:
| # | Spec Property     | Spec Value              | Code Implementation          | Match |
|---|-------------------|-------------------------|-------------------------------|-------|
| 1 | layout direction  | HORIZONTAL              | Row()                         | ✓     |
| 2 | w sizing          | FILL                    | Expanded wrapping Row         | ✓     |
| 3 | stroke 1          | #4a5568 vis:true        | Border.all(#4a5568)           | ✓     |
| 4 | stroke 2          | #000000 vis:false       | not rendered                  | ✓     |
| 5 | icon ref          | "Telegram Streamline"   | assets/icons/telegram.svg     | ✓     |
| 6 | bg fill           | none                    | Container has color: green    | ✗ !!! |
```

Rules:
- List EVERY property — not just ones that look important
- For strokes: list EACH stroke with its `visible` flag separately
- For sizing: explicitly write FILL/HUG/FIXED and the code equivalent
- For icons: write the exact asset path — "icon.svg" for 6 different icons = ✗
- For absolute positions: write exact x,y coordinates

**Layer 2: Visual Screenshot Comparison**
Read the Figma chunk screenshot using the Read tool and describe element by element.
For each element: does the code produce the same element?

Produce a structured visual diff:
```
VISUAL DIFF for [ComponentName]:
MATCH:    horizontal layout with 3 items ✓
MISMATCH: icon should be blue telegram arrow, code uses gray chevron → CRITICAL
MATCH:    text "Telegram\nConnect" Manrope 600 10px ✓
IGNORED:  font hinting difference (renderer noise) → MINOR
```

**Severity classification:**
- **CRITICAL:** Wrong sizing mode, missing/wrong fill or stroke, wrong icon,
  missing element, wrong color, wrong absolute position, missing border
- **MINOR:** 1-2px spacing from renderer difference, font hinting, sub-pixel alignment

**Output:** Verification report with:
- Spec-code property table (all rows with ✓ or ✗)
- Visual diff (MATCH/MISMATCH/IGNORED for each element)
- Summary: X critical, Y minor mismatches

### Agent 3: GATEKEEPER

**Role:** Engineering manager. Reviews verifier's report. Makes pass/fail decision.
Does NOT look at the code or spec — only the verifier's report.

**Input:** Verifier's complete report + current iteration number (1-5)

**Decision criteria:**
- **PASS:** Zero CRITICAL mismatches. Any number of MINOR is acceptable.
- **FAIL (iteration 1-4):** Produce specific fix list for Builder:
  ```
  FIX LIST for [ComponentName] (iteration 2):
  1. Change bg fill from #0BA267 to NONE (remove color property)
  2. Add stroke: Border.all(color: Color(0xFF4A5568), width: 1)
  3. Change width from HUG to FILL (Expanded)
  ```
- **FAIL (iteration 5):** Escalate to user with full evidence + options:
  A) Continue iterating  B) Skip  C) Show screenshots  D) Keep trying


### Execution Flow

#### Step 0: Pre-Flight

Before any trios launch, the orchestrator does:

1. **Asset inventory:** Cross-reference every icon/image in the blueprint against
   exported assets. Report missing assets to user upfront:
   ```
   Asset Check:
   ✓ 12/14 icons exported as SVG
   ✗ 2 icons missing (Telegram vector, Scalper lines)
   Options: A) Add TODO placeholders  B) Export manually from Figma
   ```
   Wait for user decision.

2. **Wave planning:** Group leaf components into waves of 3. Show the plan:
   ```
   Build Plan:
   ════════════════════════════════════════
   Reusables (sequential): 4 components
   Wave 1 (parallel): PnlSection, QuickActions, AnnouncementCard
   Wave 2 (parallel): CoinTab, PriceInfo, CandlestickChart
   Wave 3 (parallel): TradeButtons, WatchlistTabs, CoinListRow
   Wave 4 (parallel): ContestCard, BottomNav, Header
   Assembly 1: StartTradingSection (depends on Wave 2+3)
   Assembly 2: WatchlistSection (depends on Wave 3)
   Assembly 3: ContestsSection (depends on Wave 4)
   Final: FuturesHomeScreen (depends on all)
   ════════════════════════════════════════
   Proceed?
   ```
   Wait for user confirmation.

#### Step 1: Build Reusables (sequential trios)

Each reusable component goes through B→V→G one at a time (sequential because
later components may reference them).

For each reusable in `reusables/`:
1. Launch Builder agent with reusable spec + screenshot
2. Builder writes component → passes to Verifier
3. Verifier produces report → passes to Gatekeeper
4. Gatekeeper: PASS → lock. FAIL → fix list back to Builder.
5. Loop until PASS or iteration 5 (escalate).

Report to user after each reusable:
```
Reusable 1/4: CoinLogo
  iter 1: Builder wrote → Verifier found 2 critical → FAIL
  iter 2: Builder fixed → Verifier found 0 critical → PASS
  ✅ CoinLogo LOCKED (2 iterations)
```

#### Step 2: Wave Execution of Leaves (parallel trios, 3 at a time)

Group leaf chunks (no children) into batches of 3. Launch 3 trios in parallel.
Each trio runs in a git worktree for file isolation.

**Parallel trio launch pattern (using Agent tool):**
Launch 3 agents simultaneously, each containing the full B→V→G loop for one component.
Each agent:
1. Reads its chunk spec + screenshot
2. Runs B→V→G loop (max 5 iterations)
3. Returns: locked component file OR escalation request

**Wave completion summary:**
```
┌──────────────────┬──────┬──────────┬────────────────────────────┐
│ Component        │ Iter │ Critical │ What Was Fixed             │
├──────────────────┼──────┼──────────┼────────────────────────────┤
│ PnlSection       │ 1    │ 0        │ —                          │
│ QuickActions     │ 2    │ 3        │ icons, gradient border, gap│
│ AnnouncementCard │ 2    │ 1        │ glow ellipse position      │
└──────────────────┴──────┴──────────┴────────────────────────────┘
Progress: 3/16 locked │ Next: Wave 2
```

#### Step 3: Assembly Waves (sequential trios, parents after children)

Once ALL children of a parent are locked, the parent goes through its own B→V→G trio.

The Verifier at assembly level checks TWO things:
1. **Assembly spec:** direction, gap, padding, child order from assembly chunk
2. **Child integration:** do the locked children compose correctly? Spacing between them?

**Child unlock (edge case):**
If the assembly Verifier finds a locked child is wrong in context (e.g., overflows
when placed next to siblings), the Gatekeeper can unlock the child and re-launch
its trio with additional context.

#### Step 4: Full Screen Assembly (page-level B→V→G trio)

The final trio assembles all sections into the full screen.

**Builder:** Composes all locked sections into the screen scaffold.

**Verifier** at this level does the comprehensive page-level audit:
- Assembly gap audit (every gap matches assembly spec exactly)
- Section order matches child chunk order
- No missing structural elements (dividers, tab bars, decorative layers)
- Fixed elements (header, nav) are actually fixed, not scrolling
- Z-index/layering correct across sections
- Scroll behavior correct (main vertical + nested horizontal)
- Full-screen screenshot comparison against `screenshots/full-screen.png`

**Gatekeeper:** Same PASS/FAIL criteria but at page level.

#### Step 5: Build Summary (user checkpoint)

Present complete build results with evidence:

```
╔══════════════════════════════════════════════════════════════╗
║ BUILD COMPLETE — [Screen Name]                               ║
╠══════════════════════════════════════════════════════════════╣
║ Components: 20/20 ✅  │ Total iterations: 34                 ║
║ Critical self-caught: 20 │ Escalated to user: 1              ║
║ Avg iterations: 1.7 per component                            ║
║                                                              ║
║ Top issue categories:                                        ║
║   wrong icon/asset:     5 (25%)                              ║
║   sizing mode mismatch: 4 (20%)                              ║
║   wrong stroke/border:  3 (15%)                              ║
║   position/spacing:     3 (15%)                              ║
║                                                              ║
║ Ready for Phase 5 (Production Hardening)?                    ║
╚══════════════════════════════════════════════════════════════╝
```

### User Feedback — Two-Channel System

Two simultaneous feedback channels run throughout the build:

**Channel 1: Terminal Stream (always visible)**
Real-time compact log of every agent action:
```
[time] Wave N | Component | 🔨 Builder reading spec / writing code
[time] Wave N | Component | 🔍 Verifier checking (layer 1 / layer 2)
[time] Wave N | Component | ✅ PASS (iter N) / ❌ FAIL → Builder (iter N+1)
[time] Wave N | Component | ⚠️ Missing asset / ❓ Unclear spec / 🚨 Escalation
```

After each wave, print grouped summary table:
```
[time] ═══ WAVE N COMPLETE ═══
       ┌──────────────────┬──────┬──────────┬───────────────────┐
       │ Component        │ Iter │ Critical │ Status            │
       ├──────────────────┼──────┼──────────┼───────────────────┤
       │ PnlSection       │ 1    │ 0        │ ✅ LOCKED          │
       │ QuickActions     │ 3    │ 4        │ ✅ LOCKED          │
       └──────────────────┴──────┴──────────┴───────────────────┘
       Progress: X/Y locked │ Next: Wave N+1
```

**Channel 2: Evidence Board (on key events)**
Full visual proof with Figma screenshots. Shown when:
- Component PASS → verification table + Figma screenshot (proof of correctness)
- Component FAIL → mismatches + Figma screenshot (what's being fixed)
- Escalation → full history + screenshots + options for user
- Wave complete → wave summary table
- Build complete → full stats + issue category breakdown

**On PASS — show the proof:**
Read the Figma chunk screenshot using Read tool (displays inline).
Show the complete spec-code verification table with all ✓.
Show visual diff summary (0 critical, N minor).

**On FAIL — show the evidence:**
Read the Figma chunk screenshot using Read tool.
For each CRITICAL mismatch, show:
- What Figma shows (from screenshot)
- What the code produces (from code analysis)
- What needs to change (specific fix instruction)

**On Escalation — show everything:**
Figma screenshot, iteration history (what was tried and fixed each time),
remaining issues, and clear options for the user.

**Figma screenshots are ALWAYS included** in evidence boards using the Read
tool on the .png files — the user sees the actual Figma render inline, not
just a file path or text description.

### Questioning Protocol

The skill behaves like the best frontend engineer on the team.
A great FE engineer doesn't just execute — they question, clarify, and push back.

**ALWAYS question when:**
- Spec contradicts screenshot → "Spec says X, screenshot shows Y. Which should I follow?"
- Asset is missing → "Icon [name] not exported. Add TODO or export manually?"
- Component type is ambiguous → "Is this a tab bar or a button group?"
- Behavior is unclear → "What happens when this list has 0 items? 100 items?"
- Gradient/effect can't be exactly reproduced → "This angular gradient needs approximation. Acceptable?"

**ALWAYS explain decisions:**
- "Using Expanded because spec says w:FILL"
- "Not rendering stroke #000000 because visible:false in spec"
- "Using gold text (#CDA953) for View All because spec fills show this color"

**NEVER do silently:**
- Substitute an icon
- Approximate a position
- Skip a property
- Change a sizing mode

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

> **Note:** This checklist is enforced by the Verifier agent during Phase 3.
> It is listed here as the reference standard. The Verifier produces a
> spec-code table covering every item below for every component.

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
- [ ] Stroke visibility: only render strokes with visible:true
- [ ] Multiple strokes: render all visible strokes, not just the first
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
