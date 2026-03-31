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
