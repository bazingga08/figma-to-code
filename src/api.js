// src/api.js

const BASE_URL = 'https://api.figma.com/v1';

export class FigmaAPI {
  #token;
  #fetch;

  constructor(token, fetchFn = globalThis.fetch) {
    this.#token = token;
    this.#fetch = fetchFn;
  }

  async #request(url) {
    const res = await this.#fetch(url, {
      headers: { 'X-Figma-Token': this.#token },
    });
    if (!res.ok) {
      throw new Error(`Figma API ${res.status} ${res.statusText}: ${url}`);
    }
    return res.json();
  }

  async getNodes(fileKey, nodeId, opts = {}) {
    const params = new URLSearchParams({ ids: nodeId });
    if (opts.depth !== undefined) params.set('depth', opts.depth);
    return this.#request(`${BASE_URL}/files/${fileKey}/nodes?${params}`);
  }

  async getImages(fileKey, nodeIds, opts = {}) {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: opts.format || 'png',
    });
    if (opts.scale) params.set('scale', opts.scale);
    return this.#request(`${BASE_URL}/images/${fileKey}?${params}`);
  }

  async downloadImage(url, destPath) {
    const res = await this.#fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const { writeFile } = await import('node:fs/promises');
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
    return destPath;
  }
}
