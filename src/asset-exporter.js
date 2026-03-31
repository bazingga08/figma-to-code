// src/asset-exporter.js

export class AssetExporter {
  #root;
  #iconTypes = new Set(['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'ELLIPSE', 'LINE']);

  constructor(rootNode) {
    this.#root = rootNode;
  }

  #slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  #collectAll(node, results = []) {
    results.push(node);
    for (const child of node.children || []) {
      this.#collectAll(child, results);
    }
    return results;
  }

  getExportableAssets() {
    const allNodes = this.#collectAll(this.#root);
    const iconMap = new Map();
    const imageMap = new Map();

    for (const node of allNodes) {
      if (this.#iconTypes.has(node.type)) {
        const key = this.#slugify(node.name);
        if (!iconMap.has(key)) {
          iconMap.set(key, { id: node.id, name: node.name, type: node.type });
        }
      }
      for (const fill of node.fills || []) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          const key = fill.imageRef;
          if (!imageMap.has(key)) {
            imageMap.set(key, { id: node.id, name: node.name, imageRef: fill.imageRef });
          }
        }
      }
    }

    return {
      icons: Array.from(iconMap.values()),
      images: Array.from(imageMap.values()),
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
