const CryptoJS = require('crypto-js');
const password = 'test-pass';
const salt = CryptoJS.lib.WordArray.random(16);
const iv = CryptoJS.lib.WordArray.random(16);
const key = CryptoJS.PBKDF2(password, salt, {
  keySize: 256 / 32,
  iterations: 100000,
  hasher: CryptoJS.algo.SHA256,
});

const plaintext = 'hello world';
const cipher = CryptoJS.AES.encrypt(plaintext, key, {
  iv,
  mode: CryptoJS.mode.GCM,
  padding: CryptoJS.pad.Pkcs7,
});
console.log('ciphertext', cipher.ciphertext.toString(CryptoJS.enc.Base64));
console.log('iv', iv.toString(CryptoJS.enc.Base64));
console.log('toString', cipher.toString());
console.log('cipher keys', Object.keys(cipher));
const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipher.ciphertext }, key, {
  iv,
  mode: CryptoJS.mode.GCM,
  padding: CryptoJS.pad.Pkcs7,
});
console.log('decrypted', decrypted.toString(CryptoJS.enc.Utf8));
