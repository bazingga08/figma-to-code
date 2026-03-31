# Figma to Code — Claude Code Plugin

A Claude Code plugin that converts Figma designs to pixel-perfect production code. Supports **React (Next.js / Vite / CRA)**, **React Native (Expo / bare)**, and **Flutter**.

## Installation

```bash
/plugin install <your-org>/figma-to-code-plugin
```

Or install from a git URL:

```bash
/plugin install https://github.com/<your-org>/figma-to-code-plugin.git
```

After installation, run `/reload-plugins` to activate.

## Usage

Share a Figma link in Claude Code:

```
Build this: https://figma.com/design/abc123/MyProject?node-id=1-2
```

Or use the skill directly:

```
/figma-to-code https://figma.com/design/abc123/MyProject?node-id=1-2
```

The skill activates automatically when you:
- Paste a `figma.com` URL
- Say "build this from Figma", "implement the design", "match the Figma"
- Reference a Figma file or node ID

## What It Does

1. **Detects your framework** — React, React Native, or Flutter (auto-detected from project files)
2. **Scans your project** — discovers theme tokens, existing components, styling approach, assets directory
3. **Maps the entire Figma file** — presents a numbered inventory of all screens
4. **Adaptive deep scan** — for complex screens that exceed Figma's ~10K token limit, recursively decomposes into smaller frames and builds bottom-up
5. **Smart image detection** — auto-imports photos/icons/illustrations from Figma, asks before importing ambiguous content (banners, heroes)
6. **Pixel-perfect implementation** — builds components matching Figma exactly, reusing existing project components
7. **Live progress updates** — shows a visual tree of what's built, building, and queued
8. **Fidelity verification** — runs a 90% fidelity checklist before marking any screen done

## Optional: Project Configuration

The plugin discovers project context automatically. For faster setup, add this to your project's `CLAUDE.md`:

```markdown
## Figma-to-Code Config

- **Figma file key**: `YOUR_FILE_KEY_HERE`
- **Framework**: Next.js 14 (auto-detected if not specified)
- **Styling**: CSS Modules
- **Theme file**: `src/theme/theme.css`
- **Assets directory**: `src/assets/`
- **Components directory**: `src/components/`
- **Reusable components**: Button, Modal, Card, Input, Spinner, Toast
- **State management**: Redux Toolkit
- **API layer**: `src/core/api/`
```

## Supported Frameworks

| Framework | Reference File | Key Conventions |
|-----------|---------------|-----------------|
| React / Next.js | `references/react.md` | CSS Modules, next/image, TypeScript strict |
| React Native / Expo | `references/react-native.md` | StyleSheet.create, theme tokens, typed navigation |
| Flutter | `references/flutter.md` | AppColors/AppTextStyles, flutter_svg, BLoC/Riverpod |

## How Adaptive Decomposition Works

When a Figma screen is too complex for a single fetch (~10K token limit):

```
Fetch screen → too big?
  YES → capture parent layout + screenshot
      → enumerate children
      → for each child: recurse (same size check, max 5-6 levels)
      → build leaf components bottom-up
      → assemble using parent layout metadata
      → verify against screenshot
  NO  → build directly with Design Brief
```

Progress is shown as a visual tree:

```
🧩 Building piece by piece...

Dashboard Screen
├─ Header ✅ built
├─ Sidebar
│  ├─ NavMenu ✅ built
│  └─ UserProfile ⏳ building...
├─ MainContent (queued)
└─ Footer (queued)
```
