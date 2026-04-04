# Figma to Code v2

> **The open-source Figma-to-code plugin that actually works on real designs.**

Turn any Figma design into production-ready **React**, **React Native**, or **Flutter** code — at **95% visual fidelity** — with zero data loss, per-component verification, and production hardening built in.

**No more "close enough." No more build-and-pray.**

[![Open Source](https://img.shields.io/badge/Open_Source-MIT-green)](LICENSE)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-Plugin-7B61FF)](https://github.com/bazingga08/figma-to-code)
[![Figma REST API](https://img.shields.io/badge/Figma-REST_API-FF7262)](https://www.figma.com/developers/api)

---

## What Does This Do? (The Simple Version)

Imagine you drew a beautiful app screen in Figma — buttons, colors, fonts, icons, everything laid out perfectly.

Now someone needs to turn that drawing into actual code that runs on a phone or browser. Normally a developer would stare at the design, try to manually copy every color and spacing value, miss a bunch of details, and end up with code that looks "close but not quite right."

**This plugin does all of that automatically — and gets it 95% right.**

It reads every single detail from your Figma design, organizes it into neat chunks, and then builds the code piece by piece — checking each piece against the original design before moving on.

---

## The Big Picture — End to End Flow

```mermaid
flowchart LR
    A[Figma Link] --> B[EXTRACT<br/>Node.js Script]
    B --> C[.figma-extract<br/>specs + screenshots<br/>+ assets + tokens]
    C --> D[UNDERSTAND<br/>Claude reads everything]
    D --> E[BUILD + VERIFY<br/>one piece at a time]
    E --> F[HARDEN<br/>responsive, a11y,<br/>states, edge cases]
    F --> G[Production<br/>Code]

    style A fill:#5B4BC9,color:#ffffff,stroke:#3d2d99,stroke-width:2px
    style B fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style C fill:#D4851F,color:#ffffff,stroke:#b06b10,stroke-width:2px
    style D fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style E fill:#1A73C7,color:#ffffff,stroke:#0f5499,stroke-width:2px
    style F fill:#9C3DBF,color:#ffffff,stroke:#7a2d96,stroke-width:2px
    style G fill:#0E8C6E,color:#ffffff,stroke:#066b52,stroke-width:2px
```

---

## How It Works — Two Stages

### Stage 1: Extract Everything From Figma

Before writing a single line of code, a Node.js script reads the **ENTIRE** Figma design via REST API — every layer, every property, every asset.

```mermaid
flowchart TD
    LINK[Figma Link - paste your URL] --> API[Figma REST API<br/>fetches FULL design tree in 1 call]

    API --> S1[Step 1 - FETCH<br/>Complete node tree<br/>100K-300K+ tokens]
    API --> S2[Step 2 - ANALYZE<br/>Hierarchy, nesting,<br/>build order]
    API --> S3[Step 3 - DETECT<br/>Reusable components<br/>build once, reuse many]
    API --> S4[Step 4 - EXTRACT<br/>Design tokens: colors,<br/>fonts, spacing, shadows]
    API --> S5[Step 5 - EXPORT<br/>Icons as SVG +<br/>Images as PNG]
    API --> S6[Step 6 - CHUNK<br/>Split into 10K-token<br/>buildable pieces]

    S1 --> OUT
    S2 --> OUT
    S3 --> OUT
    S4 --> OUT
    S5 --> OUT
    S6 --> OUT

    OUT[.figma-extract/ folder]

    OUT --> F1[blueprint.md<br/>Master plan + build order]
    OUT --> F2[chunks/<br/>Per-component specs]
    OUT --> F3[screenshots/<br/>Visual references]
    OUT --> F4[assets/icons/ + images/<br/>SVGs + PNGs]
    OUT --> F5[reusables/<br/>Shared components]
    OUT --> F6[raw/<br/>Source-of-truth JSON]

    style LINK fill:#5B4BC9,color:#ffffff,stroke:#3d2d99,stroke-width:2px
    style API fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style OUT fill:#D4851F,color:#ffffff,stroke:#b06b10,stroke-width:2px
    style S1 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style S2 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style S3 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style S4 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style S5 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style S6 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F1 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F2 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F3 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F4 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F5 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style F6 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
```

### Stage 2: Build the Code (7 Phases)

Claude reads the extracted specs and builds production code — not all at once, but one verified piece at a time.

```mermaid
flowchart TD
    P0[Phase 0 - DETECT<br/>What framework? What existing<br/>components / theme / patterns?] --> P1

    P1[Phase 1 - EXTRACT<br/>Run the Node.js extractor<br/>Full design to .figma-extract/] --> P2

    P2[Phase 2 - READ<br/>Read blueprint top-down<br/>Screen, Sections, Components<br/>Understand the BIG PICTURE] --> P25

    P25[Phase 2.5 - UNDERSTAND<br/>Semantic mapping:<br/>This is a tab bar, not buttons<br/>This list is scrollable<br/>This data is dynamic] --> P3

    P3[Phase 3 - BUILD + VERIFY<br/>Bottom-up, one piece at a time<br/>See verification loop below] --> P4

    P4[Phase 4 - RULES<br/>95% fidelity checklist<br/>50 items per component<br/>Every property verified] --> P5

    P5[Phase 5 - HARDEN<br/>Responsive + Accessibility<br/>States + Data + Navigation<br/>Edge cases + Performance] --> P6

    P6[Phase 6 - CHECKPOINT<br/>Show user everything built<br/>List deviations + concerns<br/>Get approval before shipping]

    style P0 fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style P1 fill:#D4851F,color:#ffffff,stroke:#b06b10,stroke-width:2px
    style P2 fill:#1A73C7,color:#ffffff,stroke:#0f5499,stroke-width:2px
    style P25 fill:#8E44AD,color:#ffffff,stroke:#6C3483,stroke-width:2px
    style P3 fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style P4 fill:#C49000,color:#ffffff,stroke:#9a7200,stroke-width:2px
    style P5 fill:#0E8C6E,color:#ffffff,stroke:#066b52,stroke-width:2px
    style P6 fill:#C0392B,color:#ffffff,stroke:#96281B,stroke-width:2px
```

### The Verification Loop (The Secret Sauce)

This is what makes the output accurate. Every single component goes through this loop before it's considered done:

```mermaid
flowchart TD
    START[Pick next component<br/>smallest first, bottom-up] --> READ

    READ[1. Read the SPEC<br/>Extract every property into<br/>a construction blueprint] --> CODE

    CODE[2. Write the CODE<br/>Every line maps to a<br/>blueprint property] --> SCREENSHOT

    SCREENSHOT[3. Take a SCREENSHOT<br/>of what we just built] --> COMPARE

    COMPARE[4. COMPARE to Figma<br/>screenshot side-by-side] --> MATCH

    MATCH{Does it<br/>match?}

    MATCH -->|Yes| LOCK[LOCKED<br/>Component verified.<br/>Move to next piece.]

    MATCH -->|No| DIFF[5. Generate STRUCTURED DIFF<br/>Padding off by 4px<br/>Wrong border radius<br/>Missing shadow]

    DIFF --> FIX[6. FIX each mismatch<br/>using exact spec values]

    FIX --> COUNT{Tried<br/>3 times?}

    COUNT -->|No| SCREENSHOT
    COUNT -->|Yes| ASK[Ask user:<br/>These differences remain.<br/>Keep going or fix manually?]

    LOCK --> NEXT[Next component<br/>or assemble parent]

    style START fill:#5B4BC9,color:#ffffff,stroke:#3d2d99,stroke-width:2px
    style LOCK fill:#0E8C6E,color:#ffffff,stroke:#066b52,stroke-width:2px
    style MATCH fill:#C49000,color:#ffffff,stroke:#9a7200,stroke-width:2px
    style ASK fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style NEXT fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style READ fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style CODE fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style SCREENSHOT fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style COMPARE fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style DIFF fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style FIX fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style COUNT fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
```

### Read Top-Down, Build Bottom-Up

This is a critical concept — the system reads the design like a book (big picture first), but builds like LEGOs (small pieces first):

```mermaid
flowchart TD
    subgraph READ [READING - Top-Down]
        direction TB
        R1[Full Screen] --> R2[Sections]
        R2 --> R3[Components]
        R3 --> R4[Leaves: buttons, text, icons]
    end

    subgraph BUILD [BUILDING - Bottom-Up]
        direction BT
        B4[Leaves: buttons, text, icons] --> B3[Components]
        B3 --> B2[Sections]
        B2 --> B1[Full Screen]
    end

    READ --> BUILD

    style READ fill:#1A73C7,color:#ffffff,stroke:#0f5499,stroke-width:2px
    style BUILD fill:#D4851F,color:#ffffff,stroke:#b06b10,stroke-width:2px
    style R1 fill:#ffffff,color:#1a1a2e,stroke:#1A73C7,stroke-width:1.5px
    style R2 fill:#ffffff,color:#1a1a2e,stroke:#1A73C7,stroke-width:1.5px
    style R3 fill:#ffffff,color:#1a1a2e,stroke:#1A73C7,stroke-width:1.5px
    style R4 fill:#ffffff,color:#1a1a2e,stroke:#1A73C7,stroke-width:1.5px
    style B1 fill:#ffffff,color:#1a1a2e,stroke:#D4851F,stroke-width:1.5px
    style B2 fill:#ffffff,color:#1a1a2e,stroke:#D4851F,stroke-width:1.5px
    style B3 fill:#ffffff,color:#1a1a2e,stroke:#D4851F,stroke-width:1.5px
    style B4 fill:#ffffff,color:#1a1a2e,stroke:#D4851F,stroke-width:1.5px
```

**Why?** Reading top-down gives you context ("this is a settings page with 3 sections"). Building bottom-up gives you precision ("this button is exactly 44px tall with 12px padding and #7B61FF background"). Context prevents mistakes. Precision prevents "close enough."

---

## Why This Is Different (Key Differentiators)

### The Core Problem Everyone Else Gets Wrong

```mermaid
flowchart LR
    subgraph OLD [Other Tools]
        direction TB
        O1[Read SOME of<br/>the design<br/>3-10%] --> O2[Build<br/>EVERYTHING<br/>at once] --> O3[Hope it<br/>matches<br/>it never does]
    end

    subgraph NEW [Figma-to-Code v2]
        direction TB
        N1[Read 100%<br/>of the design<br/>every property] --> N2[Build ONE<br/>piece at a time<br/>verify each] --> N3[95% match<br/>guaranteed<br/>checked per component]
    end

    style OLD fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style NEW fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style O1 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style O2 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style O3 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style N1 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
    style N2 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
    style N3 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
```

### 5 Things That Make This Work Where Others Fail

#### 1. Zero Data Loss

| What happens | Other tools | This plugin |
|---|---|---|
| Design size | Truncated at ~10K tokens | Full tree fetched (100K-300K+) |
| Style properties | Silently drops borderRadius, shadows, letterSpacing, gradients... | Captures **every** Figma property (~50+ categories) |
| Assets | One-by-one, often fails | Batch exported, smart-filtered |

> **Real example:** A typical app screen has 1,500-2,000 nodes. MCP tools see ~100 of them. This plugin sees all 2,000.

#### 2. Verification Loop (Not "Build and Pray")

Every other tool builds the code and hopes for the best. This plugin **screenshots what it built**, compares it to the Figma screenshot, finds every mismatch, and fixes them — up to 3 times per component. Nothing ships unverified.

#### 3. Semantic Understanding

Other tools see "4 rectangles in a row." This plugin understands "that's a tab bar." Why does it matter?

- Tab bar → proper `TabBar` widget with navigation state
- 4 rectangles → 4 hardcoded `Container` widgets that do nothing

This difference is the gap between a screenshot and real software.

#### 4. Smart Asset Filtering

A typical Figma design has ~1,500 vector nodes. Only ~15-30 are actual icons. Other tools try to export all 1,500 (and fail). This plugin uses smart filtering:

- Only exports `INSTANCE`, `FRAME`, or `STAR` nodes at icon sizes (12-48px)
- Skips junk: `Vector`, `Rectangle`, `Line`, `Ellipse`, `path*`, `Union`, `Group`
- Deduplicates by name
- Result: 1,500 junk nodes → 15-30 clean icon SVGs

#### 5. Production Hardening

Figma shows 1 screen size, with perfect data, in a happy state. Real apps need:

```mermaid
flowchart TD
    FIGMA[What Figma shows:<br/>375px wide, perfect data,<br/>happy path only] --> GAP[THE GAP<br/>60% of production code<br/>is not visible in Figma]

    GAP --> H1[Responsive<br/>320px phone to 768px tablet<br/>Flexible widths, not hardcoded]
    GAP --> H2[Accessibility<br/>48x48 touch targets<br/>Screen reader labels<br/>RTL language support]
    GAP --> H3[States<br/>Loading spinners<br/>Error messages<br/>Empty list placeholders]
    GAP --> H4[Data Layer<br/>Data models from design<br/>Repository interfaces<br/>API stubs]
    GAP --> H5[Edge Cases<br/>Super long text, truncation<br/>Empty lists, placeholder<br/>Image 404, fallback]

    style FIGMA fill:#5B4BC9,color:#ffffff,stroke:#3d2d99,stroke-width:2px
    style GAP fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style H1 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style H2 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style H3 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style H4 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
    style H5 fill:#ffffff,color:#1a1a2e,stroke:#4a5568,stroke-width:1.5px
```

---

## The 95% Fidelity Checklist (~50 items)

Every component is checked against this before being marked done:

```mermaid
flowchart TD
    CHECK[95% Fidelity Check<br/>per component]

    CHECK --> LAYOUT[Spacing and Layout - 12 items<br/>Direction, padding all 4 sides, gap,<br/>sizing modes, alignment, flex/grow,<br/>wrap, absolute pos, min/max, clip, scroll]

    CHECK --> TYPE[Typography - 15 items<br/>Font family, weight, size, italic,<br/>line height, letter spacing, color,<br/>text case, decoration, alignment,<br/>auto-resize, truncation, mixed styles]

    CHECK --> COLOR[Color and Surface - 20+ items<br/>Fills solid + gradients, opacity,<br/>border weight/color/align/radius,<br/>corner smoothing, stroke cap/join/dash,<br/>drop + inner shadow, blur, blend, rotation]

    CHECK --> MASK[Masks and Clipping<br/>Clip shapes, masked images,<br/>custom vector shapes]

    CHECK --> SEMANTIC[Semantic Correctness<br/>Component type matches intent,<br/>proper interactive patterns,<br/>builder pattern for lists]

    CHECK --> ZINDEX[Z-Index and Layering<br/>Stack order, absolute positioning,<br/>glow/blur behind content,<br/>fixed headers above scroll]

    CHECK --> ASSETS[Assets and Images<br/>All icons from extracted SVGs,<br/>no substitutes, correct scale mode,<br/>image filters + rotation]

    style CHECK fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style LAYOUT fill:#ffffff,color:#1a1a2e,stroke:#1A73C7,stroke-width:2px
    style TYPE fill:#ffffff,color:#1a1a2e,stroke:#8E44AD,stroke-width:2px
    style COLOR fill:#ffffff,color:#1a1a2e,stroke:#D4851F,stroke-width:2px
    style MASK fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:2px
    style SEMANTIC fill:#ffffff,color:#1a1a2e,stroke:#C0392B,stroke-width:2px
    style ZINDEX fill:#ffffff,color:#1a1a2e,stroke:#C49000,stroke-width:2px
    style ASSETS fill:#ffffff,color:#1a1a2e,stroke:#0E8C6E,stroke-width:2px
```

---

## The 9 Non-Negotiable Rules

| # | Rule | What It Means |
|---|------|---------------|
| 1 | **Every Value From the Spec** | `padding: 12px 8px 12px 16px` in Figma = exactly that in code. Not "about 12px." |
| 2 | **Never Hallucinate** | Missing icon? Says "missing." Unclear layout? Asks you. Never guesses. |
| 3 | **Understand Before Building** | Reads the entire design first. Knows "that's a tab bar" before writing code. |
| 4 | **Verify Every Component** | Build -> screenshot -> compare -> fix -> re-verify. Every piece. |
| 5 | **Read Top-Down, Build Bottom-Up** | Context from reading + precision from building = no errors compound. |
| 6 | **Think Like a Senior Engineer** | Responsive, accessible, stateful, data-ready — not just visual. |
| 7 | **Spec-First, Screenshot-Second** | Exact numbers from specs. Screenshots only catch what specs missed. |
| 8 | **Construction Blueprint** | Before coding, list every property. Every code line maps to a property. |
| 9 | **Asset Cross-Reference** | Before building, check every icon/image file exists. No fake placeholders ever. |

---

## What It Captures From Figma

The extractor reads **every** style property Figma stores:

| Category | Properties |
|----------|-----------|
| **Layout** | Direction, padding (all 4 sides), gap, alignment (both axes), wrap, absolute positioning, constraints, min/max sizes, overflow, clipping |
| **Colors** | Solid fills, linear/radial/angular/diamond gradients (angle + stops), fill opacity, node opacity |
| **Typography** | Font family, weight, size, italic, line height, letter spacing, color, text case, decoration, alignment, auto-resize, truncation, max lines, paragraph spacing, mixed styles |
| **Borders** | Weight (per-side), color, alignment (inside/center/outside), cap, join, dash pattern, radius (all 4 corners), corner smoothing (squircle) |
| **Effects** | Drop shadow, inner shadow (offset, blur, spread, color), layer blur, backdrop blur |
| **Assets** | Icons (smart-filtered SVGs), images (PNG from Figma image fills) |
| **Other** | Blend mode, rotation, visibility, masks, component instances, design tokens |

---

## Why Not Just Use Figma MCP?

The official Figma MCP server is great for small components. But on real production screens, it hits a wall. Here's exactly why:

### The Token Wall Problem

```mermaid
flowchart LR
    DESIGN[Your Figma Screen<br/>100K-350K tokens<br/>of design data] --> MCP

    subgraph MCP [Figma MCP Server]
        direction TB
        M1[get_design_context<br/>25K token hard limit]
        M1 --> TRUNC[TRUNCATION<br/>Silently drops:<br/>Gradient angles<br/>Individual corner radii<br/>Mixed text styles<br/>Deep nested layers<br/>Shadow spread values<br/>Mask properties<br/>Blend modes]
    end

    subgraph REST [This Plugin - REST API]
        direction TB
        R1[Figma REST API<br/>No token limit]
        R1 --> FULL[COMPLETE DATA<br/>Every property captured:<br/>All 50+ style categories<br/>Raw JSON preserved<br/>Zero silent drops]
    end

    DESIGN --> REST

    MCP --> OUT1[40-60% of your<br/>design data<br/>best case: 70-85%<br/>with chunked refetches]

    REST --> OUT2[100% of your<br/>design data<br/>raw JSON backup<br/>for edge cases]

    style DESIGN fill:#5B4BC9,color:#ffffff,stroke:#3d2d99,stroke-width:2px
    style MCP fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style REST fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style M1 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style TRUNC fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:2px
    style R1 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
    style FULL fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:2px
    style OUT1 fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style OUT2 fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
```

### Head-to-Head Comparison

| | Figma MCP Server | This Plugin (REST API) |
|---|---|---|
| **Data completeness** | 40-60% (truncated at ~25K tokens) | **100%** (no token limit) |
| **API calls per screen** | 8-21 calls (metadata + chunked refetches) | **3-5 calls** (full tree in 1) |
| **Rate limits** | Starter: 6/month. Pro: 200/day | Standard Figma API limits (generous) |
| **Output format** | React+Tailwind only (you translate) | **Raw JSON** (works with any framework) |
| **Gradient details** | Truncated on complex designs | Exact angle, stops, positions |
| **Corner radii** | Often drops individual corners | All 4 corners + smoothing (squircle) |
| **Mixed text styles** | Truncated on deeply nested nodes | Full characterStyleOverrides |
| **Masks & blend modes** | Dropped on inner layers | Fully captured |
| **Shadow spread** | Dropped on non-primary shadows | All shadows with all 5 values |
| **Absolute positioning** | Lost on deeply nested layers | Exact x,y coordinates preserved |
| **Asset export** | One-by-one (slow, error-prone) | **Batch export** (smart-filtered) |
| **Component detection** | Agent guesses from truncated data | **Pre-analyzed** by script |
| **Verification** | None — build and hope | **Per-component screenshot loop** |
| **Production hardening** | None | Responsive, a11y, states, data, nav |
| **Frameworks** | React+Tailwind (then translate) | **React, React Native, Flutter** natively |
| **Cost** | Free with Figma seat | Free and open source |

### What Properties Get Lost With MCP?

When MCP truncates (and it always does on real screens), here's what silently disappears:

```mermaid
flowchart TD
    subgraph LOST [Properties MCP Silently Drops]
        direction TB
        L1[Gradient stop details<br/>angles, exact positions]
        L2[Individual corner radii<br/>squircle / corner smoothing]
        L3[Mixed text styles<br/>bold word inside normal text]
        L4[Deep nested absolute positions<br/>x,y coordinates lost]
        L5[Mask and clip properties]
        L6[Blend modes on inner layers]
        L7[Shadow spread values<br/>on secondary shadows]
        L8[Stroke dash patterns<br/>and individual widths]
    end

    subgraph KEPT [What This Plugin Captures]
        direction TB
        K1[ALL of the above +<br/>50+ property categories]
        K2[Raw JSON backup for<br/>every single node]
        K3[Property audit report<br/>flags anything unhandled]
    end

    style LOST fill:#D94452,color:#ffffff,stroke:#b52d3a,stroke-width:2px
    style KEPT fill:#2D8E47,color:#ffffff,stroke:#1e6b33,stroke-width:2px
    style L1 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L2 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L3 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L4 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L5 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L6 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L7 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style L8 fill:#ffffff,color:#1a1a2e,stroke:#D94452,stroke-width:1.5px
    style K1 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
    style K2 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
    style K3 fill:#ffffff,color:#1a1a2e,stroke:#2D8E47,stroke-width:1.5px
```

### The Real-World Impact

> A typical production screen: **1,500-2,000 Figma nodes**, **100K-350K tokens** of data.
>
> - **MCP** sees 40-60% of nodes, loses subtle properties, requires 8-21 API calls, outputs React+Tailwind you must translate.
> - **This plugin** sees 100% of nodes, captures every property, needs 3-5 API calls, outputs native code for your framework.
>
> The difference is visible. Designers can tell.

### But I Like Figma MCP for Small Components...

That's fine! This plugin is designed for **real production screens** where MCP breaks down. Use MCP for quick component lookups. Use this plugin when accuracy matters.

### vs Other Figma-to-Code Tools

| Tool | Approach | Limitation |
|---|---|---|
| **Figma MCP** | MCP protocol, ~25K token limit | Truncates real designs, no verification |
| **Figma Make** | Figma-native prompt-to-app | Prototyping focus, not production code |
| **Locofy.ai** | Figma plugin, React/HTML | No verification loop, limited frameworks |
| **Builder.io** | Visual editor + Figma import | Different paradigm (visual CMS), not code-first |
| **Kombai** | AI agent, Figma-to-React | No raw data extraction, limited to React |
| **This plugin** | REST API extraction + Claude Code | **100% data, verified per-component, 3 frameworks, production-hardened, open source** |

---

## Setup

### 1. Install the Plugin

```bash
/plugin install <your-org>/figma-to-code-plugin
```

### 2. Set Your Figma Token

Go to **Figma -> Settings -> Account -> Personal access tokens** -> Generate one.

```bash
export FIGMA_ACCESS_TOKEN=figd_xxxxx
```

Add to your shell profile (`~/.zshrc` or `~/.bashrc`) so it persists.

**Important:** You need a Figma **Pro plan** with a **Full** or **Dev** seat. View/Collab seats hit API rate limits.

### 3. Use It

```
Build this: https://figma.com/design/abc123/MyProject?node-id=1-2
```

Or:

```
/figma-to-code https://figma.com/design/abc123/MyProject?node-id=1-2
```

---

## Optional: Project Configuration

Add to your project's `CLAUDE.md` to skip framework detection:

```markdown
## Figma-to-Code Config
- **Framework**: Next.js 14
- **Styling**: CSS Modules
- **Theme file**: `src/theme/theme.css`
- **Assets directory**: `src/assets/`
- **Components directory**: `src/components/`
- **Reusable components**: Button, Modal, Card, Input
```

---

## Project Structure

```
figma-to-code/
|
|-- src/                              The extraction engine
|   |-- figma-extract.js              Entry point - orchestrates all 6 steps
|   |-- api.js                        Figma REST API client
|   |-- tree-walker.js                Analyzes hierarchy + chunks into 10K pieces
|   |-- component-detector.js         Finds reusable components
|   |-- token-extractor.js            Extracts all design tokens
|   |-- asset-exporter.js             Smart icon/image export (filters junk)
|   |-- blueprint-writer.js           Generates the master blueprint
|   |-- chunk-writer.js               Writes detailed per-component specs
|
|-- skills/figma-to-code/
|   |-- SKILL.md                      The brain - 9 rules + 7 phases
|   |-- references/
|       |-- flutter.md                Flutter production patterns
|       |-- react.md                  React/Next.js production patterns
|       |-- react-native.md           React Native/Expo production patterns
|
|-- test/                             Unit tests
|-- PLAN.md                           Architecture and design decisions
|-- README.md                         This file
```

---

## Error Handling

The system never silently fails:

| Problem | What Happens |
|---------|-------------|
| Extraction fails | Tells you exactly why (bad token? wrong permissions? invalid URL?) |
| Component won't build | Shows the spec + screenshot, asks what to do |
| Verification fails 3x | Lists remaining mismatches, asks to continue or fix manually |
| Asset missing | `// TODO: missing icon` comment, tells you which one, continues |
| Spec ambiguous | Shows spec data + screenshot side by side, asks which to follow |
| Unexpected error | Captures error, explains context, suggests alternatives |

---

## FAQ

**Q: How accurate is it?**
A: Targets 95% visual fidelity. Every component goes through a ~50-item checklist and is screenshot-verified against the Figma original.

**Q: What frameworks?**
A: React (Next.js / Vite / CRA), React Native (Expo / bare), Flutter. Each has a dedicated reference file with framework-specific production patterns.

**Q: What if my design is huge?**
A: That's exactly why v2 exists. REST API fetches the full tree regardless of size, then chunks into manageable pieces. No data lost.

**Q: Does it just copy pixels?**
A: No. It builds production code with responsive layout, accessibility, state management, data models, navigation, and edge case handling.

**Q: What if an icon doesn't export?**
A: Flags it with a TODO comment and tells you. Never substitutes with Material Icons or placeholders.
