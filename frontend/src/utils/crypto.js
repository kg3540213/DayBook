import CryptoJS from "crypto-js";

export const generateKey = (password) => {
  return CryptoJS.SHA256(password).toString();
};

export const encryptText = (text, password) => {
  if(!password) {
    throw new Error("Password is required for encryption");
  }
  const key = generateKey(password);
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decryptText = (cipherText, password) => {
  if(!cipherText || !password) {
    throw new Error("Both cipherText and password are required for decryption");
  }
  const key = generateKey(password);
  const bytes = CryptoJS.AES.decrypt(cipherText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};