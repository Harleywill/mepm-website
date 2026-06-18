# MEPM CMS Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the MEPM backend (Prisma + Next.js route handlers) to support the full CMS prototype spec — adding Services, Team, Testimonials, Accreditations, a fine-grained role-based permissions system, media library, and export endpoint.

**Architecture:** Extend the existing Prisma schema with new models (Service, Testimonial, Team, Accreditation) and enhance AdminUser with a role field. Create a permission system that gates every mutating action by role (Administrator, Editor, Viewer). Each new collection gets CRUD API routes under `app/api/` with role checks. Admin photo uploads go to `public/uploads/team/` (public zone). The export endpoint mirrors the CMS prototype's JSON shape for seeding.

**Tech Stack:** Prisma 6 + SQLite, Next.js 16 route handlers, TypeScript, bcryptjs + jose (existing auth).

---

## File Structure

**Create:**
- `lib/roles.ts` — Role constants, type guards, validation
- `lib/permissions.ts` — Permission map (PERMS) and helper functions
- `lib/team.ts` — Team member validation and helpers
- `lib/services.ts` — Service validation and helpers
- `lib/testimonials.ts` — Testimonial validation and helpers
- `lib/accreditations.ts` — Accreditation helpers
- `lib/media.ts` — Media library scanner
- `app/api/roles/route.ts` — GET roles for the current user (for client)
- `app/api/team/route.ts` — GET/POST team
- `app/api/team/[id]/route.ts` — GET/PATCH/DELETE team member
- `app/api/services/route.ts` — GET/POST services
- `app/api/services/[id]/route.ts` — GET/PATCH/DELETE service
- `app/api/testimonials/route.ts` — GET/POST testimonials
- `app/api/testimonials/[id]/route.ts` — GET/PATCH/DELETE testimonial
- `app/api/accreditations/route.ts` — GET/POST accreditations
- `app/api/media/route.ts` — GET (list all images)
- `app/api/export/route.ts` — GET (export full content JSON)

**Modify:**
- `prisma/schema.prisma` — Add Service, Testimonial, Team, Accreditation models; extend AdminUser with role
- `prisma/seed.ts` — Seed demo users with roles, sample services, team, testimonials, accreditations
- `lib/auth.ts` — Extend verifyAuth() to return user with role
- `app/api/auth/login/route.ts` — Update to include role in response (optional, for UX)

---

## Task 1: Extend Prisma schema with new models and role field

**Files:**
- Modify: `prisma/schema.prisma`

**Rationale:** Add all new collections (Service, Testimonial, Team, Accreditation) and extend AdminUser with a role field to support the permissions model (Administrator | Editor | Viewer).

- [ ] **Step 1: Extend AdminUser with role field**

Edit `prisma/schema.prisma` and update the `AdminUser` model:

```prisma
model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  role         String   @default("editor") // administrator | editor | viewer
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Step 2: Add Service model**

Add this model to `prisma/schema.prisma`:

```prisma
model Service {
  id        String   @id @default(cuid())
  code      String   @unique // ELE | MEC | ENV
  title     String
  desc      String
  points    String   @default("") // JSON array of strings, stored as string
  statValue String   @default("")
  statLabel String   @default("")
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: Add Testimonial model**

Add this model to `prisma/schema.prisma`:

```prisma
model Testimonial {
  id        String   @id @default(cuid())
  quote     String
  author    String
  company   String?
  logo      String?  // stored path (public/uploads/testimonials/…)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 4: Add Team model**

Add this model to `prisma/schema.prisma`:

```prisma
model Team {
  id         String   @id @default(cuid())
  name       String
  role       String   // e.g., "Senior MEP Engineer"
  discipline String   // ELE | MEC | ENV
  bio        String   @default("")
  photo      String?  // stored path (public/uploads/team/…)
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- [ ] **Step 5: Add Accreditation model**

Add this model to `prisma/schema.prisma`:

```prisma
model Accreditation {
  id    String @id @default(cuid())
  label String // e.g., "CIBSE", "ISO 9001"
  order Int    @default(0)
}
```

- [ ] **Step 6: Create migration**

```bash
cd /Users/harleywilliams/websites/MEPM\ website/mepm-website
npx prisma migrate dev --name add_cms_models_and_roles
```

Expected: Creates migration file, updates `prisma/client`, no errors.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "schema: add Service, Testimonial, Team, Accreditation models and role to AdminUser"
```

---

## Task 2: Create roles and permissions system

**Files:**
- Create: `lib/roles.ts`
- Create: `lib/permissions.ts`
- Modify: `lib/auth.ts`

- [ ] **Step 1: Create roles constants**

Create `lib/roles.ts`:

```ts
export const ROLES = ['administrator', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<Role, string> = {
  administrator: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
};
```

- [ ] **Step 2: Create permissions map**

Create `lib/permissions.ts`:

```ts
import type { Role } from './roles';

// Map of role → allowed actions
export const PERMS: Record<Role, Set<string>> = {
  administrator: new Set(['edit', 'delete', 'publish', 'system', 'users', 'browse']),
  editor: new Set(['edit', 'delete', 'publish', 'browse']),
  viewer: new Set(['browse']),
};

/**
 * Check if a role can perform an action.
 * Returns true if the role has permission for the action.
 */
export function can(role: Role, action: string): boolean {
  return PERMS[role]?.has(action) ?? false;
}

/**
 * Return a function that checks permission. Throws if not allowed.
 * Usage: const require = requirePermission(role); require('edit');
 */
export function requirePermission(role: Role) {
  return (action: string) => {
    if (!can(role, action)) {
      throw new Error(`Forbidden: role "${role}" cannot "${action}"`);
    }
  };
}

/**
 * Helper for routes: verify role can perform action, else return 403.
 * Usage:  const role = user.role; if (!can(role, 'edit')) return NextResponse.json(..., { status: 403 });
 */
export function forbidden() {
  return { error: 'Forbidden: insufficient permissions', status: 403 };
}
```

- [ ] **Step 3: Extend verifyAuth to return user with role**

Modify `lib/auth.ts`. Add a new function after the existing `verifyAuth()`:

```ts
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
    role: payload.role as string || 'viewer', // fallback to viewer if not set
  };
}
```

Wait, the JWT payload doesn't have the role yet. Let me check the current `signToken` logic. Looking at the existing code, `signToken(username)` only signs the username. We need to:

**Actually, let's revise:** In login, after validating the user, fetch the full user (with role) from the database, then sign the role into the JWT as well.

Modify the login route instead. Let me reframe this step:

- [ ] **Step 3 (revised): Update login to include role in JWT**

Modify `app/api/auth/login/route.ts`. Change the part where it signs the token:

```ts
// OLD:
const token = await signToken(user.username);

// NEW:
const token = await signToken(user.username, user.role);
```

And update `lib/auth.ts` `signToken` function to accept and sign the role:

```ts
export async function signToken(username: string, role: string = 'viewer'): Promise<string> {
  return new SignJWT({ sub: username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}
```

And add the `verifyAuthWithUser` function:

```ts
export interface AuthenticatedUser {
  username: string;
  role: string;
}

export async function verifyAuthWithUser(): Promise<AuthenticatedUser> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new Error('unauthorized');
  const payload = await verifyToken(token);
  return {
    username: payload.sub as string,
    role: (payload.role as string) || 'viewer',
  };
}
```

- [ ] **Step 4: Update auth/login to pass role to signToken**

Modify `app/api/auth/login/route.ts`. In the POST handler, after the `user` is found:

```ts
// Before:
const token = await signToken(user.username);

// After:
const token = await signToken(user.username, user.role);
```

- [ ] **Step 5: Test locally**

```bash
cd /Users/harleywilliams/websites/MEPM\ website/mepm-website
npm run dev
```

Log in with admin/MEPMadmin2026!, then:

```bash
curl -s -b cookies.txt http://localhost:3000/api/auth/me
# Should return: {"ok":true,"username":"admin","role":"editor"}
# (role will be "editor" since we seeded the admin with that role)
```

- [ ] **Step 6: Commit**

```bash
git add lib/roles.ts lib/permissions.ts lib/auth.ts app/api/auth/login/route.ts
git commit -m "feat: add role-based permissions system"
```

---

## Task 3: Update seed to create users with roles and demo data

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Update AdminUser upsert to set role**

Modify `prisma/seed.ts`. Find the existing `adminUser.upsert` block and ensure it sets a role:

```ts
await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash, role: 'editor' },
  create: { username, passwordHash, role: 'editor' },
});
console.log(`Seeded admin user: ${username} (role: editor)`);
```

- [ ] **Step 2: Add demo users**

Add this after the admin user seeding:

```ts
// Create two additional demo users for testing roles
const demoUsers = [
  { username: 'alice', password: 'alice123', role: 'editor' },
  { username: 'bob', password: 'bob123', role: 'viewer' },
];

for (const { username: u, password: p, role: r } of demoUsers) {
  const hash = await bcrypt.hash(p, 10);
  await prisma.adminUser.upsert({
    where: { username: u },
    update: { passwordHash: hash, role: r },
    create: { username: u, passwordHash: hash, role: r },
  });
  console.log(`Seeded user: ${u} (role: ${r})`);
}
```

- [ ] **Step 3: Seed Services**

Add this:

```ts
const services = [
  {
    code: 'ELE',
    title: 'Electrical Engineering',
    desc: 'Power, lighting, fire detection, security systems.',
    points: JSON.stringify(['Power distribution', 'Lighting design', 'Fire alarms']),
    statValue: '100+',
    statLabel: 'Projects',
    order: 0,
  },
  {
    code: 'MEC',
    title: 'Mechanical Engineering',
    desc: 'HVAC, heating, cooling, ventilation design.',
    points: JSON.stringify(['HVAC design', 'Heat pumps', 'Ventilation']),
    statValue: '80+',
    statLabel: 'Designs',
    order: 1,
  },
  {
    code: 'ENV',
    title: 'Environmental Consulting',
    desc: 'Energy assessment, sustainability, Part L compliance.',
    points: JSON.stringify(['Energy modeling', 'Net-zero roadmaps', 'BREEAM']),
    statValue: '50+',
    statLabel: 'Assessments',
    order: 2,
  },
];

for (const svc of services) {
  await prisma.service.upsert({
    where: { code: svc.code },
    update: svc,
    create: svc,
  });
}
console.log('Seeded 3 services');
```

- [ ] **Step 4: Seed Team members**

Add this:

```ts
const team = [
  {
    name: 'Sarah Chen',
    role: 'Senior MEP Engineer',
    discipline: 'MEC',
    bio: 'Lead mechanical engineer with 15 years of HVAC design experience.',
    photo: null,
    order: 0,
  },
  {
    name: 'James Patel',
    role: 'Electrical Systems Lead',
    discipline: 'ELE',
    bio: 'Expert in power distribution and lighting design for commercial projects.',
    photo: null,
    order: 1,
  },
  {
    name: 'Emma Rodriguez',
    role: 'Sustainability Consultant',
    discipline: 'ENV',
    bio: 'Specialises in net-zero strategies and Part L compliance.',
    photo: null,
    order: 2,
  },
];

for (const member of team) {
  await prisma.team.create({
    data: member,
  });
}
console.log('Seeded 3 team members');
```

- [ ] **Step 5: Seed Testimonials**

Add this:

```ts
const testimonials = [
  {
    quote: 'The team delivered a world-class MEP design ahead of schedule and under budget.',
    author: 'Dr. Michael Foster',
    company: 'Ashworth Education Trust',
    logo: null,
    order: 0,
  },
  {
    quote: 'Their attention to detail and sustainability focus set a new standard for our portfolio.',
    author: 'Lisa Wang',
    company: 'Landmark Developments',
    logo: null,
    order: 1,
  },
];

for (const testimonial of testimonials) {
  await prisma.testimonial.create({
    data: testimonial,
  });
}
console.log('Seeded 2 testimonials');
```

- [ ] **Step 6: Seed Accreditations**

Add this:

```ts
const accreditations = ['CIBSE', 'ISO 9001', 'Gas Safe', 'F-Gas', 'BREEAM'];

// Clear and recreate
await prisma.accreditation.deleteMany({});
for (const label of accreditations) {
  await prisma.accreditation.create({
    data: { label, order: accreditations.indexOf(label) },
  });
}
console.log('Seeded 5 accreditations');
```

- [ ] **Step 7: Run seed**

```bash
cd /Users/harleywilliams/websites/MEPM\ website/mepm-website
npx prisma db seed
```

Expected: "Seeded admin user: admin (role: editor)", "Seeded 3 services", "Seeded 3 team members", "Seeded 2 testimonials", "Seeded 5 accreditations".

- [ ] **Step 8: Verify with Prisma Studio**

```bash
npx prisma studio
```

Check that Services, Team, Testimonials, Accreditations tables have data.

- [ ] **Step 9: Commit**

```bash
git add prisma/seed.ts
git commit -m "seed: add demo users (with roles), services, team, testimonials, accreditations"
```

---

## Task 4: Create Team API routes (GET/POST/PATCH/DELETE + photo upload)

**Files:**
- Create: `lib/team.ts`
- Create: `app/api/team/route.ts`
- Create: `app/api/team/[id]/route.ts`

- [ ] **Step 1: Create Team validation helper**

Create `lib/team.ts`:

```ts
export const DISCIPLINES = ['ELE', 'MEC', 'ENV'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export function isValidDiscipline(value: string): value is Discipline {
  return (DISCIPLINES as readonly string[]).includes(value);
}

export interface TeamMemberDTO {
  id: string;
  name: string;
  role: string;
  discipline: string;
  bio: string;
  photo: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function validateTeamMember(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Name is required.';
  }
  if (!data.role || typeof data.role !== 'string' || !data.role.trim()) {
    errors.role = 'Role is required.';
  }
  if (!data.discipline || !isValidDiscipline(String(data.discipline))) {
    errors.discipline = 'Valid discipline required (ELE, MEC, ENV).';
  }
  if (data.bio && typeof data.bio !== 'string') {
    errors.bio = 'Bio must be a string.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 2: Create GET/POST team route**

Create `app/api/team/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTeamMember } from '@/lib/team';
import { saveUpload, deleteUpload, validateFiles, IMAGE_DOC_TYPES } from '@/lib/uploads';

/** Public: list all team members (published/visible). */
export async function GET() {
  const team = await prisma.team.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ team });
}

/** Admin: create a team member. */
export async function POST(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const role = String(form.get('role') || '').trim();
  const discipline = String(form.get('discipline') || '').trim();
  const bio = String(form.get('bio') || '').trim();
  const photo = form.get('photo');

  const validation = validateTeamMember({ name, role, discipline, bio });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  let photoPath: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const fileError = validateFiles([photo], {
      maxFiles: 1,
      maxSizeMB: 5,
      allowedTypes: IMAGE_DOC_TYPES,
    });
    if (fileError) {
      return NextResponse.json({ errors: { photo: fileError } }, { status: 400 });
    }
    const saved = await saveUpload(photo, 'public/uploads/team');
    photoPath = saved.storedPath;
  }

  const member = await prisma.team.create({
    data: {
      name,
      role,
      discipline,
      bio,
      photo: photoPath,
      order: (await prisma.team.count()) || 0,
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
```

- [ ] **Step 3: Create GET/PATCH/DELETE team member route**

Create `app/api/team/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTeamMember } from '@/lib/team';
import { saveUpload, deleteUpload, validateFiles, IMAGE_DOC_TYPES } from '@/lib/uploads';

/** Admin: fetch one team member. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ member });
}

/** Admin: update a team member. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const form = await req.formData();
  const name = form.get('name');
  const role = form.get('role');
  const discipline = form.get('discipline');
  const bio = form.get('bio');
  const photo = form.get('photo');

  const updateData: Record<string, unknown> = {};
  if (name) updateData.name = String(name).trim();
  if (role) updateData.role = String(role).trim();
  if (discipline) updateData.discipline = String(discipline).trim();
  if (bio !== undefined) updateData.bio = String(bio || '').trim();

  if (photo instanceof File && photo.size > 0) {
    const fileError = validateFiles([photo], {
      maxFiles: 1,
      maxSizeMB: 5,
      allowedTypes: IMAGE_DOC_TYPES,
    });
    if (fileError) {
      return NextResponse.json({ errors: { photo: fileError } }, { status: 400 });
    }
    if (member.photo) await deleteUpload(member.photo);
    const saved = await saveUpload(photo, 'public/uploads/team');
    updateData.photo = saved.storedPath;
  }

  // Validate the full object after updates
  const fullData = { ...member, ...updateData };
  const validation = validateTeamMember(fullData);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const updated = await prisma.team.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ member: updated });
}

/** Admin: delete a team member. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'delete')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const member = await prisma.team.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (member.photo) await deleteUpload(member.photo);
  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Test locally**

```bash
npm run dev
```

In another terminal:

```bash
# Get all team
curl -s http://localhost:3000/api/team

# Post a new team member (requires login first)
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"MEPMadmin2026!"}'

curl -s -b cookies.txt -X POST http://localhost:3000/api/team \
  -F 'name=Jane Engineer' -F 'role=Lead' -F 'discipline=ELE' -F 'bio=Expert in power systems.'
# Should return 201 with the created member
```

- [ ] **Step 5: Commit**

```bash
git add lib/team.ts app/api/team/
git commit -m "feat: add Team CRUD API with photo uploads"
```

---

## Task 5: Create Services API routes (GET/POST/PATCH/DELETE)

**Files:**
- Create: `lib/services.ts`
- Create: `app/api/services/route.ts`
- Create: `app/api/services/[id]/route.ts`

- [ ] **Step 1: Create Service validation helper**

Create `lib/services.ts`:

```ts
export const SERVICE_CODES = ['ELE', 'MEC', 'ENV'] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export function isValidServiceCode(value: string): value is ServiceCode {
  return (SERVICE_CODES as readonly string[]).includes(value);
}

export interface ServiceDTO {
  id: string;
  code: string;
  title: string;
  desc: string;
  points: string[]; // parsed from JSON string in DB
  statValue: string;
  statLabel: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function validateService(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.code || !isValidServiceCode(String(data.code))) {
    errors.code = 'Service code required (ELE, MEC, ENV).';
  }
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Title is required.';
  }
  if (!data.desc || typeof data.desc !== 'string' || !data.desc.trim()) {
    errors.desc = 'Description is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Parse points JSON string to array. */
export function parsePoints(pointsString: string): string[] {
  try {
    return JSON.parse(pointsString);
  } catch {
    return [];
  }
}

/** Stringify points array to JSON. */
export function stringifyPoints(points: string[]): string {
  return JSON.stringify(points || []);
}
```

- [ ] **Step 2: Create GET/POST services route**

Create `app/api/services/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateService, parsePoints, stringifyPoints } from '@/lib/services';

/** Public: list all services. */
export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({
    services: services.map((s) => ({
      ...s,
      points: parsePoints(s.points),
    })),
  });
}

/** Admin: create a service. */
export async function POST(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { code, title, desc, points, statValue, statLabel } = body;

  const validation = validateService({ code, title, desc });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      code: String(code).trim(),
      title: String(title).trim(),
      desc: String(desc).trim(),
      points: stringifyPoints(Array.isArray(points) ? points : []),
      statValue: String(statValue || ''),
      statLabel: String(statLabel || ''),
      order: (await prisma.service.count()) || 0,
    },
  });

  return NextResponse.json(
    {
      service: {
        ...service,
        points: parsePoints(service.points),
      },
    },
    { status: 201 }
  );
}
```

- [ ] **Step 3: Create GET/PATCH/DELETE service route**

Create `app/api/services/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateService, parsePoints, stringifyPoints } from '@/lib/services';

/** Admin: fetch one service. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({
    service: {
      ...service,
      points: parsePoints(service.points),
    },
  });
}

/** Admin: update a service. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const updateData: Record<string, unknown> = {};

  if ('title' in body) updateData.title = String(body.title).trim();
  if ('desc' in body) updateData.desc = String(body.desc).trim();
  if ('points' in body)
    updateData.points = stringifyPoints(Array.isArray(body.points) ? body.points : []);
  if ('statValue' in body) updateData.statValue = String(body.statValue || '');
  if ('statLabel' in body) updateData.statLabel = String(body.statLabel || '');
  if ('order' in body) updateData.order = Number(body.order) || 0;

  const updated = await prisma.service.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    service: {
      ...updated,
      points: parsePoints(updated.points),
    },
  });
}

/** Admin: delete a service. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'delete')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Test**

```bash
curl -s http://localhost:3000/api/services
# Should return the 3 seeded services with points parsed as arrays
```

- [ ] **Step 5: Commit**

```bash
git add lib/services.ts app/api/services/
git commit -m "feat: add Services CRUD API"
```

---

## Task 6: Create Testimonials API routes (GET/POST/PATCH/DELETE)

**Files:**
- Create: `lib/testimonials.ts`
- Create: `app/api/testimonials/route.ts`
- Create: `app/api/testimonials/[id]/route.ts`

- [ ] **Step 1: Create Testimonial validation helper**

Create `lib/testimonials.ts`:

```ts
export interface TestimonialDTO {
  id: string;
  quote: string;
  author: string;
  company: string | null;
  logo: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function validateTestimonial(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.quote || typeof data.quote !== 'string' || !data.quote.trim()) {
    errors.quote = 'Quote is required.';
  }
  if (!data.author || typeof data.author !== 'string' || !data.author.trim()) {
    errors.author = 'Author name is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 2: Create GET/POST testimonials route**

Create `app/api/testimonials/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTestimonial } from '@/lib/testimonials';

/** Public: list all testimonials. */
export async function GET() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ testimonials });
}

/** Admin: create a testimonial. */
export async function POST(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { quote, author, company, logo } = body;

  const validation = validateTestimonial({ quote, author });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      quote: String(quote).trim(),
      author: String(author).trim(),
      company: company ? String(company).trim() : null,
      logo: logo ? String(logo).trim() : null,
      order: (await prisma.testimonial.count()) || 0,
    },
  });

  return NextResponse.json({ testimonial }, { status: 201 });
}
```

- [ ] **Step 3: Create GET/PATCH/DELETE testimonial route**

Create `app/api/testimonials/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateTestimonial } from '@/lib/testimonials';

/** Admin: fetch one testimonial. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ testimonial });
}

/** Admin: update a testimonial. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const updateData: Record<string, unknown> = {};

  if ('quote' in body) updateData.quote = String(body.quote).trim();
  if ('author' in body) updateData.author = String(body.author).trim();
  if ('company' in body) updateData.company = body.company ? String(body.company).trim() : null;
  if ('logo' in body) updateData.logo = body.logo ? String(body.logo).trim() : null;
  if ('order' in body) updateData.order = Number(body.order) || 0;

  const updated = await prisma.testimonial.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ testimonial: updated });
}

/** Admin: delete a testimonial. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'delete')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.testimonial.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Test**

```bash
curl -s http://localhost:3000/api/testimonials
# Should return the 2 seeded testimonials
```

- [ ] **Step 5: Commit**

```bash
git add lib/testimonials.ts app/api/testimonials/
git commit -m "feat: add Testimonials CRUD API"
```

---

## Task 7: Create Accreditations API route (GET/POST)

**Files:**
- Create: `lib/accreditations.ts`
- Create: `app/api/accreditations/route.ts`

- [ ] **Step 1: Create accreditation helper**

Create `lib/accreditations.ts`:

```ts
export interface AccreditationDTO {
  id: string;
  label: string;
  order: number;
}

export function validateAccreditation(data: Record<string, unknown>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.label || typeof data.label !== 'string' || !data.label.trim()) {
    errors.label = 'Label is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 2: Create GET/POST accreditations route**

Create `app/api/accreditations/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateAccreditation } from '@/lib/accreditations';

/** Public: list all accreditations. */
export async function GET() {
  const accreditations = await prisma.accreditation.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({ accreditations });
}

/** Admin: create an accreditation. */
export async function POST(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'edit')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { label } = body;

  const validation = validateAccreditation({ label });
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const accreditation = await prisma.accreditation.create({
    data: {
      label: String(label).trim(),
      order: (await prisma.accreditation.count()) || 0,
    },
  });

  return NextResponse.json({ accreditation }, { status: 201 });
}
```

- [ ] **Step 3: Test**

```bash
curl -s http://localhost:3000/api/accreditations
# Should return the 5 seeded accreditations
```

- [ ] **Step 4: Commit**

```bash
git add lib/accreditations.ts app/api/accreditations/
git commit -m "feat: add Accreditations API (GET/POST)"
```

---

## Task 8: Create Media library endpoint (GET)

**Files:**
- Create: `lib/media.ts`
- Create: `app/api/media/route.ts`

- [ ] **Step 1: Create media scanner helper**

Create `lib/media.ts`:

```ts
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export interface MediaItem {
  url: string;
  filename: string;
  storedPath: string;
  collection: 'projects' | 'team' | 'testimonials';
}

/**
 * Scan public/uploads/ and return all image files with metadata.
 * Used by the media library endpoint.
 */
export async function scanMedia(): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  const collections = ['projects', 'team', 'testimonials'] as const;

  for (const collection of collections) {
    const collPath = path.join(uploadDir, collection);
    try {
      const dirs = await readdir(collPath);

      for (const dir of dirs) {
        const dirPath = path.join(collPath, dir);
        try {
          const files = await readdir(dirPath);

          for (const file of files) {
            const storedPath = `public/uploads/${collection}/${dir}/${file}`;
            const url = `/uploads/${collection}/${dir}/${file}`;
            items.push({
              url,
              filename: file,
              storedPath,
              collection,
            });
          }
        } catch {
          // Skip if dir doesn't exist or can't be read
        }
      }
    } catch {
      // Skip if collection dir doesn't exist
    }
  }

  return items;
}
```

- [ ] **Step 2: Create media endpoint**

Create `app/api/media/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { scanMedia } from '@/lib/media';

/** Public: list all uploaded images. */
export async function GET() {
  const media = await scanMedia();
  return NextResponse.json({ media });
}
```

- [ ] **Step 3: Test**

```bash
curl -s http://localhost:3000/api/media
# Should return: { "media": [] } since no team/project/testimonial images have been uploaded yet
```

- [ ] **Step 4: Commit**

```bash
git add lib/media.ts app/api/media/
git commit -m "feat: add Media library endpoint"
```

---

## Task 9: Create Export endpoint (GET /api/export)

**Files:**
- Create: `app/api/export/route.ts`

- [ ] **Step 1: Create export route**

Create `app/api/export/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { parsePoints } from '@/lib/services';

/** Admin: export full content as JSON. */
export async function GET(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'system')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const [projects, enquiries, services, team, testimonials, accreditations, siteStats, users] =
    await Promise.all([
      prisma.project.findMany({ include: { images: true } }),
      prisma.enquiry.findMany({ include: { attachments: true } }),
      prisma.service.findMany(),
      prisma.team.findMany(),
      prisma.testimonial.findMany(),
      prisma.accreditation.findMany(),
      prisma.stat.findMany(),
      prisma.adminUser.findMany(),
    ]);

  const export_data = {
    projects: projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      sector: p.sector,
      disciplines: p.disciplines.split(',').filter(Boolean),
      summary: p.summary,
      detail: p.detail,
      client: p.client,
      location: p.location,
      year: p.year,
      status: p.status,
      featured: p.featured,
      published: p.published,
      order: p.order,
      hero: p.images.find((img) => img.isCover)?.storedPath || null,
      gallery: p.images.map((img) => img.storedPath),
      updated: p.updatedAt.toISOString(),
    })),
    enquiries: enquiries.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      organisation: e.organisation,
      service: e.service,
      message: e.message,
      status: e.status,
      date: e.createdAt.toISOString(),
    })),
    services: services.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      desc: s.desc,
      points: parsePoints(s.points),
      statValue: s.statValue,
      statLabel: s.statLabel,
      order: s.order,
    })),
    team: team.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      discipline: t.discipline,
      bio: t.bio,
      photo: t.photo,
      order: t.order,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      quote: t.quote,
      author: t.author,
      company: t.company,
      logo: t.logo,
      order: t.order,
    })),
    accreditations: accreditations.map((a) => a.label),
    siteStats: siteStats.map((s) => ({
      id: s.id,
      prefix: s.prefix,
      value: s.value,
      suffix: s.suffix,
      label: s.label,
      order: s.order,
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
    })),
    exportedAt: new Date().toISOString(),
  };

  return NextResponse.json(export_data, {
    headers: {
      'Content-Disposition': `attachment; filename="mepm-content-export-${Date.now()}.json"`,
    },
  });
}
```

- [ ] **Step 2: Test (requires admin role)**

```bash
# Login first
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"MEPMadmin2026!"}'

# Try export (should fail with 403 since admin has 'editor' role, not 'system')
curl -s -b cookies.txt http://localhost:3000/api/export
# Expected: { "error": "Forbidden: insufficient permissions", "status": 403 }
```

Actually, we need to update the seed so at least one user has the 'system' role. Let me revise:

- [ ] **Step 2 (revised): Update seed to create an admin with 'administrator' role**

Modify `prisma/seed.ts`. Change the initial admin seeding:

```ts
// OLD:
await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash, role: 'editor' },
  create: { username, passwordHash, role: 'editor' },
});

// NEW:
await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash, role: 'administrator' },
  create: { username, passwordHash, role: 'administrator' },
});
```

Then re-seed:

```bash
npx prisma db seed
```

Then test again:

```bash
curl -s -b cookies.txt http://localhost:3000/api/export | jq '.projects | length'
# Should return a number (count of projects) since admin now has 'administrator' role
```

- [ ] **Step 3: Commit**

```bash
git add app/api/export/route.ts prisma/seed.ts
git commit -m "feat: add Export endpoint; fix admin role to administrator"
```

---

## Task 10: Create User management endpoint (GET users, optionally POST to add)

**Files:**
- Create: `app/api/users/route.ts`

- [ ] **Step 1: Create users endpoint**

Create `app/api/users/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import { isValidRole } from '@/lib/roles';

/** Admin: list all users (system permission). */
export async function GET(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'users')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ users });
}

/** Admin: create a new user (system permission). */
export async function POST(req: Request) {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role, 'users')) {
    return NextResponse.json(forbidden(), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { username, password, role } = body;

  const errors: Record<string, string> = {};

  if (!username || typeof username !== 'string' || username.length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (!role || !isValidRole(role)) {
    errors.role = 'Valid role required (administrator, editor, viewer).';
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const newUser = await prisma.adminUser.create({
    data: { username, passwordHash, role },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user: newUser }, { status: 201 });
}
```

- [ ] **Step 2: Test**

```bash
# List users (admin can do this)
curl -s -b cookies.txt http://localhost:3000/api/users
# Should return: { "users": [{ id: ..., username: "admin", role: "administrator", ... }, { username: "alice", role: "editor", ... }, ...] }

# Create a new user
curl -s -b cookies.txt -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"username":"charlie","password":"pass123","role":"viewer"}'
# Should return 201 with the new user
```

- [ ] **Step 3: Commit**

```bash
git add app/api/users/
git commit -m "feat: add User management endpoint (GET/POST)"
```

---

## Task 11: Create a GET /api/roles endpoint (for client to know user's role)

**Files:**
- Create: `app/api/roles/route.ts`

- [ ] **Step 1: Create roles endpoint**

Create `app/api/roles/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { verifyAuthWithUser } from '@/lib/auth';
import { PERMS } from '@/lib/permissions';

/** Admin: get current user's role and permissions. */
export async function GET() {
  try {
    var user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      username: user.username,
      role: user.role,
    },
    permissions: Array.from(PERMS[user.role as keyof typeof PERMS] || new Set()),
  });
}
```

- [ ] **Step 2: Test**

```bash
curl -s -b cookies.txt http://localhost:3000/api/roles
# Should return: { "user": { "username": "admin", "role": "administrator" }, "permissions": ["edit", "delete", "publish", "system", "users", "browse"] }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/roles/
git commit -m "feat: add Roles endpoint for client"
```

---

## Task 12: Final integration test

**Files:**
- None (testing only)

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify all endpoints respond**

```bash
# Public endpoints (no auth needed)
curl -s http://localhost:3000/api/services | jq '.services | length'
curl -s http://localhost:3000/api/team | jq '.team | length'
curl -s http://localhost:3000/api/testimonials | jq '.testimonials | length'
curl -s http://localhost:3000/api/accreditations | jq '.accreditations | length'
curl -s http://localhost:3000/api/media | jq '.media | length'

# Admin endpoints (need auth)
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"MEPMadmin2026!"}'

curl -s -b cookies.txt http://localhost:3000/api/users | jq '.users | length'
curl -s -b cookies.txt http://localhost:3000/api/roles | jq '.permissions'
curl -s -b cookies.txt http://localhost:3000/api/export | jq '.projects | length'
```

- [ ] **Step 3: Verify type-checking**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

---

## Spec Coverage Checklist

- ✅ Projects (already existed, now have update/delete via PATCH/DELETE)
- ✅ Enquiries (already existed)
- ✅ Services (GET/POST/PATCH/DELETE with points as JSON array)
- ✅ Site stats (Stat model existed, accessible via `/api/settings`, exported via `/api/export`)
- ✅ Accreditations (GET/POST, flat array)
- ✅ Testimonials (GET/POST/PATCH/DELETE)
- ✅ Team (GET/POST/PATCH/DELETE with photo uploads to public zone)
- ✅ Media library (GET `/api/media` scans and lists)
- ✅ Users with roles (Administrator, Editor, Viewer)
- ✅ Role permissions gated on every mutating action
- ✅ Export endpoint (GET `/api/export` returns full JSON, matches CMS prototype shape)
- ✅ Login returns role in JWT and `/api/roles` endpoint tells client their permissions

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-17-cms-backend.md`.**

## Execution Options

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration and parallelization.

**2. Inline Execution** — Execute tasks in this session using executing-plans skill, batch execution with checkpoints for review.

**Which approach would you prefer?**