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

  // Only FRAME, INSTANCE, COMPONENT are meaningful chunk boundaries.
  // VECTORs, GROUPs, TEXTs, etc. stay inside their parent chunk.
  #isChunkable(node) {
    return ['FRAME', 'INSTANCE', 'COMPONENT', 'COMPONENT_SET'].includes(node.type);
  }

  #chunkNode(node, chunks, maxTokens) {
    const tokens = this.#estimateTokens(node);

    // Fits in one chunk, or not a chunkable type — keep as single chunk
    if (tokens <= maxTokens || !this.#isChunkable(node) || !(node.children && node.children.length > 0)) {
      chunks.push({
        id: node.id,
        name: node.name,
        type: node.type,
        isLeaf: true,
        parentId: this.#parentMap.get(node.id) || null,
        tokenEstimate: tokens,
        nodeData: node,
        childChunkIds: [],
      });
      return;
    }

    // Too big — only split at chunkable children (FRAME/INSTANCE/COMPONENT)
    const childChunkIds = [];
    const inlineChildren = []; // non-chunkable children stay in parent

    for (const child of node.children) {
      if (this.#isChunkable(child) && this.#estimateTokens(child) > maxTokens / 4) {
        // Large enough chunkable child — give it its own chunk
        this.#chunkNode(child, chunks, maxTokens);
        childChunkIds.push(child.id);
      } else {
        // Small or non-chunkable — stays inline in parent
        inlineChildren.push(child);
      }
    }

    // If nothing was split out, keep as a single chunk
    if (childChunkIds.length === 0) {
      chunks.push({
        id: node.id,
        name: node.name,
        type: node.type,
        isLeaf: true,
        parentId: this.#parentMap.get(node.id) || null,
        tokenEstimate: tokens,
        nodeData: node,
        childChunkIds: [],
      });
      return;
    }

    // Parent becomes assembly chunk with inline children kept
    const parentData = { ...this.#stripChildren(node) };
    if (inlineChildren.length > 0) {
      parentData.children = inlineChildren;
    }

    chunks.push({
      id: node.id,
      name: node.name,
      type: node.type,
      isLeaf: false,
      parentId: this.#parentMap.get(node.id) || null,
      tokenEstimate: this.#estimateTokens(parentData),
      nodeData: parentData,
      childChunkIds,
    });
  }
}
