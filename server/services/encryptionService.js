import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Encrypts a plaintext string.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The encrypted string in format ivHex:authTagHex:encryptedTextHex.
 */
export const encrypt = (text) => {
  if (!text) return text;
  
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
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
 * @returns {string} The decrypted plaintext string.
 */
export const decrypt = (encryptedData) => {
  if (!encryptedData) return encryptedData;
  
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
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
