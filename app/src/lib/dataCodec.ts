/**
 * Data obfuscation codec using XOR cipher + Base64 encoding.
 *
 * Purpose: Prevent scraping of transit data from built JS bundles.
 * The source data files contain plaintext for development readability.
 * The build script (scripts/encode-data.mjs) encodes data before commit.
 * This module decodes at runtime.
 *
 * Security note: This is obfuscation, not encryption. The XOR key is in the
 * client bundle. A determined attacker can still extract the data. This adds
 * a reasonable barrier against casual scraping via network tab or bundle inspection.
 */

const XOR_KEY = new Uint8Array([
  0x49, 0x4e, 0x54, 0x45, 0x52, 0x4e, 0x4f, 0x2d, 0x52, 0x4f, 0x54, 0x41, 0x53, 0x2d, 0x32, 0x30,
  0x32, 0x34, 0x2d, 0x56, 0x31, 0x00, 0xff, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc,
]);

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode an obfuscated data string back to its original JSON.
 * @param encoded - Base64-encoded, XOR-encrypted data
 * @returns Decoded and parsed data
 */
export function decodeObfuscated<T>(encoded: string): T {
  const encrypted = base64ToBytes(encoded);
  const decrypted = xorBytes(encrypted, XOR_KEY);
  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as T;
}

/**
 * Encode a data object to an obfuscated string (for build script use).
 * @param data - The data to encode
 * @returns Base64-encoded, XOR-encrypted string
 */
export function encodeObfuscated(data: unknown): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  const encrypted = xorBytes(bytes, XOR_KEY);
  return bytesToBase64(encrypted);
}
