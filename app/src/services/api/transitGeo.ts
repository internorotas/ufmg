const GEO_SALT = 'transit-geo-v1';

async function deriveKey(token: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(token + GEO_SALT);
  const hash = await crypto.subtle.digest('SHA-256', material);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['decrypt']);
}

export async function decryptGeoPayload<T>(base64: string, token: string): Promise<T> {
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const tag = combined.slice(12, 28);
  const ciphertext = combined.slice(28);
  const key = await deriveKey(token);
  // Web Crypto AES-GCM expects ciphertext || authTag concatenated
  const withTag = new Uint8Array(ciphertext.length + tag.length);
  withTag.set(ciphertext);
  withTag.set(tag, ciphertext.length);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, withTag);
  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}
