export async function generateSymmetricKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToString(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function importKeyFromString(keyString: string): Promise<CryptoKey> {
  let base64 = keyString.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  return crypto.subtle.importKey(
    "raw",
    arrayBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(text: string, key: CryptoKey): Promise<ArrayBuffer> {
  const textEncoder = new TextEncoder();
  const encodedText = textEncoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

export async function decryptText(encryptedDataWithIv: ArrayBuffer, key: CryptoKey): Promise<string> {
  const data = new Uint8Array(encryptedDataWithIv);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  const textDecoder = new TextDecoder();
  return textDecoder.decode(decrypted);
}