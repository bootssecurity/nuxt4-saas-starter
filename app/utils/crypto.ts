export const ALGO_ECDH = {
    name: 'ECDH',
    namedCurve: 'P-256'
}

export const ALGO_AES = {
    name: 'AES-GCM',
    length: 256
}

// Generate ECDH Key Pair (Identity Key)
export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        ALGO_ECDH,
        true,
        ['deriveKey', 'deriveBits']
    )
}

// Export Key to JWK (for storage/server)
export async function exportKey(key: CryptoKey) {
    return await window.crypto.subtle.exportKey('jwk', key)
}

// Import Key from JWK
export async function importKey(jwk: JsonWebKey, type: 'public' | 'private' = 'public') {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGO_ECDH,
        true,
        type === 'public' ? [] : ['deriveKey', 'deriveBits']
    )
}

// Import a raw Symmetric Key (AES)
export async function importSymmetricKey(jwk: JsonWebKey) {
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        ALGO_AES,
        true,
        ['encrypt', 'decrypt']
    )
}

// Generate a random Symmetric Key (for new conversation)
export async function generateSymmetricKey() {
    return await window.crypto.subtle.generateKey(
        ALGO_AES,
        true,
        ['encrypt', 'decrypt']
    )
}

// Encrypt string with AES-GCM
export async function encryptMessage(key: CryptoKey, text: string) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(text)

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        encoded
    )

    return {
        content: arrayBufferToBase64(ciphertext),
        iv: arrayBufferToBase64(iv)
    }
}

// Decrypt string with AES-GCM
export async function decryptMessage(key: CryptoKey, content: string, iv: string) {
    const ciphertext = base64ToArrayBuffer(content)
    const ivArr = base64ToArrayBuffer(iv)

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: ivArr
        },
        key,
        ciphertext
    )

    return new TextDecoder().decode(decrypted)
}

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

function base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64)
    const len = binary_string.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

// Wrap Key (Encrypt a key with another key) - Simplified: Valid for wrapping Symmetric Key with Public Key? 
// NO, typically we derive a shared secret first or use RSA.
// BUT: For Group Chat, we need a Symmetric Key shared among all.
// Scheme:
// 1. Alice creates AES Key (Conversation Key).
// 2. Alice derives Shared Secret (ECDH) with Bob's Public Key.
// 3. Alice Derives a KEK (Key Encryption Key) (AES) from Shared Secret.
// 4. Alice Encrypts Conversation Key with KEK.
// This is complex. 
// SIMPLER: Use ECDH to derive a shared key for 1:1. 
// FOR GROUP: One user generates AES Key, encrypts it for each recipient using their shared secret.

export async function deriveInternalSharedKey(privateKey: CryptoKey, publicKey: CryptoKey) {
    // ECDH: Derive shared secret bits
    const sharedBits = await window.crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: publicKey
        },
        privateKey,
        256
    )

    // Import bits as AES Key (KEK)
    return await window.crypto.subtle.importKey(
        'raw',
        sharedBits,
        ALGO_AES,
        true,
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    )
}

export async function wrapKey(keyToWrap: CryptoKey, kek: CryptoKey) {
    // Encrypt the key data (JWK)
    const keyData = await exportKey(keyToWrap)
    const dataStr = JSON.stringify(keyData)
    return await encryptMessage(kek, dataStr) // Reuse encryptMessage for simplicity, returns { content, iv }
}

export async function unwrapKey(wrappedContent: string, wrappedIv: string, kek: CryptoKey) {
    const decryptedJson = await decryptMessage(kek, wrappedContent, wrappedIv)
    const keyData = JSON.parse(decryptedJson)
    return await importSymmetricKey(keyData)
}
