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

# Figma → Code v2 (>=90% Fidelity, Production-Ready)

You are a senior frontend engineer. Your standard is simple: when someone holds the
Figma design next to the running app, they should struggle to find differences.

**How v2 works**: Instead of calling Figma MCP tools directly (which truncate at ~10K
tokens and fail on large designs), this skill runs a Node.js extractor that fetches the
full design via Figma REST API, analyzes it, and writes pre-chunked specs to disk.
You read those specs and build bottom-up.

**Golden Rule**: Never guess. Every value comes from the extracted specs or screenshots.

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
- `assets/icons/` — smart-filtered SVG icons (only real icons, not sub-paths)
- `assets/images/` — fill images (PNG) downloaded via Figma Image Fills API

**Asset filtering**: The extractor only exports real icons — INSTANCE components,
semantic-named FRAMEs at icon sizes (12-48px), and STAR nodes. It skips junk
sub-paths (Vector, Rectangle, Line, path* nodes inside compound shapes/groups).
This typically reduces exports from thousands of nodes to ~10-30 real icons.

If the extractor fails, check:
1. Is `$FIGMA_ACCESS_TOKEN` set?
2. Is the file key / node ID correct?
3. Does the user have a Full/Dev seat (not View/Collab)?

**MCP Fallback**: If the REST API is unavailable, fall back to Figma MCP tools
(`get_design_context`, `get_figma_data`, `get_screenshot`) for individual small
components only. Never use MCP for the full design fetch.

---

## Phase 2 — Top-Down Reading (Understand First, Build Nothing)

1. Read `.figma-extract/blueprint.md` — understand the complete structure
2. Review the **Build Order** — this is the sequence you'll follow
3. Review **Reusable Components** — these get built first, reused everywhere
4. Review **Design Tokens** — map extracted colors/fonts to project's existing tokens
5. Review **Assets** — confirm icons and images are exported

Present the inventory to the user:

```
Figma Design: <name>
──────────────────────────────────
Sections: <N> top-level
Components: <N> unique, <M> total instances
Build order: <N> steps (leaves first → full screen)

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
```

**Rules:**
- A tab bar is a tab bar, not a row of buttons — use TabBar/TabController
- A list is a list — use ListView.builder, not Column with mapped children
- A bottom nav is a bottom nav — use BottomNavigationBar or equivalent
- A horizontal scroller is a horizontal scroller — use ListView horizontal
- Cards are cards, chips are chips, badges are badges — use correct semantics

### Step 2: Map Parent-Child Relationships

Understand how sections CONNECT. The full page has a flow and hierarchy:
- What scrolls? What's fixed?
- Which sections are siblings? Which are nested?
- Where are dividers? What's the visual rhythm?
- What's the tab content vs. tab bar vs. page scaffold?

Write this semantic map BEFORE building. Example:

```
Scaffold
├─ Fixed: TopHeader (app bar)
├─ Scrollable body:
│  ├─ P&L gradient section
│  ├─ Explore/Strategies TAB BAR (2 tabs)
│  ├─ Quick actions HORIZONTAL SCROLL
│  ├─ Announcements section (header + HORIZONTAL CARD SCROLL)
│  ├─ Divider
│  ├─ Start Trading (header + COIN TAB BAR + chart + buttons)
│  ├─ Watchlist TAB BAR (5 tabs)
│  ├─ Coin LIST (5 rows)
│  ├─ View All button
│  └─ Contests (header + HORIZONTAL CARD SCROLL)
└─ Fixed: Bottom NAVIGATION BAR (5 items)
```

### Step 3: Identify Dynamic vs Static Content

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

This is the core workflow. Build one component at a time, verify it against the
Figma screenshot, iterate until it matches, then move to the next.

### Step 1: Build Reusable Components First

For each entry in `reusables/`:
1. Read the reusable spec file
2. Check codebase for an existing component that matches
3. If no match exists, build it following the framework reference file
4. **Verify** (see Step 4 below)

### Step 2: Build Each Leaf Chunk (numbered order)

For each leaf chunk in `chunks/`:

**2a — Read BOTH the spec AND the screenshot**
1. Read the chunk `.md` file — exact layout, typography, colors, children
2. Read the chunk screenshot — understand WHAT this component IS visually
3. Identify the semantic UI pattern (from Phase 2.5 mapping)

**2b — Check every style property** (non-negotiable)
Before writing code, mentally go through EVERY property in the spec:
- [ ] Layout: type, direction, width, height, sizing mode
- [ ] Padding: all 4 sides exactly
- [ ] Gap: item spacing
- [ ] Alignment: main axis, cross axis
- [ ] Background: fills (solid, gradient with angle, image with scale mode)
- [ ] Border: strokeWeight, color, align, radius (all 4 corners), smoothing
- [ ] Effects: shadows (offset, blur, spread, color), blur
- [ ] Opacity, blend mode, rotation
- [ ] Clips content, overflow direction
- [ ] Constraints, absolute positioning, min/max sizes
- [ ] Text: every single property (font, weight, size, lineHeight, letterSpacing,
      color, case, decoration, align, truncation, maxLines, italic)
- [ ] Mixed text styles (characterStyleOverrides)

**If ANY style property exists in the spec, it MUST be in the code.**
Missing a single `letterSpacing: 0.2` or `borderRadius: 8` makes it not match.

**2c — Build the component**
- Use exact values from spec — no rounding, no approximation
- Use actual SVG icons from `.figma-extract/assets/` — never Material Icons
- Map colors to project tokens — if no match, use the exact hex
- Follow the semantic pattern identified in Phase 2.5

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

**4b — Compare: Read BOTH images**

Read the two images:
1. Figma screenshot: `.figma-extract/screenshots/<chunk>.png`
2. Built screenshot: `test/goldens/widget_name.png`

Compare them visually. Check for:
- Layout/spacing mismatches
- Color differences
- Typography issues (font size, weight, wrong font)
- Missing elements or extra elements
- Border radius, shadow, opacity differences
- WRONG COMPONENT TYPE (tab bar rendered as buttons, list rendered as column)
- Alignment issues

**4c — Generate structured diff**

```
MATCH:    background color correct
MATCH:    font family correct
MISMATCH: padding-left should be 12px, appears larger (~16px)
MISMATCH: border-radius missing on container
MISMATCH: text color #A0AEC0 appears as #FFFFFF
MISSING:  letterSpacing not applied
MISSING:  shadow not applied
```

**4d — Fix and re-verify**

Apply specific fixes from the diff. Re-capture screenshot. Re-compare.

**Max 3 iterations per component.** If still off after 3 tries:
- Flag the specific mismatches to the user
- Ask if they want to continue or fix manually
- Move to next component

**4e — Lock the component**

Once verified, mark as done:
```
✅ PnlSection — verified (1 iteration)
✅ QuickActions — verified (2 iterations, fixed padding + icon size)
⚠️ CandlestickChart — 85% match after 3 iterations (chart rendering differs)
⏳ WatchlistTabs — building...
```

### Step 5: Final Screen Assembly & Verification

1. Compose all sections into the full screen
2. Capture full-screen screenshot
3. Compare against `screenshots/full-screen.png`
4. Check: does the FLOW between sections match? Spacing between sections? Dividers?
5. Report final status with any remaining mismatches

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
- [ ] Every padding/gap/margin matches spec exactly (no rounding)
- [ ] Container widths/heights match (FIXED/FILL/HUG)
- [ ] Main axis + cross axis alignment match
- [ ] Absolute positioned elements are positioned correctly
- [ ] Min/max constraints applied where specified
- [ ] Clips content / overflow matches

**Typography (every text node)**
- [ ] Font family matches exactly
- [ ] Font weight matches exactly
- [ ] Font size matches exactly
- [ ] Line height matches (as multiplier: lineHeightPx / fontSize)
- [ ] Letter spacing applied
- [ ] Text color matches (check spec, not assumption)
- [ ] Text case (uppercase, etc.) applied
- [ ] Text decoration (underline, etc.) applied
- [ ] Text alignment (horizontal + vertical) matches
- [ ] Truncation / maxLines applied
- [ ] Mixed styles handled (bold words, colored spans)

**Color & Surface**
- [ ] All fills match — solid colors, gradients (with correct angle)
- [ ] Border radius matches — all 4 corners
- [ ] Corner smoothing applied where specified
- [ ] Border/stroke matches — weight, color, align
- [ ] Box shadow matches — offset, blur, spread, color
- [ ] Opacity applied at correct level (node vs fill)
- [ ] Gradient stops and positions match

**Semantic Correctness**
- [ ] Component type matches design intent (tab bar IS a tab bar)
- [ ] Interactive patterns correct (scrollable where needed)
- [ ] List items use builder pattern, not hardcoded children
- [ ] Navigation patterns use proper framework widgets

**Assets**
- [ ] All icons from `.figma-extract/assets/` at exact size
- [ ] No icon is hand-coded or substituted
- [ ] Images use correct scale mode (FILL/FIT/COVER)

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

### When verification fails after 3 iterations
1. List the specific remaining mismatches
2. Show both screenshots (Figma vs built)
3. Ask: "These differences remain. Should I continue iterating, move on, or do you want to fix these manually?"

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
