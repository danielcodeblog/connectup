import { StorageService } from './storageService';

// This service implements a basic End-to-End Encryption (E2EE) using Web Crypto API
// It uses ECDH for shared key derivation and AES-GCM for symmetric encryption

const EC_CURVE = 'P-256';

export class EncryptionService {
  private static myPrivateKey: CryptoKey | null = null;
  private static myPublicKey: CryptoKey | null = null;
  private static generatedKeys = false;
  private static exportedPublicKeyString: string | null = null;
  private static sharedKeysCache: Record<string, CryptoKey> = {};

  // Initialize and generate or load keys for the current session
  // In a real app, private keys MUST be protected and stored securely (e.g. IndexedDB with a master password)
  // Here we store it in memory/localStorage for demonstration
  static async init(userId: string) {
    if (this.generatedKeys) return;

    try {
      const storedPrivateKey = localStorage.getItem(`client_priv_key_${userId}`);
      const storedPublicKey = localStorage.getItem(`client_pub_key_${userId}`);

      if (storedPrivateKey && storedPublicKey) {
        this.myPrivateKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPrivateKey),
          { name: 'ECDH', namedCurve: EC_CURVE },
          true,
          ['deriveKey', 'deriveBits']
        );
        this.myPublicKey = await crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedPublicKey),
          { name: 'ECDH', namedCurve: EC_CURVE },
          true,
          []
        );
        this.exportedPublicKeyString = JSON.stringify(await crypto.subtle.exportKey('jwk', this.myPublicKey));
      } else {
        const keyPair = await crypto.subtle.generateKey(
          { name: 'ECDH', namedCurve: EC_CURVE },
          true,
          ['deriveKey', 'deriveBits']
        );
        this.myPrivateKey = keyPair.privateKey;
        this.myPublicKey = keyPair.publicKey;

        const exportedPriv = await crypto.subtle.exportKey('jwk', this.myPrivateKey);
        const exportedPub = await crypto.subtle.exportKey('jwk', this.myPublicKey);

        localStorage.setItem(`client_priv_key_${userId}`, JSON.stringify(exportedPriv));
        localStorage.setItem(`client_pub_key_${userId}`, JSON.stringify(exportedPub));
        this.exportedPublicKeyString = JSON.stringify(exportedPub);
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
