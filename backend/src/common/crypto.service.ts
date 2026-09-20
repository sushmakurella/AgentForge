import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const rawKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    // Ensure 32 bytes key for AES-256
    this.key = Buffer.from(rawKey.slice(0, 64), 'hex');
    if (this.key.length !== 32) {
      this.key = crypto.createHash('sha256').update(rawKey).digest();
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns: iv:authTag:ciphertext (hex-encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts ciphertext formatted as iv:authTag:ciphertext
   */
  decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return '';
    try {
      const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(':');
      if (!ivHex || !authTagHex || !encryptedText) {
        return encryptedPayload; // Fallback if plaintext
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // In case of invalid key/corrupted data
      return '';
    }
  }
}

