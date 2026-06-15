import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

export const COOKIE = 'auth-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

/** Set the auth cookie (call from a route handler after a successful login). */
export async function setAuthCookie(token: string): Promise<void> {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/**
 * Throws if the request has no valid auth cookie. Use at the top of every
 * admin API route — this is the real enforcement; client guards are UX only.
 */
export async function verifyAuth(): Promise<JWTPayload> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new Error('unauthorized');
  return verifyToken(token);
}
