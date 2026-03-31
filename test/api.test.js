// test/api.test.js
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { FigmaAPI } from '../src/api.js';

describe('FigmaAPI', () => {
  it('fetches node tree with correct URL and headers', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ name: 'Test', nodes: { '1:2': { document: { id: '1:2', type: 'FRAME' } } } }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    const result = await api.getNodes('fileKey123', '1:2');

    assert.equal(mockFetch.mock.calls.length, 1);
    const [url, opts] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /api\.figma\.com\/v1\/files\/fileKey123\/nodes/);
    assert.match(url, /ids=1%3A2/);
    assert.equal(opts.headers['X-Figma-Token'], 'test-token');
    assert.equal(result.nodes['1:2'].document.type, 'FRAME');
  });

  it('fetches nodes with depth parameter', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ name: 'Test', nodes: {} }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    await api.getNodes('fileKey123', '1:2', { depth: 1 });

    const [url] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /depth=1/);
  });

  it('throws on non-OK response', async () => {
    const mockResponse = { ok: false, status: 403, statusText: 'Forbidden' };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    await assert.rejects(() => api.getNodes('fileKey123', '1:2'), /403/);
  });

  it('fetches batch screenshots', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        images: { '1:2': 'https://example.com/img1.png', '3:4': 'https://example.com/img2.png' },
      }),
    };
    const mockFetch = mock.fn(() => Promise.resolve(mockResponse));

    const api = new FigmaAPI('test-token', mockFetch);
    const result = await api.getImages('fileKey123', ['1:2', '3:4'], { format: 'png', scale: 2 });

    const [url] = mockFetch.mock.calls[0].arguments;
    assert.match(url, /api\.figma\.com\/v1\/images\/fileKey123/);
    assert.match(url, /ids=1%3A2%2C3%3A4/);
    assert.match(url, /format=png/);
    assert.match(url, /scale=2/);
    assert.equal(result.images['1:2'], 'https://example.com/img1.png');
  });
});
