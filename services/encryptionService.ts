import { StorageService } from './storageService';

// This service implements a basic End-to-End Encryption (E2EE) using Web Crypto API
// It uses ECDH for shared key derivation and AES-GCM for symmetric encryption

const EC_CURVE = 'P-256';
const DB_NAME = 'connectup_crypto';
const STORE_NAME = 'keys';

export class EncryptionService {
  private static myPrivateKey: CryptoKey | null = null;
  private static myPublicKey: CryptoKey | null = null;
  private static generatedKeys = false;
  private static exportedPublicKeyString: string | null = null;
  private static sharedKeysCache: Record<string, CryptoKey> = {};

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private static async saveToDB(id: string, key: CryptoKey): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(key, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private static async loadFromDB(id: string): Promise<CryptoKey | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Initialize and generate or load keys for the current session
  // Private keys are stored in IndexedDB and marked as non-extractable for security
  static async init(userId: string) {
    if (this.generatedKeys) return;

    try {
      // Try to load from IndexedDB first
      const storedPrivateKey = await this.loadFromDB(`priv_${userId}`);
      const storedPublicKey = await this.loadFromDB(`pub_${userId}`);

      if (storedPrivateKey && storedPublicKey) {
        this.myPrivateKey = storedPrivateKey;
        this.myPublicKey = storedPublicKey;
        const exportedPub = await crypto.subtle.exportKey('jwk', this.myPublicKey);
        this.exportedPublicKeyString = JSON.stringify(exportedPub);
      } else {
        // Generate new keys
        const keyPair = await crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: EC_CURVE },
          true, // Temporarily extractable to allow initial export/save
          ['deriveKey', 'deriveBits']
        );

        // Export public key for sharing
        const exportedPub = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
        this.exportedPublicKeyString = JSON.stringify(exportedPub);

        // Export private key to re-import it as non-extractable
        const exportedPriv = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
        this.myPrivateKey = await crypto.subtle.importKey(
          'jwk',
          exportedPriv,
          { name: 'ECDH', namedCurve: EC_CURVE },
          false, // Set extractable to FALSE for security
          ['deriveKey', 'deriveBits']
        );
        this.myPublicKey = keyPair.publicKey;

        // Store in IndexedDB (CryptoKey objects are cloneable and keep their properties)
        await this.saveToDB(`priv_${userId}`, this.myPrivateKey);
        await this.saveToDB(`pub_${userId}`, this.myPublicKey);
        
        // Clean up legacy localStorage if it exists
        localStorage.removeItem(`client_priv_key_${userId}`);
        localStorage.removeItem(`client_pub_key_${userId}`);
      }
      this.generatedKeys = true;
    } catch (e) {
      console.error("Failed to initialize encryption:", e);
    }
  }

  static getMyPublicKey(): string | null {
    return this.exportedPublicKeyString;
  }

  // Derive a shared AES-GCM key using our private key and their public key
  private static async getSharedKey(peerPublicKeyJwkStr: string): Promise<CryptoKey> {
    if (this.sharedKeysCache[peerPublicKeyJwkStr]) {
      return this.sharedKeysCache[peerPublicKeyJwkStr];
    }
    const peerPublicKeyJwk = JSON.parse(peerPublicKeyJwkStr);
    const peerPublicKey = await crypto.subtle.importKey(
      'jwk',
      peerPublicKeyJwk,
      { name: 'ECDH', namedCurve: EC_CURVE },
      true,
      []
    );

    const sharedKey = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey
      },
      this.myPrivateKey!,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );

    this.sharedKeysCache[peerPublicKeyJwkStr] = sharedKey;
    return sharedKey;
  }

  // Encrypt a message string
  static async encryptMessage(plaintext: string, peerPublicKeyJwkStr: string | null): Promise<string> {
    if (!this.generatedKeys || !peerPublicKeyJwkStr || !this.myPrivateKey) {
      return plaintext; // Fallback if no keys, but in a real app might want to block
    }

    try {
      const sharedKey = await this.getSharedKey(peerPublicKeyJwkStr);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedMessage = new TextEncoder().encode(plaintext);

      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedKey,
        encodedMessage
      );

      const payload = {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(ciphertext))
      };

      return `E2EE::${btoa(JSON.stringify(payload))}`;
    } catch (e) {
      console.error("Encryption failed", e);
      return plaintext;
    }
  }

  // Decrypt a message string
  static async decryptMessage(ciphertextString: string, peerPublicKeyJwkStr: string | null): Promise<string> {
    if (!ciphertextString.startsWith('E2EE::')) {
      return ciphertextString; // Not encrypted or legacy message
    }
    if (!this.generatedKeys || !peerPublicKeyJwkStr || !this.myPrivateKey) {
      return "[Encrypted Message - Key Missing]";
    }

    try {
      const sharedKey = await this.getSharedKey(peerPublicKeyJwkStr);
      const base64Payload = ciphertextString.replace('E2EE::', '');
      const payload = JSON.parse(atob(base64Payload));
      
      const iv = new Uint8Array(payload.iv);
      const ciphertext = new Uint8Array(payload.data);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        sharedKey,
        ciphertext
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      console.error("Decryption failed", e);
      return "[Encrypted Message - Unreadable]";
    }
  }
}
