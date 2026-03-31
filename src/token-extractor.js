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

  #collectAllNodes(node, results = []) {
    results.push(node);
    for (const child of node.children || []) {
      this.#collectAllNodes(child, results);
    }
    return results;
  }

  #collectNodes(node, type, results = []) {
    if (node.type === type) results.push(node);
    for (const child of node.children || []) {
      this.#collectNodes(child, type, results);
    }
    return results;
  }

  getColors() {
    const colorSet = new Map();
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
