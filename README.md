# Figma to Code v2

**Turn any Figma design into real, production-ready code — automatically.**

Works with **React**, **React Native**, and **Flutter**.

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
    A["Figma Link"] --> B["EXTRACT
    (Node.js Script)"]
    B --> C[".figma-extract/
    specs + screenshots
    + assets + tokens"]
    C --> D["UNDERSTAND
    (Claude reads everything)"]
    D --> E["BUILD + VERIFY
    (one piece at a time)"]
    E --> F["HARDEN
    (responsive, a11y,
    states, edge cases)"]
    F --> G["Production
    Code"]

    style A fill:#7B61FF,color:#fff
    style B fill:#FF6B6B,color:#fff
    style C fill:#FFA94D,color:#fff
    style D fill:#51CF66,color:#fff
    style E fill:#339AF0,color:#fff
    style F fill:#CC5DE8,color:#fff
    style G fill:#20C997,color:#fff
```

---

## How It Works — Two Stages

### Stage 1: Extract Everything From Figma

Before writing a single line of code, a Node.js script reads the **ENTIRE** Figma design via REST API — every layer, every property, every asset.

```mermaid
flowchart TD
    LINK["Figma Link (paste URL)"] --> API["Figma REST API
    (fetches FULL design tree in 1 call)"]

    API --> S1["1. FETCH
    Complete node tree
    (100K-300K+ tokens)"]
    API --> S2["2. ANALYZE
    Hierarchy, nesting,
    build order"]
    API --> S3["3. DETECT
    Reusable components
    (build once, reuse many)"]
    API --> S4["4. EXTRACT
    Design tokens: colors,
    fonts, spacing, shadows"]
    API --> S5["5. EXPORT
    Icons (SVG) +
    Images (PNG)"]
    API --> S6["6. CHUNK
    Split into ~10K-token
    buildable pieces"]

    S1 --> OUT
    S2 --> OUT
    S3 --> OUT
    S4 --> OUT
    S5 --> OUT
    S6 --> OUT

    OUT[".figma-extract/ folder"]

    OUT --> F1["blueprint.md
    Master plan + build order"]
    OUT --> F2["chunks/
    Per-component specs"]
    OUT --> F3["screenshots/
    Visual references"]
    OUT --> F4["assets/icons/ + images/
    SVGs + PNGs"]
    OUT --> F5["reusables/
    Shared components"]
    OUT --> F6["raw/
    Source-of-truth JSON"]

    style LINK fill:#7B61FF,color:#fff
    style API fill:#FF6B6B,color:#fff
    style OUT fill:#FFA94D,color:#fff
    style S1 fill:#f8f9fa,stroke:#dee2e6
    style S2 fill:#f8f9fa,stroke:#dee2e6
    style S3 fill:#f8f9fa,stroke:#dee2e6
    style S4 fill:#f8f9fa,stroke:#dee2e6
    style S5 fill:#f8f9fa,stroke:#dee2e6
    style S6 fill:#f8f9fa,stroke:#dee2e6
```

### Stage 2: Build the Code (7 Phases)

Claude reads the extracted specs and builds production code — not all at once, but one verified piece at a time.

```mermaid
flowchart TD
    P0["Phase 0: DETECT
    What framework? What existing
    components/theme/patterns?"] --> P1

    P1["Phase 1: EXTRACT
    Run the Node.js extractor
    Full design -> .figma-extract/"] --> P2

    P2["Phase 2: READ
    Read blueprint top-down
    Screen -> Sections -> Components
    Understand the BIG PICTURE"] --> P25

    P25["Phase 2.5: UNDERSTAND
    Semantic mapping:
    'This is a tab bar, not buttons'
    'This list is scrollable'
    'This data is dynamic'
    Ask user if anything unclear"] --> P3

    P3["Phase 3: BUILD + VERIFY
    Bottom-up, one piece at a time
    (see verification loop below)"] --> P4

    P4["Phase 4: RULES
    95% fidelity checklist
    ~50 items per component
    Every property verified"] --> P5

    P5["Phase 5: HARDEN
    Responsive + Accessibility +
    States + Data + Navigation +
    Edge cases + Performance"] --> P6

    P6["Phase 6: CHECKPOINT
    Show user everything built
    List deviations + concerns
    Get approval before shipping"]

    style P0 fill:#e8f5e9,stroke:#4caf50
    style P1 fill:#fff3e0,stroke:#ff9800
    style P2 fill:#e3f2fd,stroke:#2196f3
    style P25 fill:#f3e5f5,stroke:#9c27b0
    style P3 fill:#ffebee,stroke:#f44336
    style P4 fill:#fff8e1,stroke:#ffc107
    style P5 fill:#e0f2f1,stroke:#009688
    style P6 fill:#fce4ec,stroke:#e91e63
```

### The Verification Loop (The Secret Sauce)

This is what makes the output accurate. Every single component goes through this loop before it's considered done:

```mermaid
flowchart TD
    START["Pick next component
    (smallest first — bottom-up)"] --> READ

    READ["1. Read the SPEC
    Extract every property into
    a construction blueprint"] --> CODE

    CODE["2. Write the CODE
    Every line maps to a
    blueprint property"] --> SCREENSHOT

    SCREENSHOT["3. Take a SCREENSHOT
    of what we just built"] --> COMPARE

    COMPARE["4. COMPARE to Figma
    screenshot side-by-side"] --> MATCH

    MATCH{"Does it
    match?"}

    MATCH -->|"Yes"| LOCK["LOCK
    Component verified.
    Move to next piece."]

    MATCH -->|"No"| DIFF["5. Generate STRUCTURED DIFF
    - Padding off by 4px
    - Wrong border radius
    - Missing shadow"]

    DIFF --> FIX["6. FIX each mismatch
    using exact spec values"]

    FIX --> COUNT{"Tried
    3 times?"}

    COUNT -->|"No"| SCREENSHOT
    COUNT -->|"Yes"| ASK["Ask user:
    'These differences remain.
    Keep going or fix manually?'"]

    LOCK --> NEXT["Next component
    (or assemble parent)"]

    style START fill:#7B61FF,color:#fff
    style LOCK fill:#20C997,color:#fff
    style MATCH fill:#FFA94D,color:#fff
    style ASK fill:#FF6B6B,color:#fff
    style READ fill:#f8f9fa,stroke:#dee2e6
    style CODE fill:#f8f9fa,stroke:#dee2e6
    style SCREENSHOT fill:#f8f9fa,stroke:#dee2e6
    style COMPARE fill:#f8f9fa,stroke:#dee2e6
    style DIFF fill:#f8f9fa,stroke:#dee2e6
    style FIX fill:#f8f9fa,stroke:#dee2e6
    style COUNT fill:#f8f9fa,stroke:#dee2e6
    style NEXT fill:#e8f5e9,stroke:#4caf50
```

### Read Top-Down, Build Bottom-Up

This is a critical concept — the system reads the design like a book (big picture first), but builds like LEGOs (small pieces first):

```mermaid
flowchart TD
    subgraph READ ["READING (Top-Down)"]
        direction TB
        R1["Full Screen"] --> R2["Sections"]
        R2 --> R3["Components"]
        R3 --> R4["Leaves (buttons, text, icons)"]
    end

    subgraph BUILD ["BUILDING (Bottom-Up)"]
        direction BT
        B4["Leaves (buttons, text, icons)"] --> B3["Components"]
        B3 --> B2["Sections"]
        B2 --> B1["Full Screen"]
    end

    READ --> BUILD

    style READ fill:#e3f2fd,stroke:#2196f3
    style BUILD fill:#fff3e0,stroke:#ff9800
```

**Why?** Reading top-down gives you context ("this is a settings page with 3 sections"). Building bottom-up gives you precision ("this button is exactly 44px tall with 12px padding and #7B61FF background"). Context prevents mistakes. Precision prevents "close enough."

---

## Why This Is Different (Key Differentiators)

### The Core Problem Everyone Else Gets Wrong

```mermaid
flowchart LR
    subgraph OLD ["Other Tools"]
        direction TB
        O1["Read SOME of
        the design
        (3-10%)"] --> O2["Build
        EVERYTHING
        at once"] --> O3["Hope it
        matches
        (it never does)"]
    end

    subgraph NEW ["Figma-to-Code v2"]
        direction TB
        N1["Read 100%
        of the design
        (every property)"] --> N2["Build ONE
        piece at a time
        (verify each)"] --> N3["95% match
        guaranteed
        (checked per component)"]
    end

    style OLD fill:#ffebee,stroke:#f44336
    style NEW fill:#e8f5e9,stroke:#4caf50
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
    FIGMA["What Figma shows:
    375px wide, perfect data,
    happy path"] --> GAP["THE GAP
    (60% of production code
    isn't visible in Figma)"]

    GAP --> H1["Responsive
    320px phone -> 768px tablet
    Flexible widths, not hardcoded"]
    GAP --> H2["Accessibility
    48x48 touch targets
    Screen reader labels
    RTL language support"]
    GAP --> H3["States
    Loading spinners
    Error messages
    Empty list placeholders"]
    GAP --> H4["Data Layer
    Data models from design
    Repository interfaces
    API stubs"]
    GAP --> H5["Edge Cases
    Super long text -> truncation
    Empty lists -> placeholder
    Image 404 -> fallback
    Network down -> retry"]

    style FIGMA fill:#7B61FF,color:#fff
    style GAP fill:#FF6B6B,color:#fff
    style H1 fill:#f8f9fa,stroke:#dee2e6
    style H2 fill:#f8f9fa,stroke:#dee2e6
    style H3 fill:#f8f9fa,stroke:#dee2e6
    style H4 fill:#f8f9fa,stroke:#dee2e6
    style H5 fill:#f8f9fa,stroke:#dee2e6
```

---

## The 95% Fidelity Checklist (~50 items)

Every component is checked against this before being marked done:

```mermaid
flowchart TD
    CHECK["95% Fidelity Check
    (per component)"]

    CHECK --> LAYOUT["Spacing & Layout (12 items)
    Direction, padding (all 4 sides), gap,
    sizing modes (fixed/fill/hug), alignment,
    flex/grow, wrap, absolute positioning,
    min/max constraints, clip, scroll"]

    CHECK --> TYPE["Typography (15 items)
    Font family, weight, size, italic,
    line height, letter spacing, color,
    text case, decoration, alignment,
    auto-resize, truncation, maxLines,
    paragraph spacing, mixed styles"]

    CHECK --> COLOR["Color & Surface (20+ items)
    Fills (solid + gradients), opacity,
    border weight/color/align/radius,
    corner smoothing, stroke cap/join/dash,
    stroke visibility, drop + inner shadow,
    blur effects, blend mode, rotation"]

    CHECK --> MASK["Masks & Clipping
    Clip shapes, masked images,
    custom vector shapes"]

    CHECK --> SEMANTIC["Semantic Correctness
    Component type matches intent,
    proper interactive patterns,
    builder pattern for lists"]

    CHECK --> ZINDEX["Z-Index & Layering
    Stack order, absolute positioning,
    glow/blur behind content,
    fixed headers above scroll"]

    CHECK --> ASSETS["Assets & Images
    All icons from extracted SVGs,
    no substitutes, correct scale mode,
    image filters + rotation"]

    style CHECK fill:#FF6B6B,color:#fff
    style LAYOUT fill:#e3f2fd,stroke:#2196f3
    style TYPE fill:#f3e5f5,stroke:#9c27b0
    style COLOR fill:#fff3e0,stroke:#ff9800
    style MASK fill:#e8f5e9,stroke:#4caf50
    style SEMANTIC fill:#fce4ec,stroke:#e91e63
    style ZINDEX fill:#fff8e1,stroke:#ffc107
    style ASSETS fill:#e0f2f1,stroke:#009688
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

## v1 vs v2

| | v1 (MCP-based) | v2 (REST API) |
|---|---|---|
| How it reads Figma | MCP tools (limited to ~10K tokens) | REST API (full tree, no limit) |
| API calls needed | 30-60+ calls | 3-5 calls |
| Large designs | Gets stuck, misses data | Works reliably |
| Component detection | Claude guesses (error-prone) | Pre-analyzed by script (reliable) |
| Asset export | One-by-one through MCP | Batch export (fast) |
| Data completeness | **~3-10%** of design visible | **100%** captured |
| Verification | None (build and hope) | Per-component screenshot loop |

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
|   |-- figma-extract.js              Entry point — orchestrates all 6 steps
|   |-- api.js                        Figma REST API client
|   |-- tree-walker.js                Analyzes hierarchy + chunks into ~10K pieces
|   |-- component-detector.js         Finds reusable components
|   |-- token-extractor.js            Extracts all design tokens
|   |-- asset-exporter.js             Smart icon/image export (filters junk)
|   |-- blueprint-writer.js           Generates the master blueprint
|   |-- chunk-writer.js               Writes detailed per-component specs
|
|-- skills/figma-to-code/
|   |-- SKILL.md                      The brain — 9 rules + 7 phases
|   |-- references/
|       |-- flutter.md                Flutter production patterns
|       |-- react.md                  React/Next.js production patterns
|       |-- react-native.md           React Native/Expo production patterns
|
|-- test/                             Unit tests
|-- PLAN.md                           Architecture & design decisions
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
