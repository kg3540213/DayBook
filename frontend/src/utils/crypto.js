// frontend/src/utils/crypto.js
// Data-key–based AES-256 encryption system.
//
// Architecture:
//   1. On signup/login, the server returns `encryptedDataKey` (salt:iv:ciphertext).
//   2. The user's password + PBKDF2 unwraps it → raw `dataKey` (base64, 32 bytes).
//   3. The raw `dataKey` lives ONLY in Redux state.user.dataKey (memory only).
//   4. Every entry is encrypted with AES-256 keyed from SHA-256(dataKey).
//   5. The password itself is never used directly for entry encryption, so
//      changing the password only re-wraps the dataKey — all existing entries
//      remain decryptable without re-encryption.
//   6. On page reload, Layout.jsx restores dataKey from sessionStorage password
//      backup (same browser session only) via decryptDataKey.
//
// This design means:
//   - Password changes are cheap (re-wrap one small key, not all entries).
//   - The server sees only ciphertext for entries.
//   - If the user forgets their password, entries cannot be recovered (zero-knowledge).

import CryptoJS from "crypto-js";

// ── Data-key management ───────────────────────────────────────────

export const generateDataKey = () =>
  CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);

export const deriveKeyFromPassword = (password, saltBase64) => {
  if (!password || !saltBase64) throw new Error("Password and salt are required");
  const salt = CryptoJS.enc.Base64.parse(saltBase64);
  return CryptoJS.PBKDF2(password, salt, {
    keySize:    256 / 32,
    iterations: 100000,
    hasher:     CryptoJS.algo.SHA256,
  });
};

// Wrap the raw dataKey under the user's password.
// Returns: salt:iv:ciphertext (all base64)
export const encryptDataKey = (dataKeyBase64, password) => {
  if (!dataKeyBase64 || !password) throw new Error("dataKey and password are required");
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv   = CryptoJS.lib.WordArray.random(16);
  const key  = deriveKeyFromPassword(password, salt.toString(CryptoJS.enc.Base64));

  const cipher = CryptoJS.AES.encrypt(dataKeyBase64, key, {
    iv,
    mode:    CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7,
  });

  // In CryptoJS GCM, the auth tag is included in ciphertext
  return [
    salt.toString(CryptoJS.enc.Base64),
    iv.toString(CryptoJS.enc.Base64),
    cipher.ciphertext.toString(CryptoJS.enc.Base64),
  ].join(":");
};

// Unwrap the encrypted dataKey using the user's password.
// Throws on wrong password or malformed input.
export const decryptDataKey = (encryptedDataKey, password) => {
  if (!encryptedDataKey || !password) throw new Error("encryptedDataKey and password are required");
  const parts = encryptedDataKey.split(":");
  if (parts.length !== 3) throw new Error("Invalid encryptedDataKey format");
  const [saltB64, ivB64, ciphertextB64] = parts;

  const key        = deriveKeyFromPassword(password, saltB64);
  const iv         = CryptoJS.enc.Base64.parse(ivB64);
  const ciphertext = CryptoJS.enc.Base64.parse(ciphertextB64);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  const text = decrypted.toString(CryptoJS.enc.Utf8);
  if (!text) throw new Error("Failed to decrypt data key. Wrong password?");
  return text;
};

// ── Entry encryption with dataKey ────────────────────────────────

// Derive a stable AES key from the dataKey bytes using SHA-256.
// This means changing the password (which only re-wraps the dataKey)
// does NOT change the key used for entries.
const deriveEntryKey = (dataKeyBase64) => {
  if (!dataKeyBase64) throw new Error("dataKey is required");
  const dataKeyBytes = CryptoJS.enc.Base64.parse(dataKeyBase64);
  return CryptoJS.SHA256(dataKeyBytes);
};

export const encryptEntry = (plaintext, dataKeyBase64) => {
  if (!plaintext || !dataKeyBase64) throw new Error("plaintext and dataKey are required");
  const iv  = CryptoJS.lib.WordArray.random(16);
  const key = deriveEntryKey(dataKeyBase64);

  const cipher = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode:    CryptoJS.mode.GCM,
    padding: CryptoJS.pad.Pkcs7,
  });

  return [
    iv.toString(CryptoJS.enc.Base64),
    cipher.ciphertext.toString(CryptoJS.enc.Base64),
  ].join(":");
};

export const decryptEntry = (encryptedContent, dataKeyBase64) => {
  if (!encryptedContent || !dataKeyBase64) throw new Error("encrypted content and dataKey are required");
  const [ivB64, ciphertextB64] = encryptedContent.split(":");
  if (!ivB64 || !ciphertextB64) return "";

  const iv         = CryptoJS.enc.Base64.parse(ivB64);
  const ciphertext = CryptoJS.enc.Base64.parse(ciphertextB64);
  const key        = deriveEntryKey(dataKeyBase64);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    { iv, mode: CryptoJS.mode.GCM, padding: CryptoJS.pad.Pkcs7 }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
};

// ── Safe helpers used across the app ─────────────────────────────

// Try to decrypt, fall back to raw content on any error.
// Use this everywhere instead of bare try/catch blocks scattered in components.
export const safeDecrypt = (content, dataKey) => {
  if (!content) return "";
  if (!dataKey) return content; // no key = return raw (may be legacy unencrypted entry)
  try {
    const result = decryptEntry(content, dataKey);
    return result || content; // fall back to raw if decryption returns empty
  } catch {
    return content; // decryption failed — treat as plain text (legacy entry)
  }
};

// Strip HTML tags to plain text (used for content previews and AI input)
export const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Backward-compatible aliases used across the app
export const encryptText = (text, dataKey) => encryptEntry(text, dataKey);
export const decryptText = (cipherText, dataKey) => decryptEntry(cipherText, dataKey);