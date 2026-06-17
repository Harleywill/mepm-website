import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTeamMember, isValidDiscipline } from '@/lib/team';
import { validateFiles, saveUpload, IMAGE_DOC_TYPES } from '@/lib/uploads';
import type { Role } from '@/lib/roles';

/** Public list of all team members. */
export async function GET(_req: Request) {
  const team = await prisma.team.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ team });
}

/** Admin: create a team member with optional photo upload. */
export async function POST(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'edit')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const formData = await req.formData();

  // Extract text fields
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || '').trim();
  const discipline = String(formData.get('discipline') || '').toUpperCase();
  const bio = String(formData.get('bio') || '');
  const order = Number(formData.get('order')) || 0;

  // Validate required fields
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }
  if (!isValidDiscipline(discipline)) {
    return NextResponse.json(
      { error: 'Discipline must be ELE, MEC, or ENV' },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.team.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: 'A team member with this name already exists' },
      { status: 400 }
    );
  }

  // Handle optional photo upload
  let photoPath: string | null = null;
  const photoFile = formData.get('photo');
  if (photoFile instanceof File) {
    const validateErr = validateFiles([photoFile], {
      maxFiles: 1,
      maxSizeMB: 5,
      allowedTypes: IMAGE_DOC_TYPES.filter((t) => t.startsWith('image/')),
    });
    if (validateErr) {
      return NextResponse.json({ error: validateErr }, { status: 400 });
    }

    const saved = await saveUpload(photoFile, 'public/uploads/team');
    photoPath = saved.storedPath;
  }

  const member = await prisma.team.create({
    data: {
      name,
      role,
      discipline,
      bio,
      photo: photoPath,
      order,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
