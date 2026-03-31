# Figma to Code v2 — Claude Code Plugin

A Claude Code plugin that converts Figma designs to pixel-perfect production code. Supports **React (Next.js / Vite / CRA)**, **React Native (Expo / bare)**, and **Flutter**.

**v2** uses the Figma REST API directly to pre-extract the full design tree, eliminating MCP tool limits and handling designs of any size.

## Setup

### 1. Install the Plugin

```bash
/plugin install <your-org>/figma-to-code-plugin
```

### 2. Set Your Figma Token

Generate a Personal Access Token at: Figma → Settings → Account → Personal access tokens

```bash
export FIGMA_ACCESS_TOKEN=figd_xxxxx
```

Add to your shell profile (`.zshrc`, `.bashrc`) to persist across sessions.

**Requirements:** Pro plan with Full or Dev seat (View/Collab seats have severe API rate limits).

### 3. Use It

Share a Figma link in Claude Code:

```
Build this: https://figma.com/design/abc123/MyProject?node-id=1-2
```

Or use the skill directly:

```
/figma-to-code https://figma.com/design/abc123/MyProject?node-id=1-2
```

## How It Works

### Stage 1: Extract (automatic)
The plugin runs a Node.js script that:
1. Fetches the **complete** design tree via Figma REST API (no truncation)
2. Analyzes structure — hierarchy, layout patterns, nesting
3. Detects **reusable components** — build once, use everywhere
4. Extracts **design tokens** — colors, typography, spacing
5. Exports **assets** — icons as SVG, images as PNG
6. Chunks the tree into **~10K-token specs** for reliable processing

### Stage 2: Build (Claude)
1. **Top-down reading** — Claude reads the blueprint, understands the full structure
2. **Bottom-up building** — starts from leaf components, assembles upward
3. **Pixel verification** — checks against screenshots at every step
4. **Fidelity check** — 90% fidelity checklist before marking done

## v1 vs v2

| | v1 (MCP-based) | v2 (REST API) |
|---|---|---|
| Data source | Figma MCP tools (~10K token limit) | REST API (full tree, no limit) |
| API calls | 30-60+ recursive calls | 3-5 calls total |
| Large designs | Gets stuck / errors | Works reliably |
| Component detection | Claude figures it out | Pre-analyzed by script |
| Asset export | One-by-one via MCP | Batch export |

## Optional: Project Configuration

Add to your project's `CLAUDE.md` for faster setup:

```markdown
## Figma-to-Code Config
- **Framework**: Next.js 14
- **Styling**: CSS Modules
- **Theme file**: `src/theme/theme.css`
- **Assets directory**: `src/assets/`
- **Components directory**: `src/components/`
- **Reusable components**: Button, Modal, Card, Input
```
