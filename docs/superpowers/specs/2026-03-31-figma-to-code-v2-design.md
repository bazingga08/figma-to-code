# Figma-to-Code Plugin v2 — Design Spec

## Problem

The current figma-to-code skill relies on Figma MCP tools (`get_design_context`, `get_figma_data`) which:

1. **Truncate responses at ~10K tokens** — a 333K+ token design can't be read in one shot
2. **Hit plan-based rate limits** — recursive decomposition burns 30-60+ MCP calls, exhausting View seat quotas (6/month)
3. **Fail with internal errors** — `get_design_context` server-side processing times out on large nodes
4. **Get stuck** — Claude loses track mid-recursion, consuming context on Figma data instead of code generation

### Validated with Real Data

Using the Figma REST API on the actual design (`Futures-UI-Revamp`, node `13766:373151`):

| Metric | Value |
|---|---|
| Full tree size | 3.3 MB (fetched in 10s, single call) |
| Total nodes | 5,298 |
| Root children | 6 (natural chunk boundaries) |
| Unique components | 29 |
| Component instances | 50 (build 29, reuse across 50) |
| Text nodes | 152 |
| Vectors (icons/assets) | 1,685 |
| Frames | 215 |

The MCP tools would need 60+ calls and still fail. The REST API returned everything in one call.

---

## Solution

Replace live MCP fetching with a **two-stage system**:

1. **Stage 1: `figma-extract` (Node.js CLI)** — fetches full design via Figma REST API, does all structural analysis, outputs pre-chunked specs to disk
2. **Stage 2: Revised `SKILL.md`** — Claude reads pre-extracted specs from disk, builds bottom-up, never calls Figma MCP tools

---

## Stage 1: The Extractor (`figma-extract`)

### Input

```bash
node figma-extract.js \
  --file=CQqMHodQmrPY7Ih88nZcG8 \
  --node=13766:373151 \
  --token=$FIGMA_ACCESS_TOKEN \
  --out=.figma-extract/
```

### What It Does

#### 1. Fetch (1-2 REST API calls)

- `GET /v1/files/:key/nodes?ids=:nodeId` — full node tree, no truncation
- `GET /v1/images/:key?ids=:nodeIds&format=png` — batch screenshots for all sections

Rate limits: 15 req/min on Pro/Full seat. We need ~3-5 calls total.

#### 2. Structural Analysis

- Build complete parent-child hierarchy from root to leaves
- Determine nesting depth per node
- Identify layout patterns per frame (flex row/column, grid, absolute, stack)
- Map auto-layout properties: direction, gap, padding, alignment, constraints
- Calculate **bottom-up build order** — topological sort so leaves come first, parents after children

#### 3. Reusable Component Detection

- Find all `type: "INSTANCE"` nodes → group by `componentId`
- Cross-reference with top-level `components` map for names/metadata
- Inspect `overrides` to determine what varies between instances
- Output: "Build `NavItem` once with props `[icon, label, badge]`, reuse 5 times"
- Detect **structural duplicates** — nodes that aren't Figma instances but have identical structure (same children count, types, similar dimensions)

#### 4. Design Token Extraction

- Collect every unique color from `fills`, `strokes`, `effects` → deduplicate → output color palette
- Collect every unique font/weight/size/lineHeight combo from `TEXT` nodes → typography scale
- Collect every unique spacing value (padding, gap, margin) → spacing scale
- Note: The Variables REST API (`/v1/files/:key/variables/local`) requires Enterprise plan. For non-Enterprise users, tokens are extracted directly from node properties (works on all plans).

#### 5. State & Variant Detection

- Find `COMPONENT_SET` nodes → these are variant groups
- Parse `componentPropertyDefinitions` for state variants (Default, Hover, Active, Disabled)
- Group: "Button has 4 states, here's the property diff between them"

#### 6. Asset Inventory & Export

- Find all `VECTOR`, `BOOLEAN_OPERATION`, `STAR`, `ELLIPSE` nodes that are icons/illustrations
- Find all image fills (photos, backgrounds)
- Batch export via `GET /v1/images/:key?ids=:nodeIds&format=svg` for vectors
- Batch export via `GET /v1/images/:key?ids=:nodeIds&format=png` for images
- Deduplicate: same icon used 15 times → export once
- Save to `.figma-extract/assets/`

#### 7. Chunking

Split the tree into **~10K-token chunks (~40KB of markdown)** respecting natural boundaries:

- Each root-level child is a chunk (or split further if still too large)
- Each reusable component gets its own chunk in `reusables/`
- Parent/assembly chunks contain only layout properties + references to child chunks

### Output Structure

```
.figma-extract/
├── blueprint.md                 ← Claude reads this FIRST
│   ├── Full tree hierarchy (visual tree diagram)
│   ├── Build order (numbered, bottom-up)
│   ├── Reusable components ("build once, use N times" with varying props)
│   ├── Design tokens (colors, typography, spacing)
│   ├── State/variant map
│   └── Asset manifest (what's exported, file paths)
│
├── chunks/
│   ├── 001-bottom-nav-bar.md    ← leaf chunk: exact Figma properties
│   ├── 002-watchlist-row.md     ← leaf chunk
│   ├── 003-announcement-card.md ← leaf chunk
│   ├── 004-trading-chart.md     ← leaf chunk
│   ├── ...                      ← more leaf + assembly chunks
│   └── N-futures-home.md        ← root assembly chunk
│
├── reusables/
│   ├── chevron-right.md         ← "used 15x, no varying props"
│   ├── coin-logo.md             ← "used 4x, varies: coinName, iconSrc"
│   ├── tags.md                  ← "used 2x, varies: label, color"
│   └── ...
│
├── screenshots/
│   ├── full-screen.png
│   ├── 001-bottom-nav-bar.png
│   ├── 002-watchlist-row.png
│   └── ...
│
└── assets/
    ├── icons/
    │   ├── chevron-right.svg
    │   ├── info-icon.svg
    │   └── ...
    └── images/
        ├── coin-btc.png
        └── ...
```

### Chunk File Format

Each chunk contains everything Claude needs to build that component:

```markdown
# Component: WatchlistRow
## Node: 13766:XXXXX
## Screenshot: screenshots/002-watchlist-row.png

## Layout
- Type: FRAME, auto-layout ROW
- Width: 343px (fill parent), Height: 56px (hug contents)
- Padding: 12px 16px
- Gap: 12px
- Alignment: center vertically

## Children (left to right)
1. CoinLogo (INSTANCE → see reusables/coin-logo.md)
2. CoinInfo (FRAME, column)
   - CoinName: TEXT "ZLQA/INR" | Inter SemiBold 14px/20px #FFFFFF
   - CoinSymbol: TEXT "ZLQA" | Inter Regular 12px/16px #8B8B9A
3. PriceInfo (FRAME, column, align-right)
   - Price: TEXT "₹26,019.03" | Inter SemiBold 14px/20px #FFFFFF
   - Change: TEXT "+8.15%" | Inter Medium 12px/16px #00C853

## Colors
- Background: transparent
- Divider bottom: 1px #1E1E2E

## States
- Default (shown above)
- Pressed: background #1A1A2E

## Assets Referenced
- CoinLogo: see reusables/coin-logo.md (icon varies per row)
- Chevron right: assets/icons/chevron-right.svg
```

---

## Stage 2: Revised Skill (`SKILL.md`)

### Phase 0 — Framework & Project Detection (unchanged)

- Detect React / React Native / Flutter from project files
- Discover theme tokens, existing components, styling approach, assets directory

### Phase 1 — Extract (NEW)

1. Skill runs the extractor:
   ```bash
   node figma-extract.js --file=<key> --node=<id> --token=$FIGMA_ACCESS_TOKEN --out=.figma-extract/
   ```
2. Wait for completion (should take 15-30 seconds for most designs)

### Phase 2 — Top-Down Reading (Understand First, Build Nothing)

1. Claude reads `blueprint.md` — understands complete structure, build order, reusables, tokens
2. Claude maps extracted design tokens to project's existing tokens
3. Claude presents the inventory to user for confirmation
4. No code written yet

### Phase 3 — Bottom-Up Building (Leaves First, Assemble Upward)

1. Claude follows the numbered build order from `blueprint.md`
2. **Reusable components first** — reads from `reusables/` folder:
   - Reads the reusable spec (e.g., `chevron-right.md`)
   - Checks codebase for existing match
   - Builds once if not found
3. **Leaf chunks next** — reads from `chunks/` folder in order:
   - Reads chunk file (~10K tokens of exact Figma properties)
   - Views screenshot from disk for visual reference
   - References already-built reusable components
   - Builds the component with pixel-matched accuracy
   - Verifies against screenshot
4. **Assembly chunks** — reads parent chunk:
   - Gets layout properties (flex direction, gap, padding, alignment)
   - Composes already-built children
   - Verifies against parent screenshot
5. Continues upward until full screen is assembled
6. Final verification against full-screen screenshot

### Phase 4 — Fidelity Verification (unchanged)

Same 90% fidelity checklist from current skill:
- Spacing & layout match
- Typography match
- Colors via design tokens
- All states implemented
- Assets exported (never hand-coded)
- Code quality & accessibility

### Phase 5 — Checkpoint (unchanged)

- List files created/modified
- Call out deviations
- Pause for user confirmation before next screen

---

## What's NOT Changing

- Framework detection logic
- Reference files (`react.md`, `react-native.md`, `flutter.md`)
- Fidelity checklist
- Checkpoint flow
- `package.json` structure (stays a Claude Code plugin)

---

## Auth & Setup

Users need a **Figma Personal Access Token**:

1. Go to Figma → Settings → Account → Personal access tokens
2. Generate a token with `file:read` scope
3. Set as environment variable: `export FIGMA_ACCESS_TOKEN=figd_xxxxx`

**Minimum Figma plan**: Pro plan with Full/Dev seat (for REST API access at 15 req/min). View/Collab seats are limited to 6 API calls/month — not viable.

---

## Dependencies

The `figma-extract` Node.js script needs:

- `node-fetch` (or built-in fetch in Node 18+) — for REST API calls
- `fs/path` (built-in) — file I/O
- No heavy dependencies. Intentionally minimal.

---

## Comparison: Current vs V2

| | Current Skill (v1) | V2 |
|---|---|---|
| Data source | Figma MCP tools (10K limit per call) | Figma REST API (full tree, no limit) |
| Calls needed | 30-60+ recursive MCP calls | 3-5 REST API calls |
| Rate limit risk | High (burns View seat quota) | Low (15/min, needs ~5) |
| Error risk | High (internal errors on large nodes) | Low (raw JSON dump, no processing) |
| Structural analysis | Claude does it in-context (expensive) | Script does it upfront (free) |
| Reusable detection | Claude figures it out mid-build | Script identifies all 29 upfront |
| Token extraction | Claude parses from raw data | Script extracts and deduplicates |
| Asset handling | Claude exports one-by-one via MCP | Script batch-exports in 1-2 calls |
| Claude's context usage | 100K+ tokens on Figma data | ~10-15K per component chunk |
| Failure mode | Gets stuck, loses track | Deterministic script, Claude reads files |

---

## File Changes Summary

| File | Action |
|---|---|
| `figma-extract.js` | **NEW** — the Node.js extractor script |
| `skills/figma-to-code/SKILL.md` | **REWRITE** — new two-phase flow, no MCP tools |
| `package.json` | **UPDATE** — add bin entry for figma-extract |
| `README.md` | **UPDATE** — document token setup, new flow |
| `.claude-plugin/` | **UPDATE** if needed for plugin config |
| `skills/figma-to-code/references/*.md` | **UNCHANGED** — framework refs stay as-is |
