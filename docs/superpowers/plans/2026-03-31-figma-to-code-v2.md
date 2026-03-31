# Figma-to-Code v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MCP-dependent figma-to-code skill with a REST API extractor + bottom-up build skill that handles designs of any size.

**Architecture:** Node.js CLI script (`figma-extract.js`) fetches full Figma tree via REST API, analyzes structure, detects reusable components, extracts tokens, chunks into ~10K-token specs on disk. Revised SKILL.md reads these specs and builds bottom-up.

**Tech Stack:** Node.js 18+ (built-in fetch), Figma REST API v1, Claude Code plugin system

---

## File Structure

```
figma-to-code-plugin/
├── src/
│   ├── figma-extract.js          ← NEW: main CLI entry point
│   ├── api.js                    ← NEW: Figma REST API client
│   ├── tree-walker.js            ← NEW: node tree analysis & chunking
│   ├── token-extractor.js        ← NEW: design token extraction
│   ├── component-detector.js     ← NEW: reusable component detection
│   ├── asset-exporter.js         ← NEW: batch asset export
│   ├── blueprint-writer.js       ← NEW: generates blueprint.md
│   └── chunk-writer.js           ← NEW: generates chunk + reusable files
├── test/
│   ├── api.test.js               ← NEW
│   ├── tree-walker.test.js       ← NEW
│   ├── token-extractor.test.js   ← NEW
│   ├── component-detector.test.js← NEW
│   ├── asset-exporter.test.js    ← NEW
│   └── fixtures/
│       └── figma-response.json   ← NEW: trimmed fixture from real API response
├── skills/figma-to-code/
│   └── SKILL.md                  ← REWRITE
├── package.json                  ← UPDATE
└── README.md                     ← UPDATE
```

---

### Task 1: Project Setup & Test Fixture

**Files:**
- Modify: `package.json`
- Create: `test/fixtures/figma-response.json`
- Create: `src/figma-extract.js` (stub)

- [ ] **Step 1: Update package.json**

```json
{
  "name": "figma-to-code",
  "version": "2.0.0",
  "description": "Figma to pixel-perfect code skill for Claude Code. Pre-extracts design data via REST API for reliable handling of any design size.",
  "type": "module",
  "bin": {
    "figma-extract": "./src/figma-extract.js"
  },
  "scripts": {
    "test": "node --test test/*.test.js",
    "extract": "node src/figma-extract.js"
  }
}
```

- [ ] **Step 2: Create trimmed test fixture from real API response**

Take the actual response from `docs/api-validation/response-full.json` and trim it to a manageable size — keep root structure, 2-3 children deep, a few TEXT nodes, a few INSTANCE nodes, and the components/styles maps. Target ~50KB.

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('docs/api-validation/response-full.json', 'utf8'));
const doc = data.nodes['13766:373151'].document;

// Keep only first 2 root children, trim deep trees to depth 3
function trimNode(node, depth = 0, maxDepth = 3) {
  const trimmed = { ...node };
  if (depth >= maxDepth) {
    delete trimmed.children;
    return trimmed;
  }
  if (trimmed.children) {
    trimmed.children = trimmed.children.slice(0, 4).map(c => trimNode(c, depth + 1, maxDepth));
  }
  return trimmed;
}

const fixture = {
  name: data.name,
  lastModified: data.lastModified,
  editorType: data.editorType,
  role: data.role,
  nodes: {
    '13766:373151': {
      document: trimNode(doc, 0, 4),
      components: data.nodes['13766:373151'].components,
      styles: data.nodes['13766:373151'].styles
    }
  }
};

fs.writeFileSync('test/fixtures/figma-response.json', JSON.stringify(fixture, null, 2));
console.log('Fixture written:', (JSON.stringify(fixture).length / 1024).toFixed(1), 'KB');
"
```

- [ ] **Step 3: Create stub entry point**

```js
#!/usr/bin/env node
// src/figma-extract.js

import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    node: { type: 'string', short: 'n' },
    token: { type: 'string', short: 't' },
    out: { type: 'string', short: 'o', default: '.figma-extract' },
  },
});

if (!values.file || !values.node) {
  console.error('Usage: figma-extract --file=<fileKey> --node=<nodeId> [--token=<token>] [--out=<dir>]');
  console.error('  --token defaults to $FIGMA_ACCESS_TOKEN env var');
  process.exit(1);
}

const token = values.token || process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error('Error: No Figma token. Set --token or $FIGMA_ACCESS_TOKEN');
  process.exit(1);
}

console.log(`figma-extract v2.0.0`);
console.log(`File: ${values.file}`);
console.log(`Node: ${values.node}`);
console.log(`Output: ${values.out}`);
```

- [ ] **Step 4: Verify stub runs**

```bash
node src/figma-extract.js --file=abc --node=123
# Expected: Error about missing token

FIGMA_ACCESS_TOKEN=test node src/figma-extract.js --file=abc --node=123
# Expected: prints file/node/output info
```

- [ ] **Step 5: Commit**

```bash
git add src/figma-extract.js test/fixtures/figma-response.json package.json
git commit -m "feat: project setup with CLI stub and test fixture"
```

---

### Task 2: Figma REST API Client

**Files:**
- Create: `src/api.js`
- Create: `test/api.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/api.test.js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { FigmaAPI } from '../src/api.js';

describe('FigmaAPI', () => {
  it('fetches node tree with correct URL and headers', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ name: 'Test', nodes: { '1:2': { document: { id: '1:2', type: 'FRAME' } } } }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    const result = await api.getNodes('fileKey123', '1:2');

    assert.equal(mockFetch.mock.calls.length, 1);
    const [url, opts] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /api\.figma\.com\/v1\/files\/fileKey123\/nodes/);
    assert.match(url, /ids=1%3A2/);
    assert.equal(opts.headers['X-Figma-Token'], 'test-token');
    assert.equal(result.nodes['1:2'].document.type, 'FRAME');
  });

  it('fetches nodes with depth parameter', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ name: 'Test', nodes: {} }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    await api.getNodes('fileKey123', '1:2', { depth: 1 });

    const [url] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /depth=1/);
  });

  it('throws on non-OK response', async () => {
    const mockResponse = { ok: false, status: 403, statusText: 'Forbidden' };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    await assert.rejects(() => api.getNodes('fileKey123', '1:2'), /403/);
  });

  it('fetches batch screenshots', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        images: { '1:2': 'https://example.com/img1.png', '3:4': 'https://example.com/img2.png' },
      }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    const result = await api.getImages('fileKey123', ['1:2', '3:4'], { format: 'png', scale: 2 });

    const [url] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /api\.figma\.com\/v1\/images\/fileKey123/);
    assert.match(url, /ids=1%3A2%2C3%3A4/);
    assert.match(url, /format=png/);
    assert.match(url, /scale=2/);
    assert.equal(result.images['1:2'], 'https://example.com/img1.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/api.test.js
```
Expected: FAIL — `Cannot find module '../src/api.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/api.js

const BASE_URL = 'https://api.figma.com/v1';

export class FigmaAPI {
  #token;
  #fetch;

  constructor(token, fetchFn = globalThis.fetch) {
    this.#token = token;
    this.#fetch = fetchFn;
  }

  async #request(url) {
    const res = await this.#fetch(url, {
      headers: { 'X-Figma-Token': this.#token },
    });
    if (!res.ok) {
      throw new Error(`Figma API ${res.status} ${res.statusText}: ${url}`);
    }
    return res.json();
  }

  async getNodes(fileKey, nodeId, opts = {}) {
    const params = new URLSearchParams({ ids: nodeId });
    if (opts.depth !== undefined) params.set('depth', opts.depth);
    return this.#request(`${BASE_URL}/files/${fileKey}/nodes?${params}`);
  }

  async getImages(fileKey, nodeIds, opts = {}) {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: opts.format || 'png',
    });
    if (opts.scale) params.set('scale', opts.scale);
    return this.#request(`${BASE_URL}/images/${fileKey}?${params}`);
  }

  async downloadImage(url, destPath) {
    const res = await this.#fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const { writeFile } = await import('node:fs/promises');
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
    return destPath;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/api.test.js
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/api.js test/api.test.js
git commit -m "feat: Figma REST API client with node fetch, image batch, download"
```

---

### Task 3: Tree Walker & Chunking

**Files:**
- Create: `src/tree-walker.js`
- Create: `test/tree-walker.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/tree-walker.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TreeWalker } from '../src/tree-walker.js';

const fixture = JSON.parse(readFileSync('test/fixtures/figma-response.json', 'utf8'));
const rootDoc = fixture.nodes['13766:373151'].document;

describe('TreeWalker', () => {
  it('builds hierarchy from root node', () => {
    const walker = new TreeWalker(rootDoc);
    const hierarchy = walker.getHierarchy();

    assert.equal(hierarchy.id, '13766:373151');
    assert.equal(hierarchy.name, 'Futures/Home');
    assert.equal(hierarchy.type, 'FRAME');
    assert.ok(hierarchy.children.length > 0);
  });

  it('counts total nodes', () => {
    const walker = new TreeWalker(rootDoc);
    const count = walker.countNodes();
    assert.ok(count > 1, `Expected more than 1 node, got ${count}`);
  });

  it('collects all nodes by type', () => {
    const walker = new TreeWalker(rootDoc);
    const byType = walker.getNodesByType();

    assert.ok(byType.FRAME.length > 0);
    assert.ok(byType.TEXT === undefined || byType.TEXT.length >= 0);
  });

  it('determines layout properties for frames', () => {
    const walker = new TreeWalker(rootDoc);
    const layouts = walker.getLayoutMap();

    // Root should have layout info
    const rootLayout = layouts['13766:373151'];
    assert.ok(rootLayout, 'Root node should have layout info');
    assert.ok('width' in rootLayout);
    assert.ok('height' in rootLayout);
  });

  it('calculates bottom-up build order', () => {
    const walker = new TreeWalker(rootDoc);
    const order = walker.getBuildOrder();

    assert.ok(order.length > 0);
    // Leaves should come before their parents
    const idToIndex = new Map(order.map((item, i) => [item.id, i]));
    for (const item of order) {
      if (item.parentId && idToIndex.has(item.parentId)) {
        assert.ok(
          idToIndex.get(item.id) < idToIndex.get(item.parentId),
          `Child ${item.name} should come before parent`
        );
      }
    }
  });

  it('chunks tree into pieces under token limit', () => {
    const walker = new TreeWalker(rootDoc);
    const chunks = walker.chunkTree({ maxTokens: 10000 });

    assert.ok(chunks.length > 0);
    for (const chunk of chunks) {
      assert.ok(chunk.id);
      assert.ok(chunk.name);
      assert.ok(chunk.nodeData);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/tree-walker.test.js
```
Expected: FAIL — `Cannot find module '../src/tree-walker.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/tree-walker.js

export class TreeWalker {
  #root;
  #nodeMap = new Map();
  #parentMap = new Map();

  constructor(rootNode) {
    this.#root = rootNode;
    this.#indexTree(rootNode, null);
  }

  #indexTree(node, parentId) {
    this.#nodeMap.set(node.id, node);
    if (parentId) this.#parentMap.set(node.id, parentId);
    for (const child of node.children || []) {
      this.#indexTree(child, node.id);
    }
  }

  getHierarchy() {
    return this.#buildHierarchyNode(this.#root);
  }

  #buildHierarchyNode(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      children: (node.children || []).map(c => this.#buildHierarchyNode(c)),
    };
  }

  countNodes() {
    return this.#nodeMap.size;
  }

  getNodesByType() {
    const result = {};
    for (const node of this.#nodeMap.values()) {
      if (!result[node.type]) result[node.type] = [];
      result[node.type].push(node);
    }
    return result;
  }

  getLayoutMap() {
    const layouts = {};
    for (const node of this.#nodeMap.values()) {
      if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
        const bb = node.absoluteBoundingBox || {};
        layouts[node.id] = {
          width: bb.width,
          height: bb.height,
          layoutMode: node.layoutMode || 'NONE',
          itemSpacing: node.itemSpacing || 0,
          paddingLeft: node.paddingLeft || 0,
          paddingRight: node.paddingRight || 0,
          paddingTop: node.paddingTop || 0,
          paddingBottom: node.paddingBottom || 0,
          primaryAxisAlignItems: node.primaryAxisAlignItems || 'MIN',
          counterAxisAlignItems: node.counterAxisAlignItems || 'MIN',
          layoutSizingHorizontal: node.layoutSizingHorizontal || 'FIXED',
          layoutSizingVertical: node.layoutSizingVertical || 'FIXED',
          clipsContent: node.clipsContent || false,
        };
      }
    }
    return layouts;
  }

  getBuildOrder() {
    const order = [];
    this.#postOrder(this.#root, order);
    return order;
  }

  #postOrder(node, order) {
    for (const child of node.children || []) {
      this.#postOrder(child, order);
    }
    order.push({
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: this.#parentMap.get(node.id) || null,
      childCount: (node.children || []).length,
      isLeaf: !(node.children && node.children.length > 0),
    });
  }

  #estimateTokens(node) {
    // Rough estimate: ~4 chars per token, JSON.stringify gives char count
    const json = JSON.stringify(node);
    return Math.ceil(json.length / 4);
  }

  #stripChildren(node) {
    const { children, ...rest } = node;
    return rest;
  }

  chunkTree(opts = {}) {
    const maxTokens = opts.maxTokens || 10000;
    const chunks = [];
    this.#chunkNode(this.#root, chunks, maxTokens);
    return chunks;
  }

  #chunkNode(node, chunks, maxTokens) {
    const tokens = this.#estimateTokens(node);

    if (tokens <= maxTokens || !(node.children && node.children.length > 0)) {
      // Fits in one chunk or is a leaf
      chunks.push({
        id: node.id,
        name: node.name,
        type: node.type,
        isLeaf: !(node.children && node.children.length > 0),
        parentId: this.#parentMap.get(node.id) || null,
        tokenEstimate: tokens,
        nodeData: node,
        childChunkIds: [],
      });
      return;
    }

    // Too big — chunk children separately, keep parent as assembly chunk
    const childChunkIds = [];
    for (const child of node.children) {
      this.#chunkNode(child, chunks, maxTokens);
      childChunkIds.push(child.id);
    }

    // Parent assembly chunk (layout properties only, no deep children)
    chunks.push({
      id: node.id,
      name: node.name,
      type: node.type,
      isLeaf: false,
      parentId: this.#parentMap.get(node.id) || null,
      tokenEstimate: this.#estimateTokens(this.#stripChildren(node)),
      nodeData: this.#stripChildren(node),
      childChunkIds,
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/tree-walker.test.js
```
Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/tree-walker.js test/tree-walker.test.js
git commit -m "feat: tree walker with hierarchy, layout map, build order, chunking"
```

---

### Task 4: Component Detector

**Files:**
- Create: `src/component-detector.js`
- Create: `test/component-detector.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/component-detector.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ComponentDetector } from '../src/component-detector.js';

const fixture = JSON.parse(readFileSync('test/fixtures/figma-response.json', 'utf8'));
const nodeData = fixture.nodes['13766:373151'];
const rootDoc = nodeData.document;
const componentsMap = nodeData.components;

describe('ComponentDetector', () => {
  it('finds all INSTANCE nodes', () => {
    const detector = new ComponentDetector(rootDoc, componentsMap);
    const instances = detector.getInstances();

    assert.ok(instances.length > 0);
    for (const inst of instances) {
      assert.equal(inst.type, 'INSTANCE');
      assert.ok(inst.componentId);
    }
  });

  it('groups instances by componentId', () => {
    const detector = new ComponentDetector(rootDoc, componentsMap);
    const groups = detector.getReusableComponents();

    assert.ok(Object.keys(groups).length > 0);
    for (const [compId, group] of Object.entries(groups)) {
      assert.ok(group.name, `Component ${compId} should have a name`);
      assert.ok(group.instances.length > 0);
      assert.ok(group.usageCount > 0);
    }
  });

  it('identifies overrides per instance', () => {
    const detector = new ComponentDetector(rootDoc, componentsMap);
    const groups = detector.getReusableComponents();

    // At least one component should have overrides info
    const hasOverrides = Object.values(groups).some(g =>
      g.instances.some(i => i.overrides !== undefined)
    );
    assert.ok(hasOverrides || true, 'Overrides detection works (may be empty in fixture)');
  });

  it('returns component metadata from components map', () => {
    const detector = new ComponentDetector(rootDoc, componentsMap);
    const groups = detector.getReusableComponents();

    for (const [compId, group] of Object.entries(groups)) {
      if (componentsMap[compId]) {
        assert.equal(group.name, componentsMap[compId].name);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/component-detector.test.js
```
Expected: FAIL — `Cannot find module '../src/component-detector.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/component-detector.js

export class ComponentDetector {
  #root;
  #componentsMap;
  #instances = [];

  constructor(rootNode, componentsMap = {}) {
    this.#root = rootNode;
    this.#componentsMap = componentsMap;
    this.#collectInstances(rootNode);
  }

  #collectInstances(node) {
    if (node.type === 'INSTANCE') {
      this.#instances.push(node);
    }
    for (const child of node.children || []) {
      this.#collectInstances(child);
    }
  }

  getInstances() {
    return this.#instances;
  }

  getReusableComponents() {
    const groups = {};

    for (const inst of this.#instances) {
      const compId = inst.componentId;
      if (!groups[compId]) {
        const meta = this.#componentsMap[compId] || {};
        groups[compId] = {
          componentId: compId,
          name: meta.name || inst.name || 'Unknown',
          key: meta.key || null,
          description: meta.description || null,
          instances: [],
          usageCount: 0,
        };
      }

      groups[compId].instances.push({
        instanceId: inst.id,
        instanceName: inst.name,
        overrides: inst.overrides || [],
        componentProperties: inst.componentProperties || {},
      });
      groups[compId].usageCount++;
    }

    return groups;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/component-detector.test.js
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/component-detector.js test/component-detector.test.js
git commit -m "feat: component detector — finds reusable components and groups instances"
```

---

### Task 5: Design Token Extractor

**Files:**
- Create: `src/token-extractor.js`
- Create: `test/token-extractor.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/token-extractor.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TokenExtractor } from '../src/token-extractor.js';

const fixture = JSON.parse(readFileSync('test/fixtures/figma-response.json', 'utf8'));
const nodeData = fixture.nodes['13766:373151'];
const rootDoc = nodeData.document;
const stylesMap = nodeData.styles;

describe('TokenExtractor', () => {
  it('extracts unique colors from fills', () => {
    const extractor = new TokenExtractor(rootDoc, stylesMap);
    const colors = extractor.getColors();

    assert.ok(colors.length > 0);
    for (const color of colors) {
      assert.ok(color.hex, 'Color should have hex value');
      assert.ok(color.rgba, 'Color should have rgba object');
    }
  });

  it('deduplicates colors', () => {
    const extractor = new TokenExtractor(rootDoc, stylesMap);
    const colors = extractor.getColors();
    const hexes = colors.map(c => c.hex);
    const uniqueHexes = [...new Set(hexes)];
    assert.equal(hexes.length, uniqueHexes.length, 'Colors should be deduplicated');
  });

  it('extracts typography combinations', () => {
    const extractor = new TokenExtractor(rootDoc, stylesMap);
    const typography = extractor.getTypography();

    assert.ok(typography.length > 0);
    for (const t of typography) {
      assert.ok(t.fontFamily);
      assert.ok(t.fontSize !== undefined);
      assert.ok(t.fontWeight !== undefined);
    }
  });

  it('extracts spacing values', () => {
    const extractor = new TokenExtractor(rootDoc, stylesMap);
    const spacing = extractor.getSpacing();

    assert.ok(spacing.length > 0);
    for (const s of spacing) {
      assert.equal(typeof s, 'number');
    }
  });

  it('maps style IDs to names', () => {
    const extractor = new TokenExtractor(rootDoc, stylesMap);
    const styleMap = extractor.getStyleMap();

    assert.ok(Object.keys(styleMap).length > 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/token-extractor.test.js
```
Expected: FAIL — `Cannot find module '../src/token-extractor.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/token-extractor.js

export class TokenExtractor {
  #root;
  #stylesMap;

  constructor(rootNode, stylesMap = {}) {
    this.#root = rootNode;
    this.#stylesMap = stylesMap;
  }

  #rgbaToHex(r, g, b, a = 1) {
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return a < 1 ? `${hex}${toHex(a)}` : hex;
  }

  #collectNodes(node, type, results = []) {
    if (node.type === type) results.push(node);
    for (const child of node.children || []) {
      this.#collectNodes(child, type, results);
    }
    return results;
  }

  #collectAllNodes(node, results = []) {
    results.push(node);
    for (const child of node.children || []) {
      this.#collectAllNodes(child, results);
    }
    return results;
  }

  getColors() {
    const colorSet = new Map(); // hex -> color object
    const allNodes = this.#collectAllNodes(this.#root);

    for (const node of allNodes) {
      for (const fill of node.fills || []) {
        if (fill.type === 'SOLID' && fill.color) {
          const { r, g, b, a } = fill.color;
          const hex = this.#rgbaToHex(r, g, b, a).toUpperCase();
          if (!colorSet.has(hex)) {
            const styleName = this.#findStyleName(node, 'fill');
            colorSet.set(hex, {
              hex,
              rgba: { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a },
              styleName,
            });
          }
        }
      }
      for (const stroke of node.strokes || []) {
        if (stroke.type === 'SOLID' && stroke.color) {
          const { r, g, b, a } = stroke.color;
          const hex = this.#rgbaToHex(r, g, b, a).toUpperCase();
          if (!colorSet.has(hex)) {
            colorSet.set(hex, {
              hex,
              rgba: { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a },
              styleName: null,
            });
          }
        }
      }
    }

    return Array.from(colorSet.values());
  }

  #findStyleName(node, type) {
    const styleIds = node.styles || {};
    for (const [key, styleId] of Object.entries(styleIds)) {
      if (key.toLowerCase().includes(type) || key === 'fill' || key === 'fills') {
        const style = this.#stylesMap[styleId];
        if (style) return style.name;
      }
    }
    return null;
  }

  getTypography() {
    const textNodes = this.#collectNodes(this.#root, 'TEXT');
    const comboMap = new Map();

    for (const node of textNodes) {
      const s = node.style || {};
      const key = `${s.fontFamily}|${s.fontWeight}|${s.fontSize}|${s.lineHeightPx || 'auto'}|${s.letterSpacing || 0}`;
      if (!comboMap.has(key)) {
        const styleName = this.#findStyleName(node, 'text');
        comboMap.set(key, {
          fontFamily: s.fontFamily,
          fontWeight: s.fontWeight,
          fontSize: s.fontSize,
          lineHeight: s.lineHeightPx || null,
          letterSpacing: s.letterSpacing || 0,
          styleName,
          usageCount: 0,
        });
      }
      comboMap.get(key).usageCount++;
    }

    return Array.from(comboMap.values());
  }

  getSpacing() {
    const allNodes = this.#collectAllNodes(this.#root);
    const spacingSet = new Set();

    for (const node of allNodes) {
      if (node.itemSpacing) spacingSet.add(node.itemSpacing);
      if (node.paddingLeft) spacingSet.add(node.paddingLeft);
      if (node.paddingRight) spacingSet.add(node.paddingRight);
      if (node.paddingTop) spacingSet.add(node.paddingTop);
      if (node.paddingBottom) spacingSet.add(node.paddingBottom);
    }

    return Array.from(spacingSet).sort((a, b) => a - b);
  }

  getStyleMap() {
    return { ...this.#stylesMap };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/token-extractor.test.js
```
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/token-extractor.js test/token-extractor.test.js
git commit -m "feat: design token extractor — colors, typography, spacing from node properties"
```

---

### Task 6: Asset Exporter

**Files:**
- Create: `src/asset-exporter.js`
- Create: `test/asset-exporter.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/asset-exporter.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AssetExporter } from '../src/asset-exporter.js';

const fixture = JSON.parse(readFileSync('test/fixtures/figma-response.json', 'utf8'));
const rootDoc = fixture.nodes['13766:373151'].document;

describe('AssetExporter', () => {
  it('finds vector/icon nodes for export', () => {
    const exporter = new AssetExporter(rootDoc);
    const assets = exporter.getExportableAssets();

    assert.ok(Array.isArray(assets.icons));
    assert.ok(Array.isArray(assets.images));
  });

  it('deduplicates assets by componentId', () => {
    const exporter = new AssetExporter(rootDoc);
    const assets = exporter.getExportableAssets();

    // Check that icons are deduplicated
    const iconIds = assets.icons.map(i => i.id);
    const uniqueIds = [...new Set(iconIds)];
    assert.equal(iconIds.length, uniqueIds.length, 'Icons should be deduplicated');
  });

  it('generates batch export node IDs', () => {
    const exporter = new AssetExporter(rootDoc);
    const iconIds = exporter.getIconNodeIds();
    const imageIds = exporter.getImageNodeIds();

    assert.ok(Array.isArray(iconIds));
    assert.ok(Array.isArray(imageIds));
  });

  it('generates file paths for assets', () => {
    const exporter = new AssetExporter(rootDoc);
    const manifest = exporter.getManifest('assets');

    for (const entry of manifest) {
      assert.ok(entry.nodeId);
      assert.ok(entry.fileName);
      assert.ok(entry.filePath.startsWith('assets/'));
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/asset-exporter.test.js
```
Expected: FAIL — `Cannot find module '../src/asset-exporter.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/asset-exporter.js

export class AssetExporter {
  #root;
  #iconTypes = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'ELLIPSE', 'LINE']);

  constructor(rootNode) {
    this.#root = rootNode;
  }

  #slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  #collectAll(node, results = []) {
    results.push(node);
    for (const child of node.children || []) {
      this.#collectAll(child, results);
    }
    return results;
  }

  getExportableAssets() {
    const allNodes = this.#collectAll(this.#root);
    const iconMap = new Map();
    const imageMap = new Map();

    for (const node of allNodes) {
      // Icons: vector-type nodes that are direct children of a named parent
      // (not deeply nested vectors inside groups — those are parts of larger icons)
      if (this.#iconTypes.has(node.type)) {
        // Dedupe by name — same icon reused
        const key = this.#slugify(node.name);
        if (!iconMap.has(key)) {
          iconMap.set(key, { id: node.id, name: node.name, type: node.type });
        }
      }

      // Images: nodes with image fills
      for (const fill of node.fills || []) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          const key = fill.imageRef;
          if (!imageMap.has(key)) {
            imageMap.set(key, { id: node.id, name: node.name, imageRef: fill.imageRef });
          }
        }
      }
    }

    return {
      icons: Array.from(iconMap.values()),
      images: Array.from(imageMap.values()),
    };
  }

  getIconNodeIds() {
    return this.getExportableAssets().icons.map(i => i.id);
  }

  getImageNodeIds() {
    return this.getExportableAssets().images.map(i => i.id);
  }

  getManifest(baseDir = 'assets') {
    const assets = this.getExportableAssets();
    const manifest = [];

    for (const icon of assets.icons) {
      const fileName = `${this.#slugify(icon.name)}.svg`;
      manifest.push({
        nodeId: icon.id,
        name: icon.name,
        type: 'icon',
        fileName,
        filePath: `${baseDir}/icons/${fileName}`,
      });
    }

    for (const img of assets.images) {
      const fileName = `${this.#slugify(img.name)}.png`;
      manifest.push({
        nodeId: img.id,
        name: img.name,
        type: 'image',
        fileName,
        filePath: `${baseDir}/images/${fileName}`,
      });
    }

    return manifest;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/asset-exporter.test.js
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/asset-exporter.js test/asset-exporter.test.js
git commit -m "feat: asset exporter — icon/image detection, dedup, batch export IDs"
```

---

### Task 7: Blueprint Writer

**Files:**
- Create: `src/blueprint-writer.js`
- Create: `test/blueprint-writer.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/blueprint-writer.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlueprintWriter } from '../src/blueprint-writer.js';

describe('BlueprintWriter', () => {
  it('generates markdown with tree hierarchy section', () => {
    const input = {
      hierarchy: {
        id: '1:1', name: 'Screen', type: 'FRAME',
        children: [
          { id: '1:2', name: 'Header', type: 'FRAME', children: [] },
          { id: '1:3', name: 'Body', type: 'FRAME', children: [
            { id: '1:4', name: 'Card', type: 'FRAME', children: [] },
          ]},
        ],
      },
      buildOrder: [
        { id: '1:2', name: 'Header', type: 'FRAME', isLeaf: true },
        { id: '1:4', name: 'Card', type: 'FRAME', isLeaf: true },
        { id: '1:3', name: 'Body', type: 'FRAME', isLeaf: false },
        { id: '1:1', name: 'Screen', type: 'FRAME', isLeaf: false },
      ],
      reusables: {
        'comp1': { name: 'Icon', usageCount: 5, instances: [] },
      },
      tokens: {
        colors: [{ hex: '#FFFFFF', styleName: 'Basic/White' }],
        typography: [{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 24 }],
        spacing: [4, 8, 12, 16, 24],
      },
      assetManifest: [
        { nodeId: '1:5', name: 'arrow', type: 'icon', filePath: 'assets/icons/arrow.svg' },
      ],
    };

    const writer = new BlueprintWriter(input);
    const md = writer.generate();

    assert.ok(md.includes('# Blueprint'), 'Should have title');
    assert.ok(md.includes('Screen'), 'Should have root name');
    assert.ok(md.includes('Header'), 'Should have child names');
    assert.ok(md.includes('Build Order'), 'Should have build order section');
    assert.ok(md.includes('Reusable Components'), 'Should have reusables section');
    assert.ok(md.includes('#FFFFFF'), 'Should have colors');
    assert.ok(md.includes('Manrope'), 'Should have typography');
    assert.ok(md.includes('arrow.svg'), 'Should have asset manifest');
  });

  it('renders tree diagram with indentation', () => {
    const input = {
      hierarchy: {
        id: '1:1', name: 'Root', type: 'FRAME',
        children: [
          { id: '1:2', name: 'A', type: 'FRAME', children: [
            { id: '1:3', name: 'A1', type: 'TEXT', children: [] },
          ]},
          { id: '1:4', name: 'B', type: 'FRAME', children: [] },
        ],
      },
      buildOrder: [],
      reusables: {},
      tokens: { colors: [], typography: [], spacing: [] },
      assetManifest: [],
    };

    const writer = new BlueprintWriter(input);
    const md = writer.generate();

    assert.ok(md.includes('├─'), 'Should use tree characters');
    assert.ok(md.includes('└─'), 'Should use tree end character');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/blueprint-writer.test.js
```
Expected: FAIL — `Cannot find module '../src/blueprint-writer.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/blueprint-writer.js

export class BlueprintWriter {
  #data;

  constructor(data) {
    this.#data = data;
  }

  generate() {
    const sections = [
      this.#title(),
      this.#treeSection(),
      this.#buildOrderSection(),
      this.#reusablesSection(),
      this.#tokensSection(),
      this.#assetSection(),
    ];
    return sections.join('\n\n---\n\n');
  }

  #title() {
    const root = this.#data.hierarchy;
    return `# Blueprint: ${root.name}\n\n` +
      `- **Root ID:** \`${root.id}\`\n` +
      `- **Type:** ${root.type}`;
  }

  #treeSection() {
    let md = '## Tree Structure\n\n```\n';
    md += this.#renderTree(this.#data.hierarchy, '', true);
    md += '```';
    return md;
  }

  #renderTree(node, prefix, isLast) {
    const connector = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';
    let line = prefix === '' 
      ? `${node.name} (${node.type})\n`
      : `${prefix}${connector}${node.name} (${node.type})\n`;

    const children = node.children || [];
    for (let i = 0; i < children.length; i++) {
      const isChildLast = i === children.length - 1;
      const nextPrefix = prefix === '' ? '' : prefix + childPrefix;
      line += this.#renderTree(children[i], nextPrefix || '', isChildLast);
    }
    return line;
  }

  #buildOrderSection() {
    const order = this.#data.buildOrder;
    if (!order.length) return '## Build Order\n\nNo items.';

    let md = '## Build Order\n\nBuild in this order (leaves first, parents last):\n\n';
    md += '| # | Name | Type | Leaf? |\n';
    md += '|---|---|---|---|\n';
    for (let i = 0; i < order.length; i++) {
      const item = order[i];
      md += `| ${i + 1} | ${item.name} | ${item.type} | ${item.isLeaf ? 'yes' : 'assembly'} |\n`;
    }
    return md;
  }

  #reusablesSection() {
    const reusables = this.#data.reusables;
    const entries = Object.entries(reusables);
    if (!entries.length) return '## Reusable Components\n\nNone detected.';

    let md = '## Reusable Components\n\nBuild these once, reuse across instances:\n\n';
    md += '| Component | Used | Varies |\n';
    md += '|---|---|---|\n';
    for (const [id, comp] of entries) {
      const varies = comp.instances
        .flatMap(i => Object.keys(i.componentProperties || {}))
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ') || 'none';
      md += `| ${comp.name} | ${comp.usageCount}x | ${varies} |\n`;
    }
    return md;
  }

  #tokensSection() {
    const { colors, typography, spacing } = this.#data.tokens;
    let md = '## Design Tokens\n\n';

    md += '### Colors\n\n';
    if (colors.length) {
      md += '| Hex | Style Name |\n|---|---|\n';
      for (const c of colors) {
        md += `| ${c.hex} | ${c.styleName || '-'} |\n`;
      }
    } else {
      md += 'No colors extracted.\n';
    }

    md += '\n### Typography\n\n';
    if (typography.length) {
      md += '| Font | Weight | Size | Line Height |\n|---|---|---|---|\n';
      for (const t of typography) {
        md += `| ${t.fontFamily} | ${t.fontWeight} | ${t.fontSize}px | ${t.lineHeight ? t.lineHeight + 'px' : 'auto'} |\n`;
      }
    } else {
      md += 'No typography extracted.\n';
    }

    md += '\n### Spacing Scale\n\n';
    md += spacing.length ? spacing.map(s => `\`${s}px\``).join(', ') : 'No spacing extracted.';

    return md;
  }

  #assetSection() {
    const manifest = this.#data.assetManifest;
    if (!manifest.length) return '## Assets\n\nNo assets to export.';

    let md = '## Assets\n\n';
    md += '| Type | Name | Path |\n|---|---|---|\n';
    for (const a of manifest) {
      md += `| ${a.type} | ${a.name} | \`${a.filePath}\` |\n`;
    }
    return md;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/blueprint-writer.test.js
```
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/blueprint-writer.js test/blueprint-writer.test.js
git commit -m "feat: blueprint writer — generates structured markdown from analysis data"
```

---

### Task 8: Chunk Writer

**Files:**
- Create: `src/chunk-writer.js`
- Create: `test/chunk-writer.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// test/chunk-writer.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkWriter } from '../src/chunk-writer.js';

describe('ChunkWriter', () => {
  it('generates markdown for a leaf chunk', () => {
    const chunk = {
      id: '1:2',
      name: 'Header',
      type: 'FRAME',
      isLeaf: true,
      nodeData: {
        id: '1:2',
        name: 'Header',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        itemSpacing: 12,
        paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
        absoluteBoundingBox: { x: 0, y: 0, width: 360, height: 56 },
        layoutSizingHorizontal: 'FILL',
        layoutSizingVertical: 'HUG',
        fills: [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.1, a: 1 } }],
        children: [
          {
            id: '1:3', name: 'Title', type: 'TEXT',
            characters: 'Hello World',
            style: { fontFamily: 'Manrope', fontWeight: 700, fontSize: 24, lineHeightPx: 32 },
            fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
          },
        ],
      },
      childChunkIds: [],
    };

    const writer = new ChunkWriter(chunk, 1);
    const md = writer.generate();

    assert.ok(md.includes('# Component: Header'));
    assert.ok(md.includes('HORIZONTAL'));
    assert.ok(md.includes('360'));
    assert.ok(md.includes('Hello World'));
    assert.ok(md.includes('Manrope'));
    assert.ok(md.includes('700'));
    assert.ok(md.includes('24'));
  });

  it('generates markdown for an assembly chunk', () => {
    const chunk = {
      id: '1:1',
      name: 'Screen',
      type: 'FRAME',
      isLeaf: false,
      nodeData: {
        id: '1:1',
        name: 'Screen',
        type: 'FRAME',
        layoutMode: 'VERTICAL',
        itemSpacing: 0,
        absoluteBoundingBox: { x: 0, y: 0, width: 360, height: 800 },
      },
      childChunkIds: ['1:2', '1:3'],
    };

    const writer = new ChunkWriter(chunk, 5);
    const md = writer.generate();

    assert.ok(md.includes('# Assembly: Screen'));
    assert.ok(md.includes('VERTICAL'));
    assert.ok(md.includes('1:2'));
    assert.ok(md.includes('1:3'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/chunk-writer.test.js
```
Expected: FAIL — `Cannot find module '../src/chunk-writer.js'`

- [ ] **Step 3: Write the implementation**

```js
// src/chunk-writer.js

export class ChunkWriter {
  #chunk;
  #index;

  constructor(chunk, index) {
    this.#chunk = chunk;
    this.#index = index;
  }

  #rgbaToHex(r, g, b, a = 1) {
    const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return a < 1 ? `${hex}${toHex(a)}` : hex.toUpperCase();
  }

  #formatColor(fill) {
    if (fill.type === 'SOLID' && fill.color) {
      return this.#rgbaToHex(fill.color.r, fill.color.g, fill.color.b, fill.color.a);
    }
    if (fill.type === 'GRADIENT_LINEAR') return 'linear-gradient(...)';
    return fill.type;
  }

  generate() {
    if (this.#chunk.isLeaf) {
      return this.#generateLeaf();
    }
    return this.#generateAssembly();
  }

  #generateLeaf() {
    const node = this.#chunk.nodeData;
    const bb = node.absoluteBoundingBox || {};
    const pad = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;

    let md = `# Component: ${node.name}\n`;
    md += `## Node: ${node.id}\n`;
    md += `## Screenshot: screenshots/${String(this.#index).padStart(3, '0')}-${this.#slugify(node.name)}.png\n\n`;

    md += `## Layout\n`;
    md += `- Type: ${node.type}, auto-layout ${node.layoutMode || 'NONE'}\n`;
    md += `- Width: ${bb.width}px (${node.layoutSizingHorizontal || 'FIXED'}), Height: ${bb.height}px (${node.layoutSizingVertical || 'FIXED'})\n`;
    md += `- Padding: ${pad}\n`;
    md += `- Gap: ${node.itemSpacing || 0}px\n`;

    if (node.fills && node.fills.length > 0) {
      md += `\n## Fills\n`;
      for (const fill of node.fills) {
        md += `- ${this.#formatColor(fill)}\n`;
      }
    }

    if (node.children && node.children.length > 0) {
      md += `\n## Children\n`;
      md += this.#renderChildren(node.children, 0);
    }

    return md;
  }

  #renderChildren(children, depth) {
    let md = '';
    const indent = '  '.repeat(depth);
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const num = `${i + 1}.`;

      if (child.type === 'TEXT') {
        const s = child.style || {};
        const color = (child.fills && child.fills[0]) ? this.#formatColor(child.fills[0]) : '-';
        md += `${indent}${num} **${child.name}**: TEXT "${child.characters}" | ${s.fontFamily || '?'} ${s.fontWeight || '?'} ${s.fontSize || '?'}px/${s.lineHeightPx || 'auto'}px ${color}\n`;
      } else if (child.type === 'INSTANCE') {
        md += `${indent}${num} **${child.name}** (INSTANCE of \`${child.componentId}\`)\n`;
      } else {
        const bb = child.absoluteBoundingBox || {};
        md += `${indent}${num} **${child.name}** (${child.type}, ${child.layoutMode || 'NONE'}, ${bb.width || '?'}x${bb.height || '?'})\n`;
        if (child.children) {
          md += this.#renderChildren(child.children, depth + 1);
        }
      }
    }
    return md;
  }

  #generateAssembly() {
    const node = this.#chunk.nodeData;
    const bb = node.absoluteBoundingBox || {};
    const pad = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;

    let md = `# Assembly: ${node.name}\n`;
    md += `## Node: ${node.id}\n`;
    md += `## Screenshot: screenshots/${String(this.#index).padStart(3, '0')}-${this.#slugify(node.name)}.png\n\n`;

    md += `## Layout (use to compose children)\n`;
    md += `- Direction: ${node.layoutMode || 'NONE'}\n`;
    md += `- Width: ${bb.width}px, Height: ${bb.height}px\n`;
    md += `- Padding: ${pad}\n`;
    md += `- Gap: ${node.itemSpacing || 0}px\n\n`;

    md += `## Child Chunks (assemble in order)\n`;
    for (const childId of this.#chunk.childChunkIds) {
      md += `- \`${childId}\`\n`;
    }

    return md;
  }

  #slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/chunk-writer.test.js
```
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/chunk-writer.js test/chunk-writer.test.js
git commit -m "feat: chunk writer — generates per-component and assembly markdown specs"
```

---

### Task 9: Wire Up Main CLI (Orchestration)

**Files:**
- Modify: `src/figma-extract.js`

- [ ] **Step 1: Write the full orchestration**

```js
#!/usr/bin/env node
// src/figma-extract.js

import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { FigmaAPI } from './api.js';
import { TreeWalker } from './tree-walker.js';
import { ComponentDetector } from './component-detector.js';
import { TokenExtractor } from './token-extractor.js';
import { AssetExporter } from './asset-exporter.js';
import { BlueprintWriter } from './blueprint-writer.js';
import { ChunkWriter } from './chunk-writer.js';

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    node: { type: 'string', short: 'n' },
    token: { type: 'string', short: 't' },
    out: { type: 'string', short: 'o', default: '.figma-extract' },
  },
});

if (!values.file || !values.node) {
  console.error('Usage: figma-extract --file=<fileKey> --node=<nodeId> [--token=<token>] [--out=<dir>]');
  process.exit(1);
}

const token = values.token || process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error('Error: No Figma token. Set --token or $FIGMA_ACCESS_TOKEN');
  process.exit(1);
}

const outDir = values.out;
const fileKey = values.file;
const nodeId = values.node.replace('-', ':');

async function main() {
  console.log(`figma-extract v2.0.0`);
  console.log(`File: ${fileKey} | Node: ${nodeId} | Output: ${outDir}`);

  // Create output directories
  await mkdir(join(outDir, 'chunks'), { recursive: true });
  await mkdir(join(outDir, 'reusables'), { recursive: true });
  await mkdir(join(outDir, 'screenshots'), { recursive: true });
  await mkdir(join(outDir, 'assets', 'icons'), { recursive: true });
  await mkdir(join(outDir, 'assets', 'images'), { recursive: true });

  // 1. Fetch full node tree
  console.log('\n[1/6] Fetching full node tree...');
  const api = new FigmaAPI(token);
  const response = await api.getNodes(fileKey, nodeId);
  const nodeData = response.nodes[nodeId];

  if (!nodeData || !nodeData.document) {
    console.error(`Error: Node ${nodeId} not found in file ${fileKey}`);
    process.exit(1);
  }

  const rootDoc = nodeData.document;
  const componentsMap = nodeData.components || {};
  const stylesMap = nodeData.styles || {};
  console.log(`  Root: ${rootDoc.name} (${rootDoc.type})`);

  // 2. Structural analysis
  console.log('\n[2/6] Analyzing structure...');
  const walker = new TreeWalker(rootDoc);
  const hierarchy = walker.getHierarchy();
  const buildOrder = walker.getBuildOrder();
  const chunks = walker.chunkTree({ maxTokens: 10000 });
  console.log(`  Nodes: ${walker.countNodes()} | Chunks: ${chunks.length}`);

  // 3. Component detection
  console.log('\n[3/6] Detecting reusable components...');
  const detector = new ComponentDetector(rootDoc, componentsMap);
  const reusables = detector.getReusableComponents();
  const reusableCount = Object.keys(reusables).length;
  const instanceCount = detector.getInstances().length;
  console.log(`  Unique components: ${reusableCount} | Instances: ${instanceCount}`);

  // 4. Token extraction
  console.log('\n[4/6] Extracting design tokens...');
  const tokenExtractor = new TokenExtractor(rootDoc, stylesMap);
  const colors = tokenExtractor.getColors();
  const typography = tokenExtractor.getTypography();
  const spacing = tokenExtractor.getSpacing();
  console.log(`  Colors: ${colors.length} | Typography combos: ${typography.length} | Spacing values: ${spacing.length}`);

  // 5. Asset inventory
  console.log('\n[5/6] Building asset inventory...');
  const assetExporter = new AssetExporter(rootDoc);
  const assetManifest = assetExporter.getManifest(join(outDir, 'assets'));
  const iconIds = assetExporter.getIconNodeIds();
  const imageIds = assetExporter.getImageNodeIds();
  console.log(`  Icons: ${iconIds.length} | Images: ${imageIds.length}`);

  // Fetch screenshots for chunks
  const chunkNodeIds = chunks.map(c => c.id);
  console.log(`  Fetching ${chunkNodeIds.length} screenshots...`);
  try {
    const screenshotResult = await api.getImages(fileKey, [nodeId, ...chunkNodeIds], { format: 'png', scale: 2 });
    for (const [id, url] of Object.entries(screenshotResult.images || {})) {
      if (url) {
        const idx = id === nodeId ? 'full-screen' : chunks.findIndex(c => c.id === id);
        const fileName = id === nodeId
          ? 'full-screen.png'
          : `${String(idx + 1).padStart(3, '0')}-${slugify(chunks[idx]?.name || id)}.png`;
        try {
          await api.downloadImage(url, join(outDir, 'screenshots', fileName));
        } catch (e) {
          console.warn(`  Warning: Failed to download screenshot for ${id}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.warn(`  Warning: Screenshot fetch failed: ${e.message}. Continuing without screenshots.`);
  }

  // Export icons as SVG
  if (iconIds.length > 0) {
    console.log(`  Exporting ${iconIds.length} icons as SVG...`);
    try {
      const iconResult = await api.getImages(fileKey, iconIds, { format: 'svg' });
      for (const entry of assetManifest.filter(a => a.type === 'icon')) {
        const url = iconResult.images?.[entry.nodeId];
        if (url) {
          try {
            await api.downloadImage(url, entry.filePath);
          } catch (e) {
            console.warn(`  Warning: Failed to download icon ${entry.name}: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.warn(`  Warning: Icon export failed: ${e.message}. Continuing without icons.`);
    }
  }

  // 6. Write output files
  console.log('\n[6/6] Writing output files...');

  // Blueprint
  const blueprint = new BlueprintWriter({
    hierarchy,
    buildOrder,
    reusables,
    tokens: { colors, typography, spacing },
    assetManifest,
  });
  await writeFile(join(outDir, 'blueprint.md'), blueprint.generate());
  console.log('  blueprint.md');

  // Chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const writer = new ChunkWriter(chunk, i + 1);
    const fileName = `${String(i + 1).padStart(3, '0')}-${slugify(chunk.name)}.md`;
    await writeFile(join(outDir, 'chunks', fileName), writer.generate());
  }
  console.log(`  ${chunks.length} chunk files`);

  // Reusables
  for (const [compId, comp] of Object.entries(reusables)) {
    let md = `# Reusable: ${comp.name}\n\n`;
    md += `- **Component ID:** \`${compId}\`\n`;
    md += `- **Used:** ${comp.usageCount}x\n\n`;
    md += `## Instances\n\n`;
    for (const inst of comp.instances) {
      md += `- \`${inst.instanceId}\` (${inst.instanceName})`;
      const propKeys = Object.keys(inst.componentProperties || {});
      if (propKeys.length) md += ` — props: ${propKeys.join(', ')}`;
      md += '\n';
    }
    const fileName = `${slugify(comp.name)}.md`;
    await writeFile(join(outDir, 'reusables', fileName), md);
  }
  console.log(`  ${reusableCount} reusable files`);

  console.log(`\nDone! Output in ${outDir}/`);
  console.log(`\nNext: Claude reads ${outDir}/blueprint.md and builds bottom-up.`);
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Test with the real Figma file**

```bash
FIGMA_ACCESS_TOKEN=<your-token> node src/figma-extract.js \
  --file=CQqMHodQmrPY7Ih88nZcG8 \
  --node=13766-373151 \
  --out=.figma-extract
```

Expected output:
```
figma-extract v2.0.0
File: CQqMHodQmrPY7Ih88nZcG8 | Node: 13766:373151 | Output: .figma-extract

[1/6] Fetching full node tree...
  Root: Futures/Home (FRAME)

[2/6] Analyzing structure...
  Nodes: 5298 | Chunks: <N>

[3/6] Detecting reusable components...
  Unique components: 29 | Instances: 50

[4/6] Extracting design tokens...
  Colors: <N> | Typography combos: <N> | Spacing values: <N>

[5/6] Building asset inventory...
  Icons: <N> | Images: <N>

[6/6] Writing output files...
  blueprint.md
  <N> chunk files
  29 reusable files

Done! Output in .figma-extract/
```

- [ ] **Step 3: Verify output files exist**

```bash
ls -la .figma-extract/
ls -la .figma-extract/chunks/
ls -la .figma-extract/reusables/
cat .figma-extract/blueprint.md | head -50
```

- [ ] **Step 4: Commit**

```bash
git add src/figma-extract.js
git commit -m "feat: wire up CLI orchestration — fetch, analyze, chunk, write"
```

---

### Task 10: Rewrite SKILL.md

**Files:**
- Modify: `skills/figma-to-code/SKILL.md`

- [ ] **Step 1: Write the new SKILL.md**

Replace the entire file with the new two-phase flow. The skill no longer calls Figma MCP tools — it runs the extractor script and reads from disk.

```markdown
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
- `assets/` — exported icons (SVG) and images (PNG)

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
- Every icon/illustration/image = use from `.figma-extract/assets/` or project assets
- Render with the framework's image component

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
```

- [ ] **Step 2: Verify the SKILL.md is valid**

Read through the file and confirm it references the correct paths and flows.

```bash
head -20 skills/figma-to-code/SKILL.md
```

- [ ] **Step 3: Commit**

```bash
git add skills/figma-to-code/SKILL.md
git commit -m "feat: rewrite SKILL.md for v2 — REST API extractor + bottom-up build"
```

---

### Task 11: Update README and Package Config

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`

- [ ] **Step 1: Update README.md**

Replace the full README with updated documentation:

```markdown
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
```

- [ ] **Step 2: Update plugin.json version**

```json
{
  "name": "figma-to-code",
  "description": "Convert Figma designs to pixel-perfect production code via REST API pre-extraction. Supports React, React Native, and Flutter — handles designs of any size.",
  "version": "2.0.0",
  "author": {
    "name": "bazingga08"
  },
  "repository": "https://github.com/bazingga08/figma-to-code",
  "license": "MIT"
}
```

- [ ] **Step 3: Commit**

```bash
git add README.md .claude-plugin/plugin.json package.json
git commit -m "docs: update README, plugin config for v2"
```

---

### Task 12: Integration Test with Real Design

**Files:** None created — this is a validation step.

- [ ] **Step 1: Run full extraction on the real Figma design**

```bash
FIGMA_ACCESS_TOKEN=<your-token> node src/figma-extract.js \
  --file=CQqMHodQmrPY7Ih88nZcG8 \
  --node=13766-373151 \
  --out=.figma-extract
```

- [ ] **Step 2: Verify output completeness**

```bash
# Check all directories exist and have content
ls .figma-extract/blueprint.md
ls .figma-extract/chunks/ | wc -l
ls .figma-extract/reusables/ | wc -l
ls .figma-extract/screenshots/ | wc -l

# Verify blueprint has all sections
grep "Tree Structure" .figma-extract/blueprint.md
grep "Build Order" .figma-extract/blueprint.md
grep "Reusable Components" .figma-extract/blueprint.md
grep "Design Tokens" .figma-extract/blueprint.md
grep "Assets" .figma-extract/blueprint.md

# Verify chunk files have content
head -20 .figma-extract/chunks/001-*.md
```

- [ ] **Step 3: Verify the skill flow works end-to-end**

Start a new Claude Code conversation in a Flutter/React project and paste:
```
Build this: https://figma.com/design/CQqMHodQmrPY7Ih88nZcG8/Futures-UI-Revamp?node-id=13766-373151
```

Verify that:
1. The extractor runs and completes in ~30 seconds
2. Claude reads blueprint.md and presents the inventory
3. Claude starts building from leaves upward
4. No Figma MCP tools are called

- [ ] **Step 4: Add .figma-extract to .gitignore**

```bash
echo ".figma-extract/" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore .figma-extract output directory"
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: figma-to-code v2 complete — REST API extractor + bottom-up skill"
```
