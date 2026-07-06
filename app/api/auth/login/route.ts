import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit, clientKey } from '@/lib/rate-limit';
import { logLoginAttempt } from '@/lib/login-attempts';

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  const ipAddress = clientKey(req);

  if (!rateLimit(`login:${ipAddress}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await logLoginAttempt({ username, success: false, ipAddress });
    return NextResponse.json(
      { error: 'Incorrect username or password' },
      { status: 401 }
    );
  }

  await logLoginAttempt({ username: user.username, success: true, ipAddress });
  const token = await signToken(user.username, user.role);
  await setAuthCookie(token);
  return NextResponse.json({ ok: true });
}
