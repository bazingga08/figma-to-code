// src/blueprint-writer.js

export class BlueprintWriter {
  #data;

  constructor(data) {
    this.#data = data;
  }

  generate() {
    const sections = [
      this.#title(),
      this.#treeSection(),
      this.#buildOrderSection(),
      this.#reusablesSection(),
      this.#tokensSection(),
      this.#assetSection(),
    ];
    return sections.join('\n\n---\n\n');
  }

  #title() {
    const root = this.#data.hierarchy;
    return `# Blueprint: ${root.name}\n\n` +
      `- **Root ID:** \`${root.id}\`\n` +
      `- **Type:** ${root.type}`;
  }

  #treeSection() {
    let md = '## Tree Structure\n\n```\n';
    md += this.#renderTree(this.#data.hierarchy, '', true, true);
    md += '```';
    return md;
  }

  #renderTree(node, prefix, isLast, isRoot = false) {
    const connector = isLast ? '└─ ' : '├─ ';
    const childPrefix = isLast ? '   ' : '│  ';
    let line = isRoot
      ? `${node.name} (${node.type})\n`
      : `${prefix}${connector}${node.name} (${node.type})\n`;

    const children = node.children || [];
    const nextPrefix = isRoot ? '' : prefix + childPrefix;
    for (let i = 0; i < children.length; i++) {
      const isChildLast = i === children.length - 1;
      line += this.#renderTree(children[i], nextPrefix, isChildLast);
    }
    return line;
  }

  #buildOrderSection() {
    const order = this.#data.buildOrder;
    if (!order.length) return '## Build Order\n\nNo items.';

    let md = '## Build Order\n\nBuild in this order (leaves first, parents last):\n\n';
    md += '| # | Name | Type | Leaf? |\n';
    md += '|---|---|---|---|\n';
    for (let i = 0; i < order.length; i++) {
      const item = order[i];
      md += `| ${i + 1} | ${item.name} | ${item.type} | ${item.isLeaf ? 'yes' : 'assembly'} |\n`;
    }
    return md;
  }

  #reusablesSection() {
    const reusables = this.#data.reusables;
    const entries = Object.entries(reusables);
    if (!entries.length) return '## Reusable Components\n\nNone detected.';

    let md = '## Reusable Components\n\nBuild these once, reuse across instances:\n\n';
    md += '| Component | Used | Varies |\n';
    md += '|---|---|---|\n';
    for (const [id, comp] of entries) {
      const varies = comp.instances
        .flatMap(i => Object.keys(i.componentProperties || {}))
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ') || 'none';
      md += `| ${comp.name} | ${comp.usageCount}x | ${varies} |\n`;
    }
    return md;
  }

  #tokensSection() {
    const { colors, typography, spacing } = this.#data.tokens;
    let md = '## Design Tokens\n\n';

    md += '### Colors\n\n';
    if (colors.length) {
      md += '| Hex | Style Name |\n|---|---|\n';
      for (const c of colors) {
        md += `| ${c.hex} | ${c.styleName || '-'} |\n`;
      }
    } else {
      md += 'No colors extracted.\n';
    }

    md += '\n### Typography\n\n';
    if (typography.length) {
      md += '| Font | Weight | Size | Line Height | Letter Spacing | Italic | Case |\n|---|---|---|---|---|---|---|\n';
      for (const t of typography) {
        md += `| ${t.fontFamily} | ${t.fontWeight} | ${t.fontSize}px | ${t.lineHeight ? t.lineHeight + 'px' : 'auto'} | ${t.letterSpacing || 0}px | ${t.italic ? 'yes' : '-'} | ${t.textCase !== 'ORIGINAL' ? t.textCase : '-'} |\n`;
      }
    } else {
      md += 'No typography extracted.\n';
    }

    md += '\n### Spacing Scale\n\n';
    md += spacing.length ? spacing.map(s => `\`${s}px\``).join(', ') : 'No spacing extracted.';

    const radii = this.#data.tokens.radii || [];
    if (radii.length) {
      md += '\n\n### Border Radius Scale\n\n';
      md += radii.map(r => `\`${r}px\``).join(', ');
    }

    const shadows = this.#data.tokens.shadows || [];
    if (shadows.length) {
      md += '\n\n### Shadows\n\n';
      md += '| Type | Offset | Blur | Spread | Color | Uses |\n|---|---|---|---|---|---|\n';
      for (const s of shadows) {
        md += `| ${s.type} | ${s.offsetX},${s.offsetY} | ${s.blur}px | ${s.spread}px | ${s.color} | ${s.usageCount}x |\n`;
      }
    }

    const borderWidths = this.#data.tokens.borderWidths || [];
    if (borderWidths.length) {
      md += '\n\n### Border Widths\n\n';
      md += borderWidths.map(w => `\`${w}px\``).join(', ');
    }

    return md;
  }

  #assetSection() {
    const manifest = this.#data.assetManifest;
    if (!manifest.length) return '## Assets\n\nNo assets to export.';

    let md = '## Assets\n\n';
    md += '| Type | Name | Path |\n|---|---|---|\n';
    for (const a of manifest) {
      md += `| ${a.type} | ${a.name} | \`${a.filePath}\` |\n`;
    }
    return md;
  }
}
