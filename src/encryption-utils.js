/**
 * Encryption Utilities Module
 * Provides AES encryption/decryption for sensitive data storage
 */

export class EncryptionUtils {
  /**
   * Generate encryption key from server info
   */
  static async generateKey(serverId, username) {
    const keyMaterial = `${serverId}-${username}-feishin-custom`;
    const encoder = new TextEncoder();
    const data = encoder.encode(keyMaterial);

    // Hash the key material to get a consistent key
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Import as a CryptoKey
    return crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a string value
   */
  static async encrypt(plaintext, serverId, username) {
    if (!plaintext) return null;

    try {
      const key = await this.generateKey(serverId, username);
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      // Combine IV and encrypted data
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (e) {
      console.error("❌ Encryption failed:", e);
      return null;
    }
  }

  /**
   * Decrypt an encrypted string value
   */
  static async decrypt(encryptedBase64, serverId, username) {
    if (!encryptedBase64) return null;

    try {
      const key = await this.generateKey(serverId, username);

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (e) {
      console.error("❌ Decryption failed:", e);
      return null;
    }
  }
}

