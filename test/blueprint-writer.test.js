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
