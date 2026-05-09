import { hash, verify } from "@node-rs/argon2";

const PARAMS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, PARAMS);
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try { return await verify(stored, plain); } catch { return false; }
}
