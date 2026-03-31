# figma-to-code v2 — Complete Plan

## Problem Statement

Building UI from large Figma designs (333K+ tokens) produces output that looks
nothing like the original design. This happens because:

1. **MCP tools truncate** at ~10K tokens — large designs lose data
2. **No verification loop** — build everything, hope it matches, it never does
3. **Style properties silently dropped** — half the CSS gets lost during extraction
4. **Context loss** — on large pages, semantic meaning is lost (tabs→buttons, list→column)
5. **Hallucination** — when unclear, the builder guesses instead of asking
6. **No error recovery** — when something fails, the skill gets stuck

## Solution: REST API Extractor + Atomic Build-Verify-Iterate

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIGMA REST API                              │
│  Full node tree in one call (no truncation, no rate limits)     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE.JS EXTRACTOR (figma-extract.js)               │
│                                                                 │
│  1. Fetch full tree ──→ tree-walker.js (structure + chunking)   │
│  2. Detect components ──→ component-detector.js (reusables)     │
│  3. Extract tokens ──→ token-extractor.js (colors, fonts, etc.) │
│  4. Export assets ──→ asset-exporter.js (smart-filtered icons)  │
│  5. Write specs ──→ chunk-writer.js + blueprint-writer.js       │
│  6. Download screenshots ──→ per-chunk visual references        │
│  7. Download images ──→ fill images via getImageFills API       │
│                                                                 │
│  Output: .figma-extract/                                        │
│  ├─ blueprint.md (full structure + build order + tokens)        │
│  ├─ chunks/ (per-component specs with ALL style properties)     │
│  ├─ reusables/ (component specs used multiple times)            │
│  ├─ screenshots/ (visual reference per chunk + full-screen)     │
│  └─ assets/ (icons as SVG, images as PNG)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                SKILL.md — BUILD WORKFLOW                         │
│                                                                 │
│  Phase 0:  Detect framework + project context                   │
│  Phase 1:  Run extractor                                        │
│  Phase 2:  Read blueprint, present inventory, get confirmation  │
│  Phase 2.5: Semantic design mapping (BEFORE any code)           │
│  Phase 3:  Build-Verify-Iterate per component (bottom-up)       │
│  Phase 4:  Rules & guardrails (assets, no-hallucinate, styles)  │
│  Phase 5:  Checkpoint per screen                                │
│                                                                 │
│  Error handling at every phase                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## What's Built (Done)

### Extractor Pipeline (src/)

| Module | Status | What it does |
|--------|--------|-------------|
| `api.js` | DONE | Figma REST API client — getNodes, getImages, getImageFills, downloadImage |
| `tree-walker.js` | DONE | Structural analysis — hierarchy, build order, smart chunking at FRAME boundaries |
| `component-detector.js` | DONE | Finds reusable components, groups instances, tracks overrides |
| `token-extractor.js` | DONE | Extracts colors (solid+gradient+shadow+text fills), typography (with italic/case/decoration), spacing, border radii, shadow tokens, border widths |
| `asset-exporter.js` | DONE | Smart-filtered icon export — INSTANCE/FRAME/STAR at icon sizes, skips sub-paths (Vector/Rectangle/Line/path*). Size filter on instances. |
| `chunk-writer.js` | DONE | Comprehensive style capture — ALL properties including: gradients with angles, cornerSmoothing, absolute positioning, constraints, min/max sizes, counterAxisSpacing, overflow, rotation, masks, strokeCap/Join, text truncation/maxLines/autoResize/verticalAlign/italic, characterStyleOverrides, image fill scaleMode/rotation/filters. Skips invisible nodes. |
| `blueprint-writer.js` | DONE | Generates blueprint.md with tree structure, build order, reusables, all token categories (colors, typography, spacing, radii, shadows, border widths), asset manifest |
| `figma-extract.js` | DONE | CLI orchestration — fetch, analyze, chunk, write, download screenshots + icons + images |

### Skill (skills/figma-to-code/)

| Phase | Status | What it does |
|-------|--------|-------------|
| Phase 0 | DONE | Framework detection + project context discovery |
| Phase 1 | DONE | Run extractor, handle failures |
| Phase 2 | DONE | Read blueprint, present inventory, wait for confirmation |
| Phase 2.5 | DONE | Semantic design mapping — identify UI patterns, map relationships, flag ambiguity |
| Phase 3 | DONE | Build-Verify-Iterate loop — build per component, capture screenshot, compare with Figma, structured diff, fix, re-verify, max 3 iterations, lock |
| Phase 4 | DONE | Asset rule, never-hallucinate rule, style completeness rule, 95% fidelity checklist |
| Error handling | DONE | Recovery paths for extraction/build/verification/asset/spec/unexpected failures |
| Phase 5 | DONE | Checkpoint per screen |
| Flutter reference | DONE | `references/flutter.md` with layout mapping, styling patterns, pixel-perfect tips |
| React reference | EXISTS | `references/react.md` (from v1, may need update) |
| React Native ref | EXISTS | `references/react-native.md` (from v1, may need update) |

---

## What Needs Testing / Validation

### Priority 1 — End-to-End Test (validates the whole pipeline)

Run the full pipeline on the Futures/Home screen again with all fixes:
1. Extract with updated extractor (comprehensive styles + smart icons + image downloads)
2. Read the updated chunks — verify they now contain all style properties
3. Build the Flutter app following the new SKILL workflow:
   - Phase 2.5 semantic mapping
   - Per-component build-verify-iterate
   - Golden test screenshots for comparison
4. Compare final output against Figma design

**Success criteria:** The Flutter app should be recognizably the same screen as the Figma,
with correct component types (tabs ARE tabs), correct colors, correct typography,
correct spacing, correct icons from assets.

### Priority 2 — Golden Test Infrastructure

Set up the Flutter golden test framework for atomic verification:
- `flutter_test_config.dart` with custom comparator (5% threshold for font rendering)
- Test template that renders a widget in isolation at 1x scale
- Script to run all golden tests and generate comparison report
- Load Manrope font in test environment (avoid Ahem squares)

### Priority 3 — Remaining P1 Property Gaps

Properties captured by the API but not yet in chunk-writer:
- Grid layout (`layoutMode: "GRID"`) — Figma's CSS Grid feature
- `relativeTransform` matrix — rotated/skewed elements
- `booleanOperation` type (UNION/INTERSECT/SUBTRACT/EXCLUDE)
- `arcData` on ELLIPSE (arcs/donuts)
- `lineTypes`/`lineIndentations` (list bullet/number formatting)
- `boundVariables` (Figma variables system)

### Priority 4 — React/React Native Reference Updates

Update `references/react.md` and `references/react-native.md` to match
the level of detail in `references/flutter.md`.

---

## Key Decisions Made

| Decision | Why |
|----------|-----|
| REST API over MCP | MCP truncates at ~10K tokens, rate-limited (6/month on View seats). REST returns full tree in one call. |
| Smart asset filtering | Exporting every VECTOR as an icon produced ~1500 junk files. Filter by type (INSTANCE/FRAME/STAR), size (12-48px), and naming (skip generic Vector/Rectangle/Line/path*). |
| Comprehensive chunk style capture | Missing properties = visual mismatches. Every Figma property must be in the spec. |
| Atomic build-verify-iterate | Building everything then hoping it matches never works. Build one component, verify screenshot, fix, repeat. |
| Claude Vision as comparator | Pixel-diff tools fail on font rendering/AA differences. Claude understands semantic differences and gives actionable feedback. |
| Semantic mapping before building | Without understanding WHAT each component IS, tabs become buttons, lists become columns. Read full screenshot first. |
| Never-hallucinate rule | Guessing when unclear produces wrong output. Always ask the user. |
| Error recovery at every phase | Getting stuck silently wastes time. Always explain, suggest alternatives, provide a way forward. |

---

## File Structure

```
figma-to-code-plugin/
├── src/
│   ├── api.js                  # Figma REST API client
│   ├── tree-walker.js          # Structure analysis + smart chunking
│   ├── component-detector.js   # Reusable component detection
│   ├── token-extractor.js      # Design tokens (colors, typography, spacing, radii, shadows, borders)
│   ├── asset-exporter.js       # Smart-filtered icon/image export
│   ├── blueprint-writer.js     # Blueprint.md generation
│   ├── chunk-writer.js         # Per-component spec generation (ALL styles)
│   └── figma-extract.js        # CLI entry point — orchestrates everything
├── skills/
│   └── figma-to-code/
│       ├── SKILL.md            # The skill prompt (phases 0-5 + error handling)
│       └── references/
│           ├── flutter.md      # Flutter implementation rules
│           ├── react.md        # React implementation rules
│           └── react-native.md # React Native implementation rules
├── test/                       # Unit tests for each module
├── .figma-extract/             # Output directory (gitignored)
├── package.json
├── README.md
└── PLAN.md                     # This file
```

---

## Commit History

```
8df0a18 feat: atomic validation loop + semantic mapping + error recovery + no-hallucinate rules
300c574 feat: comprehensive style capture — zero silent property drops
05cb393 fix: chunk-writer captures ALL style properties — no silent drops
4780220 fix: smart asset filtering — only export real icons, add image fill downloads
d74cd2a chore: make plugin fully generic — remove project-specific data
1f07809 fix: smarter chunking at FRAME boundaries + batched API calls
3de4dbd feat: rewrite SKILL.md for v2 — REST API extractor + bottom-up build
4607a54 docs: update README, plugin config for v2
4fe74d7 feat: wire up CLI orchestration — fetch, analyze, chunk, write
407a2e9 feat: blueprint writer
bc72e66 feat: chunk writer
b6c0fc3 feat: asset exporter
6e5be92 feat: token extractor
beb0983 feat: component detector
2f0aa59 feat: tree walker
```
