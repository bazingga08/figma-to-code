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

  #formatGradientAngle(handles) {
    if (!handles || handles.length < 2) return '';
    const dx = handles[1].x - handles[0].x;
    const dy = handles[1].y - handles[0].y;
    const angle = Math.round(Math.atan2(dy, dx) * 180 / Math.PI + 90);
    return `${((angle % 360) + 360) % 360}deg`;
  }

  #formatColor(fill) {
    if (!fill) return '-';
    if (fill.type === 'SOLID' && fill.color) {
      const opacity = fill.opacity !== undefined ? fill.opacity : 1;
      const a = (fill.color.a !== undefined ? fill.color.a : 1) * opacity;
      return this.#rgbaToHex(fill.color.r, fill.color.g, fill.color.b, a);
    }
    // All gradient types with full stop data + angle
    if (fill.gradientStops) {
      const stops = fill.gradientStops.map(s => {
        const c = s.color;
        const opacity = fill.opacity !== undefined ? fill.opacity : 1;
        return `${this.#rgbaToHex(c.r, c.g, c.b, c.a * opacity)} ${Math.round(s.position * 100)}%`;
      }).join(', ');
      const angle = this.#formatGradientAngle(fill.gradientHandlePositions);

      if (fill.type === 'GRADIENT_LINEAR') return `linear-gradient(${angle}, ${stops})`;
      if (fill.type === 'GRADIENT_RADIAL') return `radial-gradient(${stops})`;
      if (fill.type === 'GRADIENT_ANGULAR') return `conic-gradient(${angle}, ${stops})`;
      if (fill.type === 'GRADIENT_DIAMOND') return `diamond-gradient(${angle}, ${stops})`;
    }
    if (fill.type === 'IMAGE') {
      let s = `IMAGE (ref: ${fill.imageRef || '?'}`;
      if (fill.scaleMode) s += `, scale: ${fill.scaleMode}`;
      if (fill.rotation) s += `, rotation: ${fill.rotation}`;
      if (fill.filters) {
        const f = fill.filters;
        const parts = [];
        if (f.exposure) parts.push(`exposure:${f.exposure}`);
        if (f.contrast) parts.push(`contrast:${f.contrast}`);
        if (f.saturation) parts.push(`saturation:${f.saturation}`);
        if (f.temperature) parts.push(`temperature:${f.temperature}`);
        if (f.tint) parts.push(`tint:${f.tint}`);
        if (parts.length) s += `, filters: ${parts.join(' ')}`;
      }
      s += ')';
      return s;
    }
    return fill.type;
  }

  #formatEffect(effect) {
    if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
      const c = effect.color;
      const color = c ? this.#rgbaToHex(c.r, c.g, c.b, c.a) : '?';
      const ox = effect.offset?.x || 0;
      const oy = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      const spread = effect.spread || 0;
      const prefix = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
      return `${prefix}${ox}px ${oy}px ${blur}px ${spread}px ${color}`;
    }
    if (effect.type === 'LAYER_BLUR') return `blur(${effect.radius || 0}px)`;
    if (effect.type === 'BACKGROUND_BLUR') return `backdrop-blur(${effect.radius || 0}px)`;
    return effect.type;
  }

  #formatCornerRadius(node) {
    if (node.rectangleCornerRadii) {
      const [tl, tr, br, bl] = node.rectangleCornerRadii;
      if (tl === tr && tr === br && br === bl) return `${tl}px`;
      return `${tl}px ${tr}px ${br}px ${bl}px`;
    }
    if (node.cornerRadius) return `${node.cornerRadius}px`;
    return null;
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

    let md = `# Component: ${node.name}\n`;
    md += `## Node: ${node.id}\n`;
    md += `## Screenshot: screenshots/${String(this.#index).padStart(3, '0')}-${this.#slugify(node.name)}.png\n\n`;

    // Layout section — comprehensive
    md += `## Layout\n`;
    md += `- Type: ${node.type}, auto-layout ${node.layoutMode || 'NONE'}\n`;
    md += `- Width: ${bb.width}px (${node.layoutSizingHorizontal || 'FIXED'}), Height: ${bb.height}px (${node.layoutSizingVertical || 'FIXED'})\n`;

    const pad = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
    md += `- Padding: ${pad}\n`;
    md += `- Gap: ${node.itemSpacing || 0}px\n`;

    // Alignment
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      md += `- Main axis align: ${node.primaryAxisAlignItems || 'MIN'}\n`;
      md += `- Cross axis align: ${node.counterAxisAlignItems || 'MIN'}\n`;
      if (node.layoutWrap) md += `- Wrap: ${node.layoutWrap}\n`;
      if (node.counterAxisSpacing) md += `- Cross axis gap: ${node.counterAxisSpacing}px\n`;
      if (node.counterAxisAlignContent) md += `- Cross axis content: ${node.counterAxisAlignContent}\n`;
    }
    if (node.layoutAlign) md += `- Layout align: ${node.layoutAlign}\n`;
    if (node.layoutGrow) md += `- Layout grow: ${node.layoutGrow}\n`;

    // Responsive constraints
    if (node.minWidth) md += `- Min width: ${node.minWidth}px\n`;
    if (node.maxWidth) md += `- Max width: ${node.maxWidth}px\n`;
    if (node.minHeight) md += `- Min height: ${node.minHeight}px\n`;
    if (node.maxHeight) md += `- Max height: ${node.maxHeight}px\n`;

    // Constraints (for non-auto-layout positioning)
    if (node.constraints) {
      md += `- Constraints: h=${node.constraints.horizontal}, v=${node.constraints.vertical}\n`;
    }

    // Absolute positioning
    if (node.layoutPositioning === 'ABSOLUTE') {
      md += `- Positioning: ABSOLUTE\n`;
    }

    // Clips / overflow
    if (node.clipsContent) md += `- Clips content: true\n`;
    if (node.overflowDirection) md += `- Overflow: ${node.overflowDirection}\n`;

    // Visibility
    if (node.visible === false) md += `- Visible: false\n`;

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      md += `- Opacity: ${node.opacity}\n`;
    }

    // Rotation
    if (node.rotation) md += `- Rotation: ${node.rotation}deg\n`;

    // Blend mode
    if (node.blendMode && node.blendMode !== 'PASS_THROUGH' && node.blendMode !== 'NORMAL') {
      md += `- Blend mode: ${node.blendMode}\n`;
    }

    // Corner smoothing (squircle)
    if (node.cornerSmoothing) md += `- Corner smoothing: ${node.cornerSmoothing}\n`;

    // Mask
    if (node.isMask) md += `- Is mask: true (type: ${node.maskType || 'ALPHA'})\n`;

    // Fills
    const visibleFills = (node.fills || []).filter(f => f.visible !== false);
    if (visibleFills.length > 0) {
      md += `\n## Fills\n`;
      for (const fill of visibleFills) {
        md += `- ${this.#formatColor(fill)}\n`;
      }
    }

    // Strokes / borders
    const visibleStrokes = (node.strokes || []).filter(s => s.visible !== false);
    if (visibleStrokes.length > 0 || node.strokeWeight) {
      md += `\n## Strokes\n`;
      for (const stroke of visibleStrokes) {
        md += `- Color: ${this.#formatColor(stroke)}\n`;
      }
      if (node.strokeWeight) md += `- Weight: ${node.strokeWeight}px\n`;
      if (node.strokeAlign) md += `- Align: ${node.strokeAlign}\n`;
      if (node.strokeCap && node.strokeCap !== 'NONE') md += `- Cap: ${node.strokeCap}\n`;
      if (node.strokeJoin && node.strokeJoin !== 'MITER') md += `- Join: ${node.strokeJoin}\n`;
      if ((node.strokeDashes || node.dashPattern) && (node.strokeDashes || node.dashPattern).length > 0) {
        md += `- Dash: ${(node.strokeDashes || node.dashPattern).join(', ')}\n`;
      }
      if (node.individualStrokeWeights) {
        const sw = node.individualStrokeWeights;
        md += `- Individual: top=${sw.top}px right=${sw.right}px bottom=${sw.bottom}px left=${sw.left}px\n`;
      }
    }

    // Corner radius
    const radius = this.#formatCornerRadius(node);
    if (radius) md += `\n## Corner Radius\n- ${radius}\n`;

    // Effects (shadows, blur)
    const visibleEffects = (node.effects || []).filter(e => e.visible !== false);
    if (visibleEffects.length > 0) {
      md += `\n## Effects\n`;
      for (const effect of visibleEffects) {
        md += `- ${this.#formatEffect(effect)}\n`;
      }
    }

    // Children
    if (node.children && node.children.length > 0) {
      md += `\n## Children\n`;
      md += this.#renderChildren(node.children, 0);
    }

    return md;
  }

  #renderChildren(children, depth) {
    let md = '';
    const indent = '  '.repeat(depth);
    let num = 0;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      // Skip invisible nodes
      if (child.visible === false) continue;
      num++;
      const label = `${num}.`;

      if (child.type === 'TEXT') {
        md += this.#renderTextNode(child, indent, label);
      } else if (child.type === 'INSTANCE') {
        md += this.#renderInstanceNode(child, indent, label);
      } else {
        md += this.#renderFrameNode(child, indent, label, depth);
      }
    }
    return md;
  }

  #renderTextNode(child, indent, num) {
    const s = child.style || {};
    // Use style-level fills first, then node-level fills
    const fills = (s.fills && s.fills.length > 0) ? s.fills : child.fills;
    const color = (fills && fills[0]) ? this.#formatColor(fills[0]) : '-';

    let md = `${indent}${num} **${child.name}**: TEXT "${child.characters}"`;
    md += ` | ${s.fontFamily || '?'}`;
    if (s.italic) md += ' italic';
    md += ` ${s.fontWeight || '?'} ${s.fontSize || '?'}px`;
    md += `/${s.lineHeightPx != null ? s.lineHeightPx + 'px' : 'auto'}`;
    md += ` ${color}`;

    // Letter spacing
    if (s.letterSpacing && s.letterSpacing !== 0) md += ` ls:${s.letterSpacing}px`;

    // Text decoration
    if (s.textDecoration && s.textDecoration !== 'NONE') md += ` decoration:${s.textDecoration}`;

    // Text case (UPPER, LOWER, TITLE, SMALL_CAPS, etc.)
    if (s.textCase && s.textCase !== 'ORIGINAL') md += ` case:${s.textCase}`;

    // Horizontal align
    if (s.textAlignHorizontal && s.textAlignHorizontal !== 'LEFT') md += ` hAlign:${s.textAlignHorizontal}`;

    // Vertical align
    if (s.textAlignVertical && s.textAlignVertical !== 'TOP') md += ` vAlign:${s.textAlignVertical}`;

    // Text auto-resize (NONE = fixed box, HEIGHT = auto height, WIDTH_AND_HEIGHT = hug)
    if (s.textAutoResize && s.textAutoResize !== 'NONE') md += ` autoResize:${s.textAutoResize}`;

    // Truncation + max lines
    if (child.textTruncation && child.textTruncation !== 'DISABLED') md += ` truncate:${child.textTruncation}`;
    if (child.maxLines) md += ` maxLines:${child.maxLines}`;

    // Paragraph spacing
    if (s.paragraphSpacing) md += ` paraSpacing:${s.paragraphSpacing}px`;

    // Opacity
    if (child.opacity !== undefined && child.opacity !== 1) md += ` opacity:${child.opacity}`;

    md += '\n';

    // Mixed styles (characterStyleOverrides) — critical for rich text
    if (child.characterStyleOverrides && child.characterStyleOverrides.length > 0 && child.styleOverrideTable) {
      const overrides = Object.entries(child.styleOverrideTable);
      if (overrides.length > 0) {
        md += `${indent}  *Mixed styles:*\n`;
        for (const [key, override] of overrides) {
          const parts = [];
          if (override.fontFamily) parts.push(override.fontFamily);
          if (override.fontWeight) parts.push(`w${override.fontWeight}`);
          if (override.fontSize) parts.push(`${override.fontSize}px`);
          if (override.italic) parts.push('italic');
          if (override.fills && override.fills[0]) parts.push(this.#formatColor(override.fills[0]));
          if (override.textDecoration) parts.push(override.textDecoration);
          if (parts.length) md += `${indent}  - override[${key}]: ${parts.join(' ')}\n`;
        }
      }
    }

    return md;
  }

  #renderInstanceNode(child, indent, num) {
    const bb = child.absoluteBoundingBox || {};
    let md = `${indent}${num} **${child.name}** (INSTANCE of \`${child.componentId}\`)`;
    md += ` ${bb.width || '?'}x${bb.height || '?'}`;

    // Instance overrides / properties
    if (child.componentProperties) {
      const props = Object.entries(child.componentProperties);
      if (props.length > 0) {
        const propStr = props.map(([k, v]) => `${k}=${v.value}`).join(', ');
        md += ` props: {${propStr}}`;
      }
    }

    // Opacity
    if (child.opacity !== undefined && child.opacity !== 1) {
      md += ` opacity:${child.opacity}`;
    }

    md += '\n';
    return md;
  }

  #renderFrameNode(child, indent, num, depth) {
    const bb = child.absoluteBoundingBox || {};
    let md = `${indent}${num} **${child.name}** (${child.type}, ${child.layoutMode || 'NONE'}, ${bb.width || '?'}x${bb.height || '?'})`;

    // Padding if present
    if (child.paddingTop || child.paddingRight || child.paddingBottom || child.paddingLeft) {
      md += ` pad:${child.paddingTop || 0}/${child.paddingRight || 0}/${child.paddingBottom || 0}/${child.paddingLeft || 0}`;
    }

    // Gap
    if (child.itemSpacing) md += ` gap:${child.itemSpacing}`;

    // Alignment
    if (child.primaryAxisAlignItems && child.primaryAxisAlignItems !== 'MIN') {
      md += ` mainAxis:${child.primaryAxisAlignItems}`;
    }
    if (child.counterAxisAlignItems && child.counterAxisAlignItems !== 'MIN') {
      md += ` crossAxis:${child.counterAxisAlignItems}`;
    }

    // Corner radius
    const radius = this.#formatCornerRadius(child);
    if (radius) md += ` radius:${radius}`;

    // Fills — inline for children
    const visibleFills = (child.fills || []).filter(f => f.visible !== false);
    if (visibleFills.length > 0) {
      const fillStr = visibleFills.map(f => this.#formatColor(f)).join(', ');
      md += ` bg:${fillStr}`;
    }

    // Strokes
    const visibleStrokes = (child.strokes || []).filter(s => s.visible !== false);
    if (visibleStrokes.length > 0 && child.strokeWeight) {
      md += ` border:${child.strokeWeight}px ${this.#formatColor(visibleStrokes[0])}`;
    }

    // Effects
    const visibleEffects = (child.effects || []).filter(e => e.visible !== false);
    if (visibleEffects.length > 0) {
      md += ` effects:[${visibleEffects.map(e => this.#formatEffect(e)).join('; ')}]`;
    }

    // Opacity
    if (child.opacity !== undefined && child.opacity !== 1) {
      md += ` opacity:${child.opacity}`;
    }

    // Clips content
    if (child.clipsContent) md += ` clip:true`;
    if (child.overflowDirection) md += ` overflow:${child.overflowDirection}`;

    // Layout sizing
    if (child.layoutSizingHorizontal === 'FILL') md += ` w:FILL`;
    if (child.layoutSizingHorizontal === 'HUG') md += ` w:HUG`;
    if (child.layoutSizingVertical === 'FILL') md += ` h:FILL`;
    if (child.layoutSizingVertical === 'HUG') md += ` h:HUG`;

    // Layout grow + align
    if (child.layoutGrow) md += ` grow:${child.layoutGrow}`;
    if (child.layoutAlign && child.layoutAlign !== 'INHERIT') md += ` align:${child.layoutAlign}`;

    // Absolute positioning within auto-layout parent
    if (child.layoutPositioning === 'ABSOLUTE') md += ` pos:ABSOLUTE`;

    // Constraints
    if (child.constraints) {
      md += ` constraints:h=${child.constraints.horizontal},v=${child.constraints.vertical}`;
    }

    // Min/max size
    if (child.minWidth) md += ` minW:${child.minWidth}`;
    if (child.maxWidth) md += ` maxW:${child.maxWidth}`;
    if (child.minHeight) md += ` minH:${child.minHeight}`;
    if (child.maxHeight) md += ` maxH:${child.maxHeight}`;

    // Rotation
    if (child.rotation) md += ` rotate:${child.rotation}deg`;

    // Corner smoothing
    if (child.cornerSmoothing) md += ` smooth:${child.cornerSmoothing}`;

    // Mask
    if (child.isMask) md += ` mask:${child.maskType || 'ALPHA'}`;

    md += '\n';

    if (child.children) {
      md += this.#renderChildren(child.children, depth + 1);
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
    md += `- Gap: ${node.itemSpacing || 0}px\n`;

    // Alignment
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      md += `- Main axis align: ${node.primaryAxisAlignItems || 'MIN'}\n`;
      md += `- Cross axis align: ${node.counterAxisAlignItems || 'MIN'}\n`;
    }

    // Corner radius
    const radius = this.#formatCornerRadius(node);
    if (radius) md += `- Corner radius: ${radius}\n`;

    // Fills
    const visibleFills = (node.fills || []).filter(f => f.visible !== false);
    if (visibleFills.length > 0) {
      md += `- Background: ${visibleFills.map(f => this.#formatColor(f)).join(', ')}\n`;
    }

    // Strokes
    const visibleStrokes = (node.strokes || []).filter(s => s.visible !== false);
    if (visibleStrokes.length > 0 && node.strokeWeight) {
      md += `- Border: ${node.strokeWeight}px ${this.#formatColor(visibleStrokes[0])}\n`;
    }

    // Effects
    const visibleEffects = (node.effects || []).filter(e => e.visible !== false);
    if (visibleEffects.length > 0) {
      md += `- Effects: ${visibleEffects.map(e => this.#formatEffect(e)).join('; ')}\n`;
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity !== 1) {
      md += `- Opacity: ${node.opacity}\n`;
    }

    // Clips
    if (node.clipsContent) md += `- Clips content: true\n`;

    md += `\n## Child Chunks (assemble in order)\n`;
    for (const childId of this.#chunk.childChunkIds) {
      md += `- \`${childId}\`\n`;
    }

    return md;
  }

  #slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
