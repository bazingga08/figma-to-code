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
