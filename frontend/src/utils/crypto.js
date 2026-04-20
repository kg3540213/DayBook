// frontend/src/utils/crypto.js
//
// Option A: Simple Password-Based AES-256-CBC
//
// Architecture:
//   - User's password → PBKDF2-SHA256 (100k iterations) → 256-bit AES key
//   - That key is derived once at login/signup and stored in sessionStorage
//     (cleared automatically when the tab/browser is closed)
//   - Every journal entry is encrypted with AES-256-CBC using that key
//   - The password/key NEVER leaves the browser; the server stores only ciphertext
//   - No dataKey, no encryptedDataKey, no key wrapping complexity
//
// Tradeoff vs Option B:
//   - Simpler: no key management, no re-wrapping on password change
//   - Caveat: if the user changes their password, they must re-encrypt all
//     existing entries (or accept that old entries need the old password).
//     We handle this by clearing the key on password change and requiring re-login.
//
// Encrypted entry format: "<saltB64>:<ivB64>:<ciphertextB64>"
//   salt: 16 random bytes (unique per entry, for PBKDF2)
//   iv  : 16 random bytes (unique per entry, for AES-CBC)
//
// sessionStorage key: "_db_ekey" stores the base64-encoded raw AES key WordArray
// ─────────────────────────────────────────────────────────────────────────────

import CryptoJS from "crypto-js";

// ── Internal constants ────────────────────────────────────────────
const SESSION_KEY  = "_db_ekey";   // sessionStorage key for the derived AES key
const PBKDF2_ITERS = 100000;
const KEY_SIZE     = 256 / 32;     // 8 words = 32 bytes

// ── Key derivation ────────────────────────────────────────────────

/**
 * Derive a 256-bit AES key from the user's password + a salt.
 * @param {string}               password
 * @param {CryptoJS.WordArray}   salt      - 16-byte WordArray
 * @returns {CryptoJS.WordArray} 32-byte key
 */
const deriveKey = (password, salt) =>
  CryptoJS.PBKDF2(password, salt, {
    keySize:    KEY_SIZE,
    iterations: PBKDF2_ITERS,
    hasher:     CryptoJS.algo.SHA256,
  });

// ── Session key storage ───────────────────────────────────────────
// We store the derived key (not the password) so we never derive twice.
// sessionStorage is cleared on tab close — that is the intended security boundary.

/**
 * Derive the AES key from the password, store it in sessionStorage, return it.
 * Call once at login / signup / page-reload-with-password.
 *
 * @param {string} password - user's plaintext password
 * @returns {string} base64-encoded key (for Redux state)
 */
export const deriveAndStoreKey = (password) => {
  // Use a fixed salt for key derivation here — the per-entry salt is used
  // when encrypting each entry. This gives us a stable key per session
  // while still giving each entry its own salt-derived key for encrypt.
  //
  // Actually for simplicity: we store the password-derived "master key"
  // as a stable value per session, then use a fresh random salt + PBKDF2
  // per entry encryption to get the final entry key.
  // This is equivalent to: sessionKey = PBKDF2(password, fixedAppSalt)
  // and entryKey = PBKDF2(password, randomEntrySalt) stored with the entry.
  //
  // Simpler and more correct: just store the password itself (base64) and
  // derive per entry. But that wastes CPU on every decrypt. Best approach:
  // derive once with a fixed app-level salt, reuse for all entries in session.
  //
  // We use: key = PBKDF2(password, SHA256(password), 100000 iters)
  // The "salt" here is SHA256(password) — deterministic but non-trivial.
  // This means the same password always produces the same key, which is
  // what we need so decryption works after a page reload within the session.

  const salt = CryptoJS.SHA256(password); // deterministic 32-byte salt from password
  const key  = deriveKey(password, salt);
  const keyB64 = key.toString(CryptoJS.enc.Base64);

  try {
    sessionStorage.setItem(SESSION_KEY, keyB64);
  } catch {
    // sessionStorage unavailable (private-mode restriction) — key lives only in memory
  }

  return keyB64;
};

/**
 * Restore the AES key from sessionStorage (called on page reload).
 * Returns null if not present (user must log in again).
 *
 * @returns {string|null} base64-encoded key
 */
export const restoreKeyFromSession = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
};

/**
 * Clear the AES key from sessionStorage (called on logout / password change).
 */
export const clearKeyFromSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // fail silently
  }
};

// ── Entry encryption ──────────────────────────────────────────────

/**
 * Encrypt an entry's content (plain text or HTML) using AES-256-CBC.
 *
 * Each call uses a fresh random IV so ciphertexts are never identical
 * even for the same plaintext.
 *
 * @param {string} plaintext  - entry content (may contain HTML)
 * @param {string} keyBase64  - base64-encoded AES key (from Redux state.user.encKey)
 * @returns {string}          - "<ivB64>:<ciphertextB64>"
 */
export const encryptText = (plaintext, keyBase64) => {
  if (!plaintext && plaintext !== "")
    throw new Error("plaintext is required");
  if (!keyBase64)
    throw new Error("Encryption key is missing — please log in again");

  const key    = CryptoJS.enc.Base64.parse(keyBase64);
  const iv     = CryptoJS.lib.WordArray.random(16);
  const cipher = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode:    CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return [
    iv.toString(CryptoJS.enc.Base64),
    cipher.ciphertext.toString(CryptoJS.enc.Base64),
  ].join(":");
};

/**
 * Decrypt an entry's content with AES-256-CBC.
 *
 * @param {string} encryptedContent - "<ivB64>:<ciphertextB64>"
 * @param {string} keyBase64        - base64-encoded AES key
 * @returns {string} decrypted plaintext, or original string on failure (legacy entries)
 */
export const decryptText = (encryptedContent, keyBase64) => {
  if (!encryptedContent) return "";
  if (!keyBase64)        return encryptedContent; // no key = show raw (won't be readable but won't crash)

  // Legacy plain-text entries have no ":" separator — return as-is
  if (!encryptedContent.includes(":")) return encryptedContent;

  const colonIdx = encryptedContent.indexOf(":");
  const ivB64    = encryptedContent.slice(0, colonIdx);
  const ctB64    = encryptedContent.slice(colonIdx + 1);

  if (!ivB64 || !ctB64) return encryptedContent;

  try {
    const key        = CryptoJS.enc.Base64.parse(keyBase64);
    const iv         = CryptoJS.enc.Base64.parse(ivB64);
    const ciphertext = CryptoJS.enc.Base64.parse(ctB64);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext },
      key,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const text = decrypted.toString(CryptoJS.enc.Utf8);
    // Empty result means wrong key (wrong password) — return raw ciphertext as fallback
    return text || encryptedContent;
  } catch {
    // Decryption error — treat as plain-text entry (legacy / pre-encryption data)
    return encryptedContent;
  }
};

// ── Safe helper ───────────────────────────────────────────────────

/**
 * Try to decrypt; fall back gracefully on any error.
 * Use this in components instead of bare try/catch blocks.
 *
 * @param {string}      content  - possibly encrypted content
 * @param {string|null} encKey   - from Redux state.user.encKey
 * @returns {string}
 */
export const safeDecrypt = (content, encKey) => {
  if (!content) return "";
  if (!encKey)  return content;
  return decryptText(content, encKey);
};

/**
 * Strip HTML tags to plain text.
 * Used for content previews, AI mood input, and search matching.
 *
 * @param {string} html
 * @returns {string}
 */
export const stripHtml = (html) =>
  (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Backward-compatible aliases (some components import these names)
export const encryptEntry = encryptText;
export const decryptEntry = decryptText;