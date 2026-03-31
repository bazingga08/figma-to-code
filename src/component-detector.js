// src/component-detector.js

export class ComponentDetector {
  #root;
  #componentsMap;
  #instances = [];

  constructor(rootNode, componentsMap = {}) {
    this.#root = rootNode;
    this.#componentsMap = componentsMap;
    this.#collectInstances(rootNode);
  }

  #collectInstances(node) {
    if (node.type === 'INSTANCE') {
      this.#instances.push(node);
    }
    for (const child of node.children || []) {
      this.#collectInstances(child);
    }
  }

  getInstances() {
    return this.#instances;
  }

  getReusableComponents() {
    const groups = {};
    for (const inst of this.#instances) {
      const compId = inst.componentId;
      if (!groups[compId]) {
        const meta = this.#componentsMap[compId] || {};
        groups[compId] = {
          componentId: compId,
          name: meta.name || inst.name || 'Unknown',
          key: meta.key || null,
          description: meta.description || null,
          instances: [],
          usageCount: 0,
        };
      }
      groups[compId].instances.push({
        instanceId: inst.id,
        instanceName: inst.name,
        overrides: inst.overrides || [],
        componentProperties: inst.componentProperties || {},
      });
      groups[compId].usageCount++;
    }
    return groups;
  }
}
