import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY ortam değişkeni tanımlı değil')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY 32 byte (64 hex karakter) olmalıdır')
  return buf
}

// Returns "iv_b64:authTag_b64:cipherText_b64"
export function encrypt(plainText: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decrypt(cipherText: string): string {
  const key = getKey()
  const parts = cipherText.split(':')
  if (parts.length !== 3) throw new Error('Geçersiz şifreli metin formatı')
  const [ivB64, authTagB64, encryptedB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

// Sabit zamanlı HMAC-SHA256 doğrulama (timing attack'a karşı)
export function verifyHmacSha256(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest()
    const sig = signature.replace(/^sha256=/, '')
    const received = Buffer.from(sig, 'hex')
    if (received.length !== expected.length) return false
    return timingSafeEqual(received, expected)
  } catch {
    return false
  }
}
