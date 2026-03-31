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
  console.error('  --token defaults to $FIGMA_ACCESS_TOKEN env var');
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

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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
  const radii = tokenExtractor.getRadii();
  const shadows = tokenExtractor.getShadows();
  const borderWidths = tokenExtractor.getBorderWidths();
  console.log(`  Colors: ${colors.length} | Typography: ${typography.length} | Spacing: ${spacing.length} | Radii: ${radii.length} | Shadows: ${shadows.length} | Borders: ${borderWidths.length}`);

  // 5. Asset inventory & download
  console.log('\n[5/6] Building asset inventory...');
  const assetExporter = new AssetExporter(rootDoc);
  const assetManifest = assetExporter.getManifest(join(outDir, 'assets'));
  const iconIds = assetExporter.getIconNodeIds();
  const imageIds = assetExporter.getImageNodeIds();
  console.log(`  Icons: ${iconIds.length} | Images: ${imageIds.length}`);

  // Fetch screenshots for chunks (batch in groups of 50 to avoid URI too large)
  const allScreenshotIds = [nodeId, ...chunks.map(c => c.id)];
  const BATCH_SIZE = 50;
  console.log(`  Fetching ${allScreenshotIds.length} screenshots in batches of ${BATCH_SIZE}...`);
  for (let b = 0; b < allScreenshotIds.length; b += BATCH_SIZE) {
    const batch = allScreenshotIds.slice(b, b + BATCH_SIZE);
    try {
      const screenshotResult = await api.getImages(fileKey, batch, { format: 'png', scale: 2 });
      for (const [id, url] of Object.entries(screenshotResult.images || {})) {
        if (url) {
          const idx = id === nodeId ? -1 : chunks.findIndex(c => c.id === id);
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
      console.log(`    Batch ${Math.floor(b / BATCH_SIZE) + 1}/${Math.ceil(allScreenshotIds.length / BATCH_SIZE)} done`);
    } catch (e) {
      console.warn(`  Warning: Screenshot batch failed: ${e.message}. Continuing.`);
    }
  }

  // Export icons as SVG (batched)
  if (iconIds.length > 0) {
    console.log(`  Exporting ${iconIds.length} icons as SVG in batches of ${BATCH_SIZE}...`);
    for (let b = 0; b < iconIds.length; b += BATCH_SIZE) {
      const batch = iconIds.slice(b, b + BATCH_SIZE);
      try {
        const iconResult = await api.getImages(fileKey, batch, { format: 'svg' });
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
        console.warn(`  Warning: Icon batch export failed: ${e.message}. Continuing.`);
      }
    }
  }

  // Export images (fill images — uses getImageFills API)
  if (imageIds.length > 0) {
    console.log(`  Exporting ${imageIds.length} images as PNG...`);
    try {
      const fillsResult = await api.getImageFills(fileKey);
      const imageFills = fillsResult.meta?.images || {};
      for (const entry of assetManifest.filter(a => a.type === 'image')) {
        // Find the imageRef for this entry from the asset exporter
        const assets = assetExporter.getExportableAssets();
        const imgAsset = assets.images.find(i => i.id === entry.nodeId);
        if (imgAsset?.imageRef && imageFills[imgAsset.imageRef]) {
          try {
            await api.downloadImage(imageFills[imgAsset.imageRef], entry.filePath);
          } catch (e) {
            console.warn(`  Warning: Failed to download image ${entry.name}: ${e.message}`);
          }
        }
      }
      console.log(`  ${imageIds.length} images exported`);
    } catch (e) {
      console.warn(`  Warning: Image fills fetch failed: ${e.message}. Continuing.`);
    }
  }

  // 6. Write output files
  console.log('\n[6/6] Writing output files...');

  // Blueprint
  const blueprint = new BlueprintWriter({
    hierarchy,
    buildOrder,
    reusables,
    tokens: { colors, typography, spacing, radii, shadows, borderWidths },
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

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
