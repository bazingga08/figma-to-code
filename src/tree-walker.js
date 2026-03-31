// src/tree-walker.js

export class TreeWalker {
  #root;
  #nodeMap = new Map();
  #parentMap = new Map();

  constructor(rootNode) {
    this.#root = rootNode;
    this.#indexTree(rootNode, null);
  }

  #indexTree(node, parentId) {
    this.#nodeMap.set(node.id, node);
    if (parentId) this.#parentMap.set(node.id, parentId);
    for (const child of node.children || []) {
      this.#indexTree(child, node.id);
    }
  }

  getHierarchy() {
    return this.#buildHierarchyNode(this.#root);
  }

  #buildHierarchyNode(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      children: (node.children || []).map(c => this.#buildHierarchyNode(c)),
    };
  }

  countNodes() {
    return this.#nodeMap.size;
  }

  getNodesByType() {
    const result = {};
    for (const node of this.#nodeMap.values()) {
      if (!result[node.type]) result[node.type] = [];
      result[node.type].push(node);
    }
    return result;
  }

  getLayoutMap() {
    const layouts = {};
    for (const node of this.#nodeMap.values()) {
      if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'COMPONENT') {
        const bb = node.absoluteBoundingBox || {};
        layouts[node.id] = {
          width: bb.width,
          height: bb.height,
          layoutMode: node.layoutMode || 'NONE',
          itemSpacing: node.itemSpacing || 0,
          paddingLeft: node.paddingLeft || 0,
          paddingRight: node.paddingRight || 0,
          paddingTop: node.paddingTop || 0,
          paddingBottom: node.paddingBottom || 0,
          primaryAxisAlignItems: node.primaryAxisAlignItems || 'MIN',
          counterAxisAlignItems: node.counterAxisAlignItems || 'MIN',
          layoutSizingHorizontal: node.layoutSizingHorizontal || 'FIXED',
          layoutSizingVertical: node.layoutSizingVertical || 'FIXED',
          clipsContent: node.clipsContent || false,
        };
      }
    }
    return layouts;
  }

  getBuildOrder() {
    const order = [];
    this.#postOrder(this.#root, order);
    return order;
  }

  #postOrder(node, order) {
    for (const child of node.children || []) {
      this.#postOrder(child, order);
    }
    order.push({
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: this.#parentMap.get(node.id) || null,
      childCount: (node.children || []).length,
      isLeaf: !(node.children && node.children.length > 0),
    });
  }

  #estimateTokens(node) {
    const json = JSON.stringify(node);
    return Math.ceil(json.length / 4);
  }

  #stripChildren(node) {
    const { children, ...rest } = node;
    return rest;
  }

  chunkTree(opts = {}) {
    const maxTokens = opts.maxTokens || 10000;
    const chunks = [];
    this.#chunkNode(this.#root, chunks, maxTokens);
    return chunks;
  }

  #chunkNode(node, chunks, maxTokens) {
    const tokens = this.#estimateTokens(node);

    if (tokens <= maxTokens || !(node.children && node.children.length > 0)) {
      chunks.push({
        id: node.id,
        name: node.name,
        type: node.type,
        isLeaf: !(node.children && node.children.length > 0),
        parentId: this.#parentMap.get(node.id) || null,
        tokenEstimate: tokens,
        nodeData: node,
        childChunkIds: [],
      });
      return;
    }

    const childChunkIds = [];
    for (const child of node.children) {
      this.#chunkNode(child, chunks, maxTokens);
      childChunkIds.push(child.id);
    }

    chunks.push({
      id: node.id,
      name: node.name,
      type: node.type,
      isLeaf: false,
      parentId: this.#parentMap.get(node.id) || null,
      tokenEstimate: this.#estimateTokens(this.#stripChildren(node)),
      nodeData: this.#stripChildren(node),
      childChunkIds,
    });
  }
}
