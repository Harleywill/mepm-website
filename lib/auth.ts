import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(value);
};

export const COOKIE = 'auth-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);

export async function signToken(username: string, role: string = 'viewer'): Promise<string> {
  return new SignJWT({ sub: username, role })
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

export interface AuthenticatedUser {
  username: string;
  role: string;
}

/**
 * Like verifyAuth(), but returns the full user object (username + role).
 * Call at the start of protected routes to get user + check auth in one step.
 */
export async function verifyAuthWithUser(): Promise<AuthenticatedUser> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new Error('unauthorized');
  const payload = await verifyToken(token);
  return {
    username: payload.sub as string,
    role: (payload.role as string) || 'viewer',
  };
}
