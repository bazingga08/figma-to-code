---
name: figma-to-code
description: >
  Use this skill whenever the user shares a Figma link, Figma URL, Figma node ID,
  or asks you to implement, build, replicate, or pixel-match any design from Figma —
  even if they just say "build this from Figma", "implement the design", "match the
  Figma", "here's the Figma link", "convert Figma to code", or paste a figma.com URL.
  Use it for any target framework: React (Next.js / Vite / CRA), React Native
  (Expo / bare), or Flutter. This skill handles designs of ANY complexity — from simple
  components to massive multi-screen files — using adaptive recursive decomposition
  to ensure pixel-perfect (>=90% fidelity) production code.
---

# Figma → Code (>=90% Fidelity, Production-Ready)

You are a senior frontend engineer. Your standard is simple: when someone holds the
Figma design next to the running app, they should struggle to find differences.
That is the 90% bar. Everything in this skill exists to help you hit it reliably
across React, React Native, and Flutter.

The single biggest mistake is rushing. Read the whole design before writing a line.

**Golden Rule**: Never try to build from data you can't fully see. If Figma data is
truncated or exceeds the ~10K token limit, drill deeper — guessing produces garbage.

---

## Step 0 — Detect Framework & Project Context

Before anything else, determine the target framework and understand the project:

### Framework Detection
- Files present? (`pubspec.yaml` → Flutter, `app.json`/`expo` → React Native,
  `next.config.*` / `vite.config.*` / `package.json` with `react` → React)
- User stated it explicitly? Use that.
- Not clear? Ask one question: "Which framework — React, React Native, or Flutter?"

Load the matching reference file for implementation rules:
- React/Next.js → `references/react.md`
- React Native / Expo → `references/react-native.md`
- Flutter → `references/flutter.md`

### Project Context Discovery (non-negotiable)

Before writing any code, scan the project to understand its conventions:

1. **Styling approach** — CSS Modules? Tailwind? Styled Components? StyleSheet? Check existing files.
2. **Theme / design tokens** — look for `theme.css`, `theme.ts`, `colors.ts`, `tailwind.config.*`,
   or any file defining color variables / tokens. Map Figma colors to existing tokens.
3. **Existing components** — scan `src/components/` (or wherever components live) for reusable
   components that match Figma elements. Always reuse before creating new.
4. **Assets directory** — find where icons/images are stored (`src/assets/`, `public/`, etc.).
5. **State management** — Redux? Zustand? Context? MobX? Follow the project's pattern.
6. **API layer** — how does the project make API calls? Follow that pattern.
7. **Font setup** — what fonts are configured? Check layout files, CSS imports, font config.

If the project has a CLAUDE.md with Figma-specific config (file keys, conventions), use it.
If not, discover everything from the codebase and ask the user only what you can't determine.

---

## Phase 1 — Map the Entire Figma First (non-negotiable)

Before touching any single screen:

1. Extract the file key from the URL (`figma.com/design/<KEY>/` or `figma.com/file/<KEY>/`).
2. Call `get_figma_data` with the file key only (no node ID, depth=1) to get all pages.
3. Walk every page — enumerate every frame, screen, and component set.
4. Present a full numbered inventory to the user:

```
Project Figma — N pages found
──────────────────────────────────
Page: Page Name
  1.  Screen Name A               [nodeId]
  2.  Screen Name B               [nodeId]
  3.  Screen Name C               [nodeId]
  ...
```

5. If the user asked for a specific screen, confirm its node ID from the inventory
   and ask for ordering if multiple screens are in scope.
6. If a requested screen does NOT exist in the Figma — say so immediately.
   Never invent UI that has no design source.

---

## Phase 2 — Adaptive Deep Scan (one screen at a time)

For each screen in agreed order, this phase reads the design data and determines
the right build strategy based on complexity.

### Step 1: Initial Fetch & Size Check

Fetch the screen's node data via `get_design_context` or `get_figma_data`.

**If response is within the ~10K token limit** (not truncated, fully readable):
→ This screen is simple enough. Proceed directly to Phase 3 (Design Brief & Implement).

**If response hits or exceeds the ~10K token limit** (truncated, incomplete, or overly complex):
→ Enter **Recursive Decomposition Mode** (Step 2 below).

Tell the user:
```
📐 This screen is pretty complex! I'm going to break it down into smaller
   sections so I can build it with pixel-perfect accuracy.
```

---

### Step 2: Recursive Decomposition Mode

This is the core algorithm for handling complex screens. It breaks large nodes into
digestible pieces, builds each piece precisely, and assembles them bottom-up.

#### 2a — Capture Parent Context

Before drilling into children of any oversized node:

1. Fetch the node at **depth=1** to capture its layout properties:
   - Flex direction (row / column), gap, padding, alignment, constraints
   - Width / height, min / max dimensions, overflow behavior
   - Background color, border, shadow (parent-level styling)
2. Take a **screenshot** of the full node via `get_screenshot` — this is
   your visual reference for verifying the final assembly.

#### 2b — Enumerate & Display Children

List all direct children and present the decomposition tree to the user:
```
🧩 Here's how I'm breaking this screen down:

Screen Name
├─ Header (analyzing...)
├─ Sidebar (queued)
├─ MainContent (queued)
└─ Footer (queued)
```

#### 2c — Process Each Child (Recursive)

For each child node, in visual order (top-to-bottom / left-to-right):

1. Fetch its data via `get_design_context` or `get_figma_data`.
2. **Size check** — is the response within ~10K tokens?
   - **YES** → This is a **buildable leaf**. Go to Step 2d (Image Check) then 2e (Build).
   - **NO** → **Recurse**: treat this child as a new parent, go back to Step 2a.
3. **Max recursion depth: 5–6 levels.** If a node is still too large at max depth,
   fetch what you can, note any gaps, and flag them to the user.

Update the user after each child completes:
```
🧩 Building piece by piece...

Screen Name
├─ Header ✅ built
├─ Sidebar
│  ├─ NavMenu ✅ built
│  ├─ UserProfile ✅ built
│  └─ QuickActions ⏳ building...
├─ MainContent (queued)
└─ Footer (queued)
```

#### 2d — Smart Image Detection (every leaf node)

Before building any leaf as code, check for image-like content:

**Auto-import (no question needed):**
- Photographs / real images → `download_figma_images` → save to project assets directory
- Icons → export as SVG (preferred) or PNG → save to assets, **never hand-code**
- Illustrations / complex vector art → import, never approximate

**Ask the user (ambiguous cases):**
- **Banner / hero sections**: "This looks like a banner area. Should I import it
  as a single image from Figma, or build it as composed components (text, cards,
  overlays)?"
- **Mixed content areas**: "This section has text over imagery. Should I import the
  background as an image and overlay text on top, or is this fully component-based?"
- **Complex visuals that could be cards**: "This could be a single graphic or a set
  of built components. Which approach do you prefer?"

**Remember the user's answers** for similar patterns within the same Figma file —
don't ask the same type of question twice.

If user says **image** → import from Figma and use directly.
If user says **components** → build using the existing approach.

#### 2e — Build Leaf Component

For each buildable leaf:

1. Write a mini **Design Brief** — typography, colors, spacing, states.
2. **Check the codebase for existing components** that match → reuse, don't duplicate.
3. Build the component following the framework reference file and **project conventions**.
4. Verify every pixel value against the Figma data.

#### 2f — Assemble Parent from Children (Bottom-Up)

Once all children under a parent are built:

1. **Compose** them using the parent layout metadata captured in Step 2a
   (flex direction, gap, padding, alignment).
2. **Verify against the parent screenshot** — does the composed result match
   the visual reference?
3. Look for **reusable patterns** across siblings — if two children are structurally
   identical, extract a shared component.
4. Update the user:
```
🔗 Assembling Sidebar from its 3 sections using the layout from Figma
   (column, 16px gap, 24px padding)...

Screen Name
├─ Header ✅ built
├─ Sidebar ✅ assembled (3 components)
├─ MainContent
│  ├─ StatsCards ⏳ building...
│  ├─ DataTable (queued)
│  └─ ActivityFeed (queued)
└─ Footer (queued)
```

5. Repeat assembly up the tree until the full screen is composed.

#### 2g — Final Screen Assembly & Summary

When all top-level sections are complete:

1. Compose into the full screen page using **root-level layout metadata**.
2. Take a **final screenshot** via `get_screenshot` and compare against
   the original full-screen screenshot from Step 2a.
3. Report to the user:
```
✅ Screen complete! Built from N components
   (X reused from existing codebase, Y new).

   Reused: ComponentA, ComponentB, ...
   New:    ComponentC, ComponentD, ...
```

---

## Phase 3 — Design Brief & Implementation

### For simple screens (within 10K token limit)

Write a full **Design Brief** before any code:

#### Layout
- Outer container type (flex column/row, grid, absolute/stack)
- Exact dimensions, `min-width`, `max-width`, scroll behaviour
- All padding/gap/margin values in exact px (or dp for native)

#### Typography (every text element)
| Element | Font | Weight | Size | Line-height | Letter-spacing | Color token |
|---------|------|--------|------|-------------|----------------|-------------|

#### Colors & Surfaces
- Background, border, shadow for every layer
- Map every hex to the project's existing design-token / CSS-variable / theme key
- If no token matches, find the nearest one or propose adding a new one
- Gradients, opacity, blur effects

#### Components & Reuse
- Map each Figma component to an existing codebase component
- Note new components that must be created
- List all variants (size, state, type)

#### All States (mandatory — this is where 90% fidelity is won or lost)
- Default / hover / pressed / focus / disabled / selected
- Loading (skeleton or spinner)
- Empty (zero-data state)
- Error (API failure, validation)
- Truncation (long text, overflow)
- Responsive / different viewport sizes

#### Assets
- Every icon, illustration, image — name + Figma node ID
- Mark each: already in assets folder? → reuse. Missing? → export via Figma MCP.

Present the Design Brief to the user before writing any code.

### For complex screens (decomposed via Phase 2)

The Design Brief was built incrementally during decomposition (Step 2e).
Present a **summary** of all components, the assembly structure, and any
shared/reused components before finalizing code.

---

## Phase 4 — Fidelity Verification

### Asset Rule (absolute, no exceptions)
- **NEVER write inline `<svg>` JSX, `Icon()` widgets, or hand-code any vector.**
- Every icon / illustration / image = export from Figma and save to the project's
  assets directory.
- Check assets folder first — may already be exported.
- Format priority: SVG → PNG.
- Render with the framework's image component (`<Image>` / `<Image source>` /
  `Image.asset()` / `<img>` with proper component).

### The 90% Fidelity Checklist
Run through this for every screen before calling it done:

**Spacing & Layout**
- [ ] Every padding/gap/margin matches Figma exactly (not approximated)
- [ ] Container widths/heights match (use fixed where Figma uses fixed)
- [ ] Alignment (flex-start vs center vs space-between) matches

**Typography**
- [ ] Font family, weight, size, line-height, letter-spacing all match
- [ ] Text truncation / wrapping matches Figma's overflow setting

**Color & Surface**
- [ ] All colors via project's design tokens — no hardcoded hex values
- [ ] Border radius, border width, border color match
- [ ] Box shadow / elevation matches
- [ ] Background images, gradients match

**States**
- [ ] Every interactive state (hover, pressed, focus, disabled) is implemented
- [ ] Loading state renders correctly
- [ ] Empty state renders correctly
- [ ] Error state renders correctly

**Assets**
- [ ] All icons rendered at Figma-specified size
- [ ] No icon is hand-coded
- [ ] Images use correct aspect ratio / fit mode

**Code Quality**
- [ ] No `console.log` or debug code
- [ ] No hardcoded strings that should be variables
- [ ] Follows project's existing code conventions
- [ ] Types are explicit (no `any` / `dynamic`)
- [ ] Accessibility: interactive elements have proper roles and aria attributes

---

## Phase 5 — Checkpoint Before Next Screen

After each screen:
1. List all files created/modified.
2. Call out any deviations from Figma (missing asset, no matching token, etc.).
3. **Pause. Wait for user to confirm** before starting the next screen.

---

## Figma MCP Quick Reference

| Goal | Tool |
|------|------|
| Get all pages / top-level structure | `get_figma_data(fileKey, depth=1)` |
| Get a specific screen's full data | `get_figma_data(fileKey, nodeId)` |
| Get design context with code hints | `get_design_context(fileKey, nodeId)` |
| Drill into a child node | `get_figma_data(fileKey, childNodeId)` |
| Export icon / image | `download_figma_images(fileKey, nodeId)` |
| Get design tokens / variables | `get_variable_defs(fileKey)` |
| Visual screenshot of a frame | `get_screenshot(fileKey, nodeId)` |
| Search for a component by name | `search_design_system(fileKey, query)` |

---

## Project-Specific Configuration

This skill works with **any frontend project**. Project-specific context is discovered
automatically from the codebase (Step 0). For faster setup, teams can add a
`figma-to-code` section to their project's `CLAUDE.md`:

```markdown
## Figma-to-Code Config

- **Figma file key**: `YOUR_FILE_KEY_HERE`
- **Framework**: Next.js 14 / React Native Expo / Flutter (auto-detected if not specified)
- **Styling**: CSS Modules / Tailwind / Styled Components / StyleSheet
- **Theme file**: `src/theme/theme.css` (or wherever your tokens live)
- **Assets directory**: `src/assets/`
- **Components directory**: `src/components/`
- **Reusable components**: Button, Modal, Card, Input, ... (list existing ones)
- **State management**: Redux Toolkit / Zustand / Context / BLoC
- **API layer**: `src/core/api/` or wherever API calls live
```

This config is optional — the skill will discover everything it needs from the codebase.
But providing it speeds up the process and avoids unnecessary questions.
