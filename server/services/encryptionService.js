import crypto from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Helper to get the correct 32-byte key buffer.
 * If a custom key buffer is provided, it uses it.
 * Otherwise defaults to the global ENCRYPTION_KEY.
 */
const getKeyBuffer = (customKeyBuffer) => {
  if (customKeyBuffer && Buffer.isBuffer(customKeyBuffer)) {
    return customKeyBuffer;
  }
  if (!config.encryptionKey) {
    throw new Error('Global ENCRYPTION_KEY is not defined');
  }
  return Buffer.from(config.encryptionKey, 'hex');
};

/**
 * Encrypts a plaintext string.
 * @param {string} text - The plaintext to encrypt.
 * @param {Buffer} [customKeyBuffer] - Optional per-workspace key.
 * @returns {string} The encrypted string in format ivHex:authTagHex:encryptedTextHex.
 */
export const encrypt = (text, customKeyBuffer = null) => {
  if (!text) return text;
  
  const key = getKeyBuffer(customKeyBuffer);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an encrypted string.
 * @param {string} encryptedData - The encrypted string in format ivHex:authTagHex:encryptedTextHex.
 * @param {Buffer} [customKeyBuffer] - Optional per-workspace key.
 * @returns {string} The decrypted plaintext string.
 */
export const decrypt = (encryptedData, customKeyBuffer = null) => {
  if (!encryptedData) return encryptedData;
  
  const key = getKeyBuffer(customKeyBuffer);
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [ivHex, authTagHex, encryptedTextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedTextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
