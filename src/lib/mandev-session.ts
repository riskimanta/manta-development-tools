import { SignJWT, jwtVerify } from "jose";

/** HttpOnly cookie carrying a short-lived JWT when password gate is enabled. */
export const MANDEV_SESSION_COOKIE = "mandev_session";

export function isMandevAuthConfigured(): boolean {
  const p = process.env.MANDEV_PASSWORD;
  return typeof p === "string" && p.length > 0;
}

export function isMandevAuthSecretValid(): boolean {
  const s = process.env.MANDEV_AUTH_SECRET;
  return typeof s === "string" && s.length >= 16;
}

function secretKey(): Uint8Array {
  const s = process.env.MANDEV_AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "MANDEV_AUTH_SECRET must be at least 16 characters when MANDEV_PASSWORD is set",
    );
  }
  return new TextEncoder().encode(s);
}

function secretKeySafe(): Uint8Array | null {
  try {
    return secretKey();
  } catch {
    return null;
  }
}

export async function signMandevSession(): Promise<string> {
  return new SignJWT({ sub: "mandev" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyMandevSessionToken(token: string): Promise<boolean> {
  const key = secretKeySafe();
  if (!key) return false;
  try {
    await jwtVerify(token, key);
    return true;
  } catch {
    return false;
  }
}
