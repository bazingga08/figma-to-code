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
  });

  it('determines layout properties for frames', () => {
    const walker = new TreeWalker(rootDoc);
    const layouts = walker.getLayoutMap();
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
