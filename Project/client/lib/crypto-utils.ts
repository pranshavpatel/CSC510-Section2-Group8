/**
 * Utility functions for client-side password hashing
 * Uses Web Crypto API (SubtleCrypto) available in modern browsers
 */

/**
 * Hashes a password using SHA-256
 * @param password - The plain text password to hash
 * @returns The hexadecimal string representation of the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Convert password string to Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  
  // Hash the password using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Alternative: Hash with salt (if you want to implement salting on client side)
 * Note: This is still not as secure as server-side hashing with proper salt storage
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const saltedPassword = password + salt
  return hashPassword(saltedPassword)
}

