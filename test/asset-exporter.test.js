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

  it('deduplicates assets by name', () => {
    const exporter = new AssetExporter(rootDoc);
    const assets = exporter.getExportableAssets();
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
