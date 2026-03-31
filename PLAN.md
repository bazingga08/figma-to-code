# figma-to-code v2 — The Big Picture

## What This Is

A Claude Code plugin that takes any Figma design link and produces **production-ready code**
in Flutter, React (Next.js), or React Native — at ≥95% visual fidelity, with responsive
layout, accessibility, state management, data layer, and error handling built in.

Not a pixel copier. A principal engineer in a box.

---

## The Problem (Why This Exists)

Every existing Figma-to-code approach fails on real production designs because:

| Problem | What happens |
|---------|-------------|
| **Data truncation** | MCP tools cap at ~10K tokens. A real screen is 100K-333K+. Half the design is invisible. |
| **Style loss** | Extractors silently drop borderRadius, shadows, letterSpacing, gradients, absolute positioning, text truncation, mixed styles — producing code that "almost" matches but never does. |
| **Context loss** | On large pages, the builder loses what things ARE. Tab bars become buttons. Lists become hardcoded columns. The relationship between sections is lost. |
| **No verification** | Build everything → hope it matches → it never does → ship garbage. |
| **No production thinking** | Visual matching without responsive, accessible, state-managed, data-ready code is a screenshot, not software. |
| **Hallucination** | When something is unclear, the builder guesses. Wrong guesses compound across the whole page. |

---

## The Solution — 3 Layers

### Layer 1: Complete Data Extraction

A Node.js extractor that fetches the **full** Figma node tree via REST API in one call.
No truncation. No rate limits. Produces chunked specs with **every** style property.

```
Figma REST API
      │
      ▼
figma-extract.js ── orchestrates 7 steps:
├── tree-walker.js ────── Structure: hierarchy, build order, smart chunking at FRAME boundaries
├── component-detector.js ── Finds reusable components, groups instances, tracks overrides
├── token-extractor.js ──── Design tokens: colors (solid+gradient+shadow+text fills),
│                           typography (font/weight/size/lineHeight/letterSpacing/italic/
│                           case/decoration), spacing, border radii, shadows, border widths
├── asset-exporter.js ───── Smart-filtered icons: only INSTANCE/FRAME/STAR at 12-48px,
│                           skips sub-paths (Vector/Rectangle/Line/path* junk)
├── chunk-writer.js ─────── Per-component specs with ALL Figma properties:
│                           layout, padding, gap, alignment, absolute positioning, constraints,
│                           min/max, overflow, clips, fills (solid/gradient with angle/image
│                           with scaleMode), borders (weight/color/cap/join/dash/individual),
│                           corner radius (4 corners + smoothing/squircle), effects (shadow
│                           with offset/blur/spread/color, blur), opacity, blend, rotation,
│                           masks, text (every property including mixed styles via
│                           characterStyleOverrides). Skips invisible nodes.
├── blueprint-writer.js ─── Full tree + build order + tokens + asset manifest
└── screenshots + images ── Per-chunk visual references + fill images via getImageFills API

Output: .figma-extract/
├── blueprint.md        (complete structure + build order + all token categories)
├── chunks/             (per-component specs, each ≤ 10K tokens)
├── reusables/          (component specs used multiple times)
├── screenshots/        (visual reference per chunk + full-screen)
└── assets/
    ├── icons/          (SVGs — smart-filtered, ~10-30 real icons)
    └── images/         (PNGs — fill images from Figma)
```

### Layer 2: Principal Engineer Build Workflow

A skill prompt (SKILL.md) that thinks like a principal engineer — not just matching
pixels but building production software.

**6 Non-Negotiable Principles (override all phase instructions):**

```
1. EVERY VALUE FROM THE SPEC
   padding: 12px 8px 12px 16px → exactly that. Not "12px". Not "roughly 12".
   Every color, font, radius, shadow, letterSpacing, gradient angle, opacity.
   Missing one property = doesn't match the design.

2. NEVER SUBSTITUTE OR HALLUCINATE
   Missing icon → flag with // TODO, never use Material Icons.
   Tabs in design → TabBar, never buttons.
   Unclear spec → ask user, never guess.

3. READ TOP-DOWN FOR CONTEXT
   Screen → sections → components → leaves.
   Understand WHAT each component IS, HOW sections connect,
   WHAT'S dynamic vs static. 10 minutes of mapping prevents
   hours of rework.

4. BUILD BOTTOM-UP FOR PRECISION
   Leaves → frames → components → sections → screen.
   Each unit ≤ 10K tokens. Verify each before assembling parent.
   If too big, drill deeper until it fits.
   Errors don't compound upward.

5. VERIFY EVERY COMPONENT
   Build → screenshot → compare to Figma → structured diff →
   fix → re-verify. Max 3 iterations. Never mark done without
   visual verification.

6. THINK BEYOND THE VISUAL
   Figma shows one screen size, happy path, mock data.
   Production handles: every screen size, every state
   (loading/error/empty), every user (screen readers, RTL),
   every failure (network down, slow connection, image 404).
```

**7 Phases:**

```
Phase 0  │ DETECT       │ Framework + project conventions (existing theme, components, patterns)
Phase 1  │ EXTRACT      │ Run REST API extractor → .figma-extract/ with full data
Phase 2  │ READ         │ Top-down: blueprint → full-screen screenshot → tree structure
         │              │ → build order → tokens → assets. Present inventory. Confirm.
Phase 2.5│ UNDERSTAND   │ Semantic mapping: identify every UI pattern (tab bar, list, nav),
         │              │ map parent-child relationships, identify dynamic vs static content,
         │              │ flag ambiguity and ASK user.
Phase 3  │ BUILD+VERIFY │ Bottom-up: reusables first → leaf chunks → parent assembly → screen.
         │              │ Per component: read spec + screenshot → check every style property →
         │              │ build → capture screenshot → compare → structured diff → fix →
         │              │ re-verify → max 3 iterations → lock. Each unit ≤ 10K tokens.
Phase 4  │ RULES        │ Asset rule (no placeholders), hallucination rule (ask don't guess),
         │              │ style completeness rule (every property), 95% fidelity checklist.
Phase 5  │ HARDEN       │ Production hardening: responsive (320px-tablet), accessibility
         │              │ (48x48 targets, semanticLabels), state + data layer (models,
         │              │ repos, loading/error/empty), navigation wiring, edge cases
         │              │ (overflow, empty lists, image fallbacks), theme integration
         │              │ (ThemeData/ColorScheme), performance review.
Phase 6  │ CHECKPOINT   │ List files, data models, deviations, prod concerns. Wait for user.
```

**Error handling at every phase:**
- Extraction fails → explain why, suggest fix
- Component fails to build → tell user, show spec + screenshot, ask for direction
- Verification fails after 3 tries → list remaining mismatches, ask user
- Asset missing → flag with TODO, continue
- Spec ambiguous → show both spec + screenshot, ask user
- Unexpected error → capture error, suggest alternatives, never loop

### Layer 3: Framework-Specific Production Patterns

Three reference files (flutter.md, react.md, react-native.md) covering:

| Category | What it covers |
|----------|---------------|
| **Figma → Code mapping** | Auto Layout → Flex, padding, gap, alignment, fill/hug/fixed, shadows, gradients, border radius, typography, text properties, constraints |
| **Styling tokens** | Colors via theme (not hardcoded hex), typography scale, spacing scale, token hierarchy |
| **State management** | BlocBuilder/Provider/Redux patterns, loading/error/empty states, parameterized widgets, data models, repository stubs |
| **Navigation** | Route registration, bottom nav with persistence, deep links, Hero transitions, back behavior |
| **Responsive** | LayoutBuilder/MediaQuery breakpoints, adaptive widths, EdgeInsetsDirectional for RTL |
| **Accessibility** | InkWell/Pressable, semanticLabel, 48x48 touch targets, MergeSemantics, ExcludeSemantics, accessibilityRole |
| **Platform** | SafeArea, SystemUiOverlayStyle, keyboard avoidance, pull-to-refresh, platform-specific code |
| **Performance** | const constructors, ListView.builder, FlatList optimization, CachedNetworkImage, RepaintBoundary, tree depth |
| **Edge cases** | Text overflow (maxLines/ellipsis), empty lists, image fallbacks, single-item, network failure |
| **Animation** | InkWell tap feedback, Hero transitions, page transitions, Reanimated |
| **Data layer** | Data models from design, repository interfaces, API stubs, error handling |
| **Error boundaries** | Feature-level crash boundaries, error fallback UI |
| **Theme** | ThemeData/ColorScheme, dark/light mode, ThemeExtension for custom tokens |
| **Lists** | Builder pattern, virtualization, FlashList, getItemLayout, empty/loading states |

---

## The Core Loop (Everything Serves This)

```
        ┌─────────────────────────────────────────────┐
        │                                             │
        │   READ design top-down (full context)       │
        │   ├─ Screen structure                       │
        │   ├─ Section relationships                  │
        │   ├─ Semantic patterns (WHAT things ARE)    │
        │   ├─ Dynamic vs static content              │
        │   └─ Flag unclear → ASK user                │
        │                                             │
        │              │                              │
        │              ▼                              │
        │                                             │
        │   BUILD bottom-up (≤10K tokens each)        │
        │   For each component:                       │
        │   ┌──────────────────────────┐              │
        │   │ 1. Read spec + screenshot│              │
        │   │ 2. Check EVERY property  │              │
        │   │ 3. Build with exact values│             │
        │   │ 4. Capture screenshot    │              │
        │   │ 5. Compare to Figma      │──→ Match?    │
        │   │ 6. Structured diff       │    │         │
        │   │ 7. Fix mismatches        │  No│  Yes    │
        │   │ 8. Re-verify (max 3x)    │◄───┘   │    │
        │   └──────────────────────────┘         │    │
        │                                        │    │
        │                                   Lock ✅   │
        │                                        │    │
        │              ▼                              │
        │                                             │
        │   ASSEMBLE verified children → parent       │
        │   Verify parent against parent screenshot   │
        │                                             │
        │              ▼                              │
        │                                             │
        │   HARDEN for production                     │
        │   ├─ Responsive (320px → tablet)            │
        │   ├─ Accessibility (touch targets, labels)  │
        │   ├─ State + data (models, repos, states)   │
        │   ├─ Navigation (routes, deep links)        │
        │   ├─ Edge cases (overflow, empty, errors)   │
        │   ├─ Theme (ThemeData, dark mode ready)     │
        │   └─ Performance (const, builder, cache)    │
        │                                             │
        │              ▼                              │
        │                                             │
        │   SHIP — production-ready code              │
        │                                             │
        └─────────────────────────────────────────────┘
```

---

## File Structure

```
figma-to-code-plugin/                         3,267 lines across 12 source files
├── src/
│   ├── api.js                    (51 lines)  Figma REST API client
│   ├── tree-walker.js           (180 lines)  Structure + smart chunking
│   ├── component-detector.js     (52 lines)  Reusable component detection
│   ├── token-extractor.js       (215 lines)  ALL design token categories
│   ├── asset-exporter.js        (202 lines)  Smart-filtered icon/image export
│   ├── blueprint-writer.js      (146 lines)  Blueprint.md generation
│   ├── chunk-writer.js          (485 lines)  Comprehensive style capture
│   └── figma-extract.js         (228 lines)  CLI orchestration
├── skills/
│   └── figma-to-code/
│       ├── SKILL.md             (795 lines)  The skill prompt (6 principles + 7 phases)
│       └── references/
│           ├── flutter.md       (349 lines)  Flutter prod patterns
│           ├── react.md         (251 lines)  React/Next.js prod patterns
│           └── react-native.md  (313 lines)  React Native/Expo prod patterns
├── test/                                     Unit tests for each module
├── PLAN.md                                   This file
├── package.json
└── README.md
```

---

## Commit History (25 commits, newest first)

```
17776f3 feat: read top-down / build bottom-up with 10K token chunking rule
1e0383c docs: elaborate core philosophy — principal engineer mindset, non-negotiable principles
95d78ca feat: production hardening — responsive, a11y, state, data, navigation, edge cases
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

---

## Key Decisions

| Decision | Why |
|----------|-----|
| REST API over MCP | MCP truncates at ~10K tokens, rate-limited. REST returns full tree in one call. |
| ≤10K tokens per buildable unit | Ensures full spec + screenshot + code fit in context. No property dropped. |
| Smart asset filtering | 1,562 junk sub-paths → 13 real icons. Filter by type, size, naming. |
| Zero silent style drops | Every Figma property captured: gradients with angles, squircle corners, absolute positioning, text truncation, mixed styles, masks, etc. |
| Read top-down, build bottom-up | Reading captures context (what things ARE). Building ensures precision (each piece verified). |
| Atomic build-verify-iterate | Build one → screenshot → compare → fix → re-verify. Never ship unverified. |
| Claude Vision as comparator | Pixel-diff fails on font/AA differences. Claude understands semantic differences. |
| Semantic mapping before code | Without it, tabs→buttons, lists→columns. 10 minutes prevents hours of rework. |
| Never-hallucinate rule | Guessing produces wrong output. ASK when unclear. FLAG when missing. |
| Production hardening phase | Figma is 40% of prod code. The other 60%: responsive, a11y, state, data, nav, edge cases. |
| Error recovery everywhere | Skill getting stuck wastes time. Always explain, suggest alternatives, move forward. |
| 3 framework references | Flutter, React, React Native — each with prod patterns, not just Figma mapping. |

---

## What's Next

| Priority | Task | Purpose |
|----------|------|---------|
| **P0** | End-to-end test on a real Figma screen | Validate the full pipeline with all fixes actually produces matching output |
| **P1** | Golden test infrastructure | Flutter golden tests with custom font loading + threshold comparator for atomic verification |
| **P2** | P1 property gaps | Grid layout, relativeTransform, booleanOperation, arcData, list formatting, Figma variables |
| **P3** | Multi-screen support | Navigation graph extraction, screen-to-screen transitions, shared element detection |
