// src/asset-exporter.js

export class AssetExporter {
  #root;

  // Generic names that indicate sub-paths, not real icons
  static #JUNK_NAME_PATTERNS = [
    /^Vector(\s+\d+)?(\s*\(Stroke\))?$/i,    // "Vector", "Vector 44", "Vector 1 (Stroke)"
    /^Rectangle\s+\d+$/i,                      // "Rectangle 26", "Rectangle 36382"
    /^Line\s+\d+(\s*\(Stroke\))?$/i,           // "Line 375", "Line 498 (Stroke)"
    /^Ellipse\s+\d+$/i,                        // "Ellipse 2481", "Ellipse 164"
    /^path\d+$/i,                               // "path279", "path281"
    /^Shape$/i,                                 // "Shape"
    /^Union$/i,                                 // bare "Union" inside boolean ops
    /^Subtract$/i,                              // bare "Subtract" inside boolean ops
    /^Group\s+\d+$/i,                           // "Group 1000002174"
    /^Bounding\s*box$/i,                        // "Bounding box"
  ];

  // Parent types that indicate their children are sub-components, not standalone icons
  static #COMPOUND_PARENT_TYPES = new Set([
    'BOOLEAN_OPERATION',
    'GROUP',
  ]);

  // Semantic name keywords that suggest a real icon
  static #ICON_NAME_KEYWORDS = [
    'icon', 'chevron', 'arrow', 'star', 'search', 'close', 'menu', 'hamburger',
    'wallet', 'home', 'logo', 'coin', 'check', 'info', 'warning', 'error',
    'notification', 'bell', 'settings', 'gear', 'cog', 'plus', 'minus',
    'delete', 'edit', 'copy', 'share', 'download', 'upload', 'refresh',
    'filter', 'sort', 'eye', 'lock', 'unlock', 'user', 'profile',
    'calendar', 'clock', 'chart', 'graph', 'switch', 'toggle',
  ];

  // Standard icon container sizes (logical pixels)
  static #ICON_SIZES = new Set([12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]);

  constructor(rootNode) {
    this.#root = rootNode;
  }

  #slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Check if a name matches junk patterns
  #isJunkName(name) {
    return AssetExporter.#JUNK_NAME_PATTERNS.some(pattern => pattern.test(name.trim()));
  }

  // Check if a name contains semantic icon keywords
  #hasSemanticName(name) {
    const lower = name.toLowerCase();
    return AssetExporter.#ICON_NAME_KEYWORDS.some(kw => lower.includes(kw));
  }

  // Check if dimensions match standard icon sizes
  #isIconSized(node) {
    const w = Math.round(node.absoluteBoundingBox?.width || node.size?.x || 0);
    const h = Math.round(node.absoluteBoundingBox?.height || node.size?.y || 0);
    // Icon containers are typically square or near-square, 12-48px
    return w >= 12 && w <= 48 && h >= 12 && h <= 48;
  }

  // Walk tree collecting exportable icons with parent context
  #collectIcons(node, parentType = null, parentName = null, depth = 0) {
    const results = [];

    // Strategy 1: INSTANCE nodes that are icon-sized with non-junk names
    // These are component instances (e.g., "chevron right", "Coin Logo", "Icon")
    // Skip oversized instances (full cards, status bars, etc.)
    if (node.type === 'INSTANCE') {
      const name = node.name || '';
      if (!this.#isJunkName(name) && this.#isIconSized(node)) {
        results.push({
          id: node.id,
          name: name,
          type: node.type,
          reason: 'instance-component',
        });
        // Don't recurse into instances — we export the whole instance as one icon
        return results;
      }
    }

    // Strategy 2: FRAME nodes that are icon containers (16x16, 24x24, etc.)
    // with semantic names — export the whole frame
    if (node.type === 'FRAME' && this.#isIconSized(node) && this.#hasSemanticName(node.name)) {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        reason: 'icon-frame',
      });
      // Don't recurse — export the whole frame as one icon
      return results;
    }

    // Strategy 3: Standalone STAR nodes (e.g., "Star 9" used as watchlist icon)
    // Only if parent is a small FRAME (icon container)
    if (node.type === 'STAR' && parentType === 'FRAME') {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        reason: 'star-icon',
      });
      return results;
    }

    // Skip: Don't descend into compound shape internals for icon collection
    // (children of BOOLEAN_OPERATION and GROUP are sub-paths, not icons)
    // Exception: we DO recurse into top-level GROUPs/FRAMEs that might contain icons
    if (AssetExporter.#COMPOUND_PARENT_TYPES.has(node.type) && depth > 1) {
      // Only export the compound shape itself if it has a semantic name
      if (this.#hasSemanticName(node.name) && !this.#isJunkName(node.name)) {
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          reason: 'named-compound',
        });
      }
      return results;
    }

    // Recurse into children
    for (const child of node.children || []) {
      results.push(...this.#collectIcons(child, node.type, node.name, depth + 1));
    }

    return results;
  }

  // Collect images (fills with IMAGE type) — these are always valid
  #collectImages(node, results = []) {
    for (const fill of node.fills || []) {
      if (fill.type === 'IMAGE' && fill.imageRef) {
        const key = fill.imageRef;
        if (!results.find(r => r.imageRef === key)) {
          results.push({ id: node.id, name: node.name, imageRef: fill.imageRef });
        }
      }
    }
    for (const child of node.children || []) {
      this.#collectImages(child, results);
    }
    return results;
  }

  getExportableAssets() {
    // Deduplicate icons by slugified name
    const rawIcons = this.#collectIcons(this.#root);
    const iconMap = new Map();
    for (const icon of rawIcons) {
      const key = this.#slugify(icon.name);
      if (!iconMap.has(key)) {
        iconMap.set(key, icon);
      }
    }

    const images = this.#collectImages(this.#root);

    return {
      icons: Array.from(iconMap.values()),
      images,
    };
  }

  getIconNodeIds() {
    return this.getExportableAssets().icons.map(i => i.id);
  }

  getImageNodeIds() {
    return this.getExportableAssets().images.map(i => i.id);
  }

  getManifest(baseDir = 'assets') {
    const assets = this.getExportableAssets();
    const manifest = [];

    for (const icon of assets.icons) {
      const fileName = `${this.#slugify(icon.name)}.svg`;
      manifest.push({
        nodeId: icon.id, name: icon.name, type: 'icon', fileName,
        filePath: `${baseDir}/icons/${fileName}`,
        reason: icon.reason,
      });
    }

    for (const img of assets.images) {
      const fileName = `${this.#slugify(img.name)}.png`;
      manifest.push({
        nodeId: img.id, name: img.name, type: 'image', fileName,
        filePath: `${baseDir}/images/${fileName}`,
      });
    }

    return manifest;
  }
}
