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

  #addColor(colorSet, r, g, b, a, styleName) {
    const hex = this.#rgbaToHex(r, g, b, a).toUpperCase();
    if (!colorSet.has(hex)) {
      colorSet.set(hex, {
        hex,
        rgba: { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a },
        styleName,
      });
    }
  }

  getColors() {
    const colorSet = new Map();
    const allNodes = this.#collectAllNodes(this.#root);

    for (const node of allNodes) {
      // Fill colors — SOLID + gradient stops
      for (const fill of node.fills || []) {
        if (fill.type === 'SOLID' && fill.color) {
          const { r, g, b, a } = fill.color;
          const opacity = fill.opacity !== undefined ? fill.opacity : 1;
          this.#addColor(colorSet, r, g, b, (a || 1) * opacity, this.#findStyleName(node, 'fill'));
        }
        // Gradient stop colors
        if (fill.gradientStops) {
          for (const stop of fill.gradientStops) {
            const { r, g, b, a } = stop.color;
            this.#addColor(colorSet, r, g, b, a || 1, null);
          }
        }
      }

      // Stroke colors
      for (const stroke of node.strokes || []) {
        if (stroke.type === 'SOLID' && stroke.color) {
          const { r, g, b, a } = stroke.color;
          this.#addColor(colorSet, r, g, b, a || 1, null);
        }
      }

      // Effect colors (shadows)
      for (const effect of node.effects || []) {
        if (effect.color && (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW')) {
          const { r, g, b, a } = effect.color;
          this.#addColor(colorSet, r, g, b, a || 1, this.#findStyleName(node, 'effect'));
        }
      }

      // Text style fills (can differ from node fills)
      if (node.type === 'TEXT' && node.style?.fills) {
        for (const fill of node.style.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b, a } = fill.color;
            this.#addColor(colorSet, r, g, b, a || 1, null);
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
          italic: s.italic || false,
          textCase: s.textCase || 'ORIGINAL',
          textDecoration: s.textDecoration || 'NONE',
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
      if (node.counterAxisSpacing) spacingSet.add(node.counterAxisSpacing);
      if (node.paddingLeft) spacingSet.add(node.paddingLeft);
      if (node.paddingRight) spacingSet.add(node.paddingRight);
      if (node.paddingTop) spacingSet.add(node.paddingTop);
      if (node.paddingBottom) spacingSet.add(node.paddingBottom);
      if (node.style?.paragraphSpacing) spacingSet.add(node.style.paragraphSpacing);
    }
    return Array.from(spacingSet).sort((a, b) => a - b);
  }

  getRadii() {
    const allNodes = this.#collectAllNodes(this.#root);
    const radiiSet = new Set();

    for (const node of allNodes) {
      if (node.cornerRadius) radiiSet.add(node.cornerRadius);
      if (node.rectangleCornerRadii) {
        for (const r of node.rectangleCornerRadii) {
          if (r > 0) radiiSet.add(r);
        }
      }
    }
    return Array.from(radiiSet).sort((a, b) => a - b);
  }

  getShadows() {
    const allNodes = this.#collectAllNodes(this.#root);
    const shadowMap = new Map();

    for (const node of allNodes) {
      for (const effect of node.effects || []) {
        if (effect.visible === false) continue;
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          const c = effect.color || {};
          const key = `${effect.type}|${effect.offset?.x || 0}|${effect.offset?.y || 0}|${effect.radius || 0}|${effect.spread || 0}|${this.#rgbaToHex(c.r || 0, c.g || 0, c.b || 0, c.a || 1)}`;
          if (!shadowMap.has(key)) {
            shadowMap.set(key, {
              type: effect.type,
              offsetX: effect.offset?.x || 0,
              offsetY: effect.offset?.y || 0,
              blur: effect.radius || 0,
              spread: effect.spread || 0,
              color: this.#rgbaToHex(c.r || 0, c.g || 0, c.b || 0, c.a || 1).toUpperCase(),
              styleName: this.#findStyleName(node, 'effect'),
              usageCount: 0,
            });
          }
          shadowMap.get(key).usageCount++;
        }
      }
    }
    return Array.from(shadowMap.values());
  }

  getBorderWidths() {
    const allNodes = this.#collectAllNodes(this.#root);
    const widthSet = new Set();

    for (const node of allNodes) {
      if (node.strokeWeight && node.strokes?.length > 0) {
        widthSet.add(node.strokeWeight);
      }
      if (node.individualStrokeWeights) {
        const sw = node.individualStrokeWeights;
        if (sw.top) widthSet.add(sw.top);
        if (sw.right) widthSet.add(sw.right);
        if (sw.bottom) widthSet.add(sw.bottom);
        if (sw.left) widthSet.add(sw.left);
      }
    }
    return Array.from(widthSet).sort((a, b) => a - b);
  }

  getStyleMap() {
    return { ...this.#stylesMap };
  }
}
