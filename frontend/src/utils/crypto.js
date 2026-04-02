import CryptoJS from "crypto-js";

// --- Data-key management ---
export const generateDataKey = () =>
  CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);

export const deriveKeyFromPassword = (password, saltBase64) => {
  if (!password || !saltBase64) throw new Error("Password and salt are required");
  const salt = CryptoJS.enc.Base64.parse(saltBase64);
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256,
  });
};

export const encryptDataKey = (dataKeyBase64, password) => {
  if (!dataKeyBase64 || !password) throw new Error("dataKey and password are required");
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = deriveKeyFromPassword(password, salt.toString(CryptoJS.enc.Base64));

  const cipher = CryptoJS.AES.encrypt(
    dataKeyBase64,
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  return [
    salt.toString(CryptoJS.enc.Base64),
    iv.toString(CryptoJS.enc.Base64),
    cipher.ciphertext.toString(CryptoJS.enc.Base64),
  ].join(":");
};

export const decryptDataKey = (encryptedDataKey, password) => {
  if (!encryptedDataKey || !password) throw new Error("encryptedDataKey and password are required");
  const parts = encryptedDataKey.split(":");
  if (parts.length !== 3) throw new Error("Invalid encryptedDataKey format");
  const [saltB64, ivB64, ciphertextB64] = parts;

  const key = deriveKeyFromPassword(password, saltB64);
  const iv = CryptoJS.enc.Base64.parse(ivB64);
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

// --- Entry encryption with dataKey ---
const deriveEntryKey = (dataKeyBase64) => {
  if (!dataKeyBase64) throw new Error("dataKey is required");
  const dataKeyBytes = CryptoJS.enc.Base64.parse(dataKeyBase64);
  return CryptoJS.SHA256(dataKeyBytes);
};

export const encryptEntry = (plaintext, dataKeyBase64) => {
  if (!plaintext || !dataKeyBase64) throw new Error("plaintext and dataKey are required");
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = deriveEntryKey(dataKeyBase64);

  const cipher = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
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

  const iv = CryptoJS.enc.Base64.parse(ivB64);
  const ciphertext = CryptoJS.enc.Base64.parse(ciphertextB64);
  const key = deriveEntryKey(dataKeyBase64);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
};

// Backward-compatible aliases used across the app
export const encryptText = (text, dataKey) => encryptEntry(text, dataKey);
export const decryptText = (cipherText, dataKey) => decryptEntry(cipherText, dataKey);
