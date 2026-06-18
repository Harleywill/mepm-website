import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser, hashPassword } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { isValidRole } from '@/lib/roles';
import type { Role } from '@/lib/roles';

/**
 * GET /api/users
 * Admin only: list all users (admin, editor, viewer)
 * Returns: { users: [{ id, username, role, createdAt }, ...] }
 */
export async function GET() {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'users')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const users = await prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/users
 * Admin only: create a new user
 * Body: { username, password, role }
 * Validates: username >= 3 chars, password >= 6 chars, role in ['administrator', 'editor', 'viewer']
 * Returns 201 with created user (no password)
 * Errors: 400 (validation), 401 (auth), 403 (permissions), 409 (duplicate)
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'users')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { username, password, role } = body;

  // Validate username
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return NextResponse.json(
      { error: 'Username must be at least 3 characters' },
      { status: 400 }
    );
  }

  // Validate password
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  // Validate role
  if (!isValidRole(role)) {
    return NextResponse.json(
      { error: 'Role must be one of: administrator, editor, viewer' },
      { status: 400 }
    );
  }

  // Check for duplicate username
  const existing = await prisma.adminUser.findUnique({
    where: { username: username.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Username already exists' },
      { status: 409 }
    );
  }

  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const newUser = await prisma.adminUser.create({
    data: {
      username: username.trim(),
      passwordHash,
      role,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: newUser }, { status: 201 });
}
