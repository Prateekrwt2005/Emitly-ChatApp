// Helper functions for E2E Encryption using Web Crypto API (ECDH + AES-GCM)

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 1. Generate ECDH Key Pair
export async function generateECDHKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );
}

// 2. Export Public Key to Base64 String
export async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// 3. Import Partner's Public Key from Base64 String
export async function importPublicKey(spkiBase64) {
  const binaryKey = base64ToArrayBuffer(spkiBase64);
  return await window.crypto.subtle.importKey(
    "spki",
    binaryKey,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
}

// 4. Derive Shared AES-GCM Key (256-bit)
export async function deriveSharedKey(myPrivateKey, partnerPublicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: partnerPublicKey,
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// 5. Encrypt Text with AES-GCM (Returns Base64 encoded string: "iv:ciphertext")
export async function encryptText(text, aesKey) {
  const enc = new TextEncoder();
  const encodedText = enc.encode(text);
  
  // Generate a random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedText
  );

  const ivBase64 = arrayBufferToBase64(iv);
  const ciphertextBase64 = arrayBufferToBase64(ciphertext);

  return `${ivBase64}:${ciphertextBase64}`;
}

// 6. Decrypt Text with AES-GCM (Input format: "iv:ciphertext")
export async function decryptText(encryptedPayload, aesKey) {
  try {
    const [ivBase64, ciphertextBase64] = encryptedPayload.split(":");
    if (!ivBase64 || !ciphertextBase64) return "[Decryption Error: Invalid payload]";

    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[E2E Encrypted Message - Handshake Key Cleared]";
  }
}
