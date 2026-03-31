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
