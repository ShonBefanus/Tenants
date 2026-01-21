/**
 * Encryption Utility
 * 
 * Implements AES-256-GCM encryption with HKDF key derivation
 * for secure per-user data encryption in accordance with Phase 1 security requirements.
 * 
 * Key Security Principles:
 * - Each user has a unique encryption key derived from their Firebase UID
 * - Master secret stored in environment variable
 * - No plaintext sensitive data stored or logged
 * - Encryption happens BEFORE database write
 * - Decryption happens ONLY in backend
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const SALT_LENGTH = 32; // 256-bit salt for HKDF
const KEY_LENGTH = 32; // 256-bit key

/**
 * Get the master encryption secret from environment variables
 * @throws Error if ENCRYPTION_MASTER_SECRET is not set
 */
function getMasterSecret(): Buffer {
  const secret = process.env.ENCRYPTION_MASTER_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_MASTER_SECRET environment variable is not set');
  }
  // Convert base64 secret to buffer
  return Buffer.from(secret, 'base64');
}

/**
 * Derive a user-specific encryption key using HKDF
 * @param firebaseUid - The Firebase user ID
 * @returns Derived encryption key as Buffer
 */
export function deriveUserKey(firebaseUid: string): Buffer {
  const masterSecret = getMasterSecret();
  
  // Use HKDF (HMAC-based Key Derivation Function) with SHA-256
  // Salt: Firebase UID (unique per user)
  // Info: Context string for key derivation
  const salt = Buffer.from(firebaseUid, 'utf8');
  const info = Buffer.from('tenants-app-user-encryption-key', 'utf8');
  
  // Derive key using HKDF
  return Buffer.from(crypto.hkdfSync('sha256', masterSecret, salt, info, KEY_LENGTH));
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string; // Base64 encoded ciphertext
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
}

/**
 * Encrypt data for a specific user
 * @param data - The data to encrypt (will be JSON stringified)
 * @param firebaseUid - The Firebase user ID
 * @returns Encrypted data object
 */
export function encrypt<T>(data: T, firebaseUid: string): EncryptedData {
  try {
    // Derive user-specific key
    const key = deriveUserKey(firebaseUid);
    
    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Convert data to JSON string and encrypt
    const plaintext = JSON.stringify(data);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return encrypted data with all components
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    // Never log the plaintext data or key
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data for a specific user
 * @param encryptedData - The encrypted data object
 * @param firebaseUid - The Firebase user ID
 * @returns Decrypted and parsed data
 */
export function decrypt<T>(encryptedData: EncryptedData, firebaseUid: string): T {
  try {
    // Derive user-specific key
    const key = deriveUserKey(firebaseUid);
    
    // Convert base64 strings back to buffers
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);
    
    // Parse JSON and return
    return JSON.parse(plaintext.toString('utf8')) as T;
  } catch (error) {
    // Authentication tag verification failed or decryption error
    throw new Error('Decryption failed or data integrity compromised');
  }
}

/**
 * Encrypt a field value for storage in database
 * This converts the encrypted data to a single base64 string for easy storage
 * @param data - The data to encrypt
 * @param firebaseUid - The Firebase user ID
 * @returns Base64 encoded encrypted blob
 */
export function encryptField<T>(data: T, firebaseUid: string): string {
  const encrypted = encrypt(data, firebaseUid);
  // Combine all components into a single JSON string and encode as base64
  const combined = JSON.stringify(encrypted);
  return Buffer.from(combined, 'utf8').toString('base64');
}

/**
 * Decrypt a field value from database
 * @param encryptedBlob - Base64 encoded encrypted blob from database
 * @param firebaseUid - The Firebase user ID
 * @returns Decrypted and parsed data
 */
export function decryptField<T>(encryptedBlob: string, firebaseUid: string): T {
  // Decode base64 and parse JSON to get encrypted data components
  const combined = Buffer.from(encryptedBlob, 'base64').toString('utf8');
  const encrypted = JSON.parse(combined) as EncryptedData;
  return decrypt<T>(encrypted, firebaseUid);
}
