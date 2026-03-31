#!/usr/bin/env node
// src/figma-extract.js

import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    node: { type: 'string', short: 'n' },
    token: { type: 'string', short: 't' },
    out: { type: 'string', short: 'o', default: '.figma-extract' },
  },
});

if (!values.file || !values.node) {
  console.error('Usage: figma-extract --file=<fileKey> --node=<nodeId> [--token=<token>] [--out=<dir>]');
  console.error('  --token defaults to $FIGMA_ACCESS_TOKEN env var');
  process.exit(1);
}

const token = values.token || process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error('Error: No Figma token. Set --token or $FIGMA_ACCESS_TOKEN');
  process.exit(1);
}

console.log(`figma-extract v2.0.0`);
console.log(`File: ${values.file}`);
console.log(`Node: ${values.node}`);
console.log(`Output: ${values.out}`);
