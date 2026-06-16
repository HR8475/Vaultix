import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import * as encryptionService from '../../services/encryptionService.js';
import config from '../../config/index.js';

describe('Encryption Service', () => {

  it('should encrypt and decrypt a string successfully', () => {
    const plaintext = 'super_secret_value_123';
    const encrypted = encryptionService.encrypt(plaintext);
    
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:cipherText
    
    const decrypted = encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle special characters and unicode', () => {
    const plaintext = '!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./ 🚀🔥 こんにちは';
    const encrypted = encryptionService.encrypt(plaintext);
    const decrypted = encryptionService.decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
  });

  it('should return falsy values as-is', () => {
    expect(encryptionService.encrypt('')).toBe('');
    expect(encryptionService.encrypt(null)).toBe(null);
    expect(encryptionService.decrypt(undefined)).toBe(undefined);
  });

  it('should throw an error for invalid encrypted data format', () => {
    const invalidData = 'not:valid:format:too:many';
    expect(() => encryptionService.decrypt(invalidData)).toThrow('Invalid encrypted data format');
    
    const invalidData2 = 'just_one_part';
    expect(() => encryptionService.decrypt(invalidData2)).toThrow('Invalid encrypted data format');
  });

  it('should support custom workspace keys', () => {
    const plaintext = 'workspace_specific_secret';
    // Create a random 32-byte key buffer
    const customKey = crypto.randomBytes(32);
    
    const encrypted = encryptionService.encrypt(plaintext, customKey);
    
    // Decrypting with global key should fail
    expect(() => encryptionService.decrypt(encrypted)).toThrow();
    
    // Decrypting with correct custom key should succeed
    const decrypted = encryptionService.decrypt(encrypted, customKey);
    expect(decrypted).toBe(plaintext);
  });
});
