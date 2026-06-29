#!/usr/bin/env node

/**
 * encode-data.mjs
 *
 * Reads src/data/linhas.ts and src/data/paradas.ts, extracts the data objects,
 * encodes them with XOR + Base64, and writes encoded versions back to the same files.
 *
 * Usage: node scripts/encode-data.mjs [--decode]
 *
 * --decode: Decode mode (for verification only)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = resolve(__dirname, '../src/data');

const XOR_KEY = new Uint8Array([
  0x49, 0x4e, 0x54, 0x45, 0x52, 0x4e, 0x4f, 0x2d, 0x52, 0x4f, 0x54, 0x41, 0x53, 0x2d, 0x32, 0x30,
  0x32, 0x34, 0x2d, 0x56, 0x31, 0x00, 0xff, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc,
]);

function xorBytes(data, key) {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encode(data) {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  const encrypted = xorBytes(bytes, XOR_KEY);
  return bytesToBase64(encrypted);
}

function decode(encoded) {
  const encrypted = base64ToBytes(encoded);
  const decrypted = xorBytes(encrypted, XOR_KEY);
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json);
}

// Extract the data object from a TypeScript file by counting brackets
function extractData(content) {
  // Find the start: "const varname = {" or "const varname: SomeType = {"
  const startMatch = content.match(/const\s+\w+\s*.*?=\s*(\{)/);
  if (!startMatch) {
    throw new Error('Could not find data object start');
  }

  const startIdx = startMatch.index + startMatch[0].length - 1;
  let depth = 0;
  let endIdx = startIdx;

  // Count brackets to find the matching closing brace
  for (let i = startIdx; i < content.length; i++) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const dataStr = content.slice(startIdx, endIdx);
  // Use Function constructor to evaluate the object literal
  return new Function(`return (${dataStr})`)();
}

// Generate encoded TypeScript file
function generateEncodedFile(originalContent, encodedString, typeName) {
  // Determine the variable name
  const varMatch = originalContent.match(/const\s+(\w+)\s*[:=]/);
  const varName = varMatch ? varMatch[1] : 'data';

  // Determine the default export name
  const exportMatch = originalContent.match(/export\s+default\s+(\w+)/);
  const exportName = exportMatch ? exportMatch[1] : varName;

  return `import { decodeObfuscated } from '../lib/dataCodec';
import type { ${typeName} } from '../types/data.types';

const encoded = '${encodedString}';

const ${varName}: ${typeName} = decodeObfuscated(encoded);

export default ${exportName};
`;
}

function processFile(filename, typeName) {
  const filePath = resolve(SRC_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');

  try {
    const data = extractData(content);
    const encoded = encode(data);

    // Verify round-trip
    const decoded = decode(encoded);
    if (JSON.stringify(decoded) !== JSON.stringify(data)) {
      throw new Error('Round-trip verification failed!');
    }

    const newContent = generateEncodedFile(content, encoded, typeName);
    writeFileSync(filePath, newContent, 'utf-8');

    return true;
  } catch (_err) {
    return false;
  }
}

// Main
const isDecode = process.argv.includes('--decode');

if (isDecode) {
  for (const [filename, typeName] of [
    ['linhas.ts', 'CategoriaLinhas'],
    ['paradas.ts', '{ paradas: Parada[] }'],
  ]) {
    const filePath = resolve(SRC_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');

    const encMatch = content.match(/const encoded = '(.*?)';/s);
    if (!encMatch) {
      continue;
    }

    const decoded = decode(encMatch[1]);
    if (typeName === 'CategoriaLinhas') {
      const _totalLinhas =
        decoded.categoriasDias?.reduce((sum, cat) => sum + (cat.linhas?.length || 0), 0) || 0;
    } else {
    }
  }
} else {
  let allOk = true;
  allOk = processFile('linhas.ts', 'CategoriaLinhas') && allOk;
  allOk = processFile('paradas.ts', '{ paradas: Parada[] }') && allOk;

  if (allOk) {
  } else {
    process.exit(1);
  }
}
