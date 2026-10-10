import argon2 from 'argon2';

/** Hash a plaintext password using Argon2id */
export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,   // 64 MiB
    timeCost: 3,
    parallelism: 2,
  });
}

/** Verify a plaintext password against a stored hash */
export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}
