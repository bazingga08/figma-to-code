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

## Phase 3 — Bottom-Up Building (Leaves First, Assemble Upward)

Follow the build order from `blueprint.md` exactly.

### Step 1: Build Reusable Components First

For each entry in `reusables/`:
1. Read the reusable spec file
2. Check codebase for an existing component that matches
3. If no match exists, build it following the framework reference file
4. Verify against the screenshot

### Step 2: Build Leaf Chunks

For each leaf chunk in `chunks/` (numbered order):
1. Read the chunk file — it has exact layout, typography, colors, children
2. View the screenshot for visual reference
3. Check for reusable components referenced in the chunk → use already-built ones
4. Build the component with pixel-matched accuracy:
   - Every padding/gap/margin from the spec
   - Every font/weight/size from the spec
   - Every color mapped to project tokens
   - Assets from `.figma-extract/assets/` (never hand-code icons)
5. Verify against screenshot
6. Update progress:

```
Building piece by piece...

Screen
├─ Header ✅ built
├─ Sidebar
│  ├─ NavMenu ✅ built
│  └─ UserProfile ⏳ building...
├─ MainContent (queued)
└─ Footer (queued)
```

### Step 3: Assemble Parent Chunks

For each assembly chunk in `chunks/`:
1. Read the assembly spec — it has layout direction, gap, padding, alignment
2. Compose the already-built children using those layout properties
3. Verify against parent screenshot
4. Look for shared patterns across siblings — extract shared components if needed

### Step 4: Final Screen Assembly

1. Compose all top-level sections into the full screen
2. Compare against `screenshots/full-screen.png`
3. Report:

```
✅ Screen complete! Built from N components
   (X reused from existing codebase, Y new).

   Reused: ComponentA, ComponentB, ...
   New:    ComponentC, ComponentD, ...
```

---

## Phase 4 — Fidelity Verification

### Asset Rule (absolute, no exceptions)
- NEVER write inline SVG, Icon() widgets, or hand-code any vector
- NEVER use Material Icons, CupertinoIcons, or framework placeholder icons
- Every icon/illustration/image = use from `.figma-extract/assets/` or project assets
- If an icon is missing from `.figma-extract/assets/`, flag it — do NOT substitute
- Render with the framework's image component (SvgPicture.asset, Image.asset, etc.)
- Fill images (backgrounds, photos) are in `assets/images/` as PNG

### The 90% Fidelity Checklist

Run through this for every screen before calling it done:

**Spacing & Layout**
- [ ] Every padding/gap/margin matches spec exactly
- [ ] Container widths/heights match
- [ ] Alignment matches

**Typography**
- [ ] Font family, weight, size, line-height, letter-spacing all match
- [ ] Text truncation / wrapping matches

**Color & Surface**
- [ ] All colors via project's design tokens — no hardcoded hex
- [ ] Border radius, border width, border color match
- [ ] Box shadow / elevation matches

**States**
- [ ] Every interactive state is implemented (hover, pressed, focus, disabled)
- [ ] Loading, empty, error states if in design

**Assets**
- [ ] All icons at correct size
- [ ] No icon is hand-coded
- [ ] Images use correct aspect ratio

**Code Quality**
- [ ] No console.log or debug code
- [ ] No hardcoded strings that should be variables
- [ ] Follows project conventions
- [ ] Types are explicit
- [ ] Accessibility: proper roles and aria attributes

---

## Phase 5 — Checkpoint Before Next Screen

After each screen:
1. List all files created/modified
2. Call out any deviations from the design
3. **Pause. Wait for user to confirm** before starting the next screen

---

## Figma MCP Fallback Reference

Only use these if the REST API extractor is unavailable:

| Goal | Tool |
|------|------|
| Get design context (small nodes only) | `get_design_context(fileKey, nodeId)` |
| Get screenshot | `get_screenshot(fileKey, nodeId)` |
| Get metadata | `get_metadata(fileKey, nodeId)` |
