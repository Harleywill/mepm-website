# MEPM Backend — How It Works

This document explains the server-side half of the MEPM website: the database,
authentication, the API, file uploads, email, and deployment — **with real code
examples** taken from the source. It is written to be read on its own.

The MEPM backend was added to a previously **static** marketing site to give it
a password-protected admin area and dynamic content. It uses a deliberately
small, low-maintenance stack (SQLite + Prisma + Next.js route handlers) and a
fully `httpOnly` auth cookie.

> Every code block below is copied (or lightly trimmed) from the live source and
> links to the file it came from. If a snippet ever drifts from the file, trust
> the file.

---

## 1. The big picture

```
                       PUBLIC INTERNET
   ┌──────────────────────────┐        ┌───────────────────────────┐
   │  Public site             │        │  Admin area  (/admin/*)   │
   │  /  /services  /projects │        │  login · enquiries ·      │
   │  /contact                │        │  projects · settings      │
   └────────────┬─────────────┘        └─────────────┬─────────────┘
                │  fetch()                            │  fetch() (cookie)
                ▼                                     ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │   Next.js App Router route handlers  (app/api/**/route.ts)       │
   │   • public routes: create enquiry, read settings, list published │
   │   • admin routes:  every one calls verifyAuth() first            │
   └───────────────┬───────────────────────────────┬─────────────────┘
                   │                                │
        ┌──────────▼──────────┐         ┌───────────▼──────────┐
        │  Prisma ORM         │         │  Local filesystem    │
        │  → SQLite dev.db    │         │  uploads/  (private) │
        │                     │         │  public/uploads/     │
        └─────────────────────┘         └──────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Resend (email)     │  best-effort new-enquiry alerts
        └─────────────────────┘
```

There is **no separate backend server**. The "backend" is a set of Next.js
*route handlers* (files named `route.ts` under `app/api/`) running inside the
same Next.js process that serves the pages. The process is managed by **PM2** on
the VPS.

**Anatomy of a route handler** — a file at `app/api/foo/route.ts` exports one
async function per HTTP method. Dynamic segments (`[id]`) arrive as a `params`
promise:

```ts
// app/api/example/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;            // dynamic segment
  const { searchParams } = new URL(req.url); // ?query=…
  return Response.json({ id });
}
```

---

## 2. Technology stack

| Concern        | Choice                                   | Notes |
|----------------|------------------------------------------|-------|
| Runtime/server | Next.js 16 (App Router) route handlers   | Same process serves pages + API |
| Language       | TypeScript                               | |
| Database       | **SQLite** file `prisma/dev.db`          | Single-file DB, lives on the VPS |
| ORM            | **Prisma 6** (`@prisma/client`)          | Pinned to v6 deliberately — see below |
| Auth           | `bcryptjs` (hashing) + `jose` (JWT)      | JWT stored in an httpOnly cookie |
| Email          | **Resend**                               | Optional; no-op if unconfigured |
| Process mgr    | **PM2** (`mepm-website`)                  | On the VPS |

**Why Prisma 6, not 7?** Prisma 7 drops `url` from the datasource block and
requires driver adapters, which would mean reworking the database config for no
benefit here. The datasource pins v6 on purpose:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")   // ← Prisma 7 removes this; do not upgrade blindly
}
```

---

## 3. The data model

All models live in [`prisma/schema.prisma`](../prisma/schema.prisma). SQLite has
no enums, so status/discipline fields are plain strings validated in code. IDs
are `cuid()` strings except the settings singleton, whose id is always `"main"`.

```
Enquiry 1───* Attachment        (contact-form submissions + their files)
Project 1───* ProjectImage      (project register entries + their photos)
AdminUser                       (login accounts; password is bcrypt-hashed)
SiteSettings (singleton "main") (contact details + social links)
Stat                            (count-up figures in the stat strip)
Qualification                   (credential chips in the stat strip)
```

### Enquiry / Attachment

```prisma
model Enquiry {
  id           String       @id @default(cuid())
  name         String
  email        String
  phone        String?
  organisation String?
  service      String?
  message      String
  status       String       @default("new") // new | read | replied | archived
  createdAt    DateTime     @default(now())
  attachments  Attachment[]
}

model Attachment {
  id         String  @id @default(cuid())
  enquiryId  String
  enquiry    Enquiry @relation(fields: [enquiryId], references: [id], onDelete: Cascade)
  filename   String   // original name, shown to admins
  storedPath String   // randomised on-disk path, repo-relative
  mimeType   String
  size       Int
}
```

`onDelete: Cascade` means deleting an enquiry removes its attachment **rows**
automatically — but **not** the files on disk, which the route deletes
explicitly (see §6B). Attachment files live in a **private** folder and are
never served statically.

### Project / ProjectImage

```prisma
model Project {
  id          String         @id @default(cuid())
  slug        String         @unique
  title       String
  client      String?
  location    String?
  sector      String?
  disciplines String         @default("") // CSV of ELE|MEC|ENV
  status      String         @default("complete") // planned | in_progress | complete
  year        Int?
  summary     String         @default("")
  detail      String         @default("")
  featured    Boolean        @default(false)
  published   Boolean        @default(false) // only published projects show publicly
  order       Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  images      ProjectImage[]
}

model ProjectImage {
  id         String  @id @default(cuid())
  projectId  String
  project    Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  filename   String
  storedPath String   // under public/ → publicly served
  mimeType   String
  size       Int
  caption    String?
  isCover    Boolean @default(false)
  order      Int     @default(0)
}
```

`disciplines` is a **CSV string** because SQLite can't store arrays. The
conversion helpers live in `lib/projects.ts` (§9). Project images are **public**
because they appear on the public register.

### SiteSettings / Stat / Qualification

```prisma
// Single-row site settings (id is always "main").
model SiteSettings {
  id           String   @id @default("main")
  phone        String   @default("")
  email        String   @default("")
  addressLine1 String   @default("")
  addressLine2 String   @default("")
  addressLine3 String   @default("")
  facebook     String   @default("")
  twitter      String   @default("")
  instagram    String   @default("")
  linkedin     String   @default("")
  updatedAt    DateTime @updatedAt
}

model Stat {          // animated count-up figures, e.g. "29 Years in practice"
  id     String @id @default(cuid())
  prefix String @default("")
  value  Int    @default(0)
  suffix String @default("")
  label  String
  order  Int    @default(0)
}

model Qualification { // credential chips in the stat strip band
  id    String @id @default(cuid())
  label String
  order Int    @default(0)
}
```

---

## 4. Authentication — how login and protection work

Auth logic is centralised in [`lib/auth.ts`](../lib/auth.ts).

### The auth library

```ts
// lib/auth.ts
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
    httpOnly: true,                                  // ← not readable from JS
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
```

Key properties of the cookie: **`httpOnly`** (not readable from JavaScript →
mitigates XSS token theft), `secure` in production, `sameSite: lax`, 7-day
expiry. Passwords are only ever stored as a bcrypt hash (10 salt rounds).

### Login flow (the route)

```ts
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
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
    return NextResponse.json(
      { error: 'Incorrect username or password' },
      { status: 401 }
    );
  }

  const token = await signToken(user.username);
  await setAuthCookie(token);          // ← Set-Cookie: auth-token=…
  return NextResponse.json({ ok: true });
}
```

Logging out just clears the cookie:

```ts
// app/api/auth/logout/route.ts
export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
```

### Two layers of protection (and which one matters)

**1. Client guard — UX only.** [`app/admin/AdminGuard.tsx`](../app/admin/AdminGuard.tsx)
wraps admin pages. Because the cookie is httpOnly it *cannot* read the token, so
it asks the server via `GET /api/auth/me`:

```tsx
// app/admin/AdminGuard.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!active) return;
        if (res.ok) setState('ok');
        else router.replace('/admin/login');   // not logged in → bounce
      })
      .catch(() => { if (active) router.replace('/admin/login'); });
    return () => { active = false; };
  }, [router]);

  if (state === 'checking') return <span>Checking session…</span>;
  return <>{children}</>;
}
```

The probe it calls:

```ts
// app/api/auth/me/route.ts
export async function GET() {
  try {
    const payload = await verifyAuth();
    return NextResponse.json({ ok: true, username: payload.sub });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
```

**2. Server enforcement — the real gate.** Every admin route's first line is
`verifyAuth()`. The pattern, repeated everywhere:

```ts
export async function GET(/* … */) {
  try {
    await verifyAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  // …authorised work…
}
```

> If you bypassed the UI guard, the API would still refuse — the server check is
> what actually protects the data. The cookie is intentionally never readable by
> the client — the guard asks the server instead. **Don't "fix" the guard by
> making the cookie readable.**

---

## 5. The API surface

All routes are App Router handlers under `app/api/`. "Public" = no auth; "Admin"
= `verifyAuth()` required.

### Auth
| Method & path            | Access | Purpose |
|--------------------------|--------|---------|
| `POST /api/auth/login`   | Public | Validate credentials, set cookie |
| `POST /api/auth/logout`  | Public | Clear cookie |
| `GET  /api/auth/me`      | Cookie | Session probe for the client guard |

### Enquiries
| Method & path                                  | Access | Purpose |
|------------------------------------------------|--------|---------|
| `POST /api/enquiries`                          | Public | Create from contact form (multipart) |
| `GET  /api/enquiries?status=&search=`          | Admin  | List, filter by status + text search |
| `GET  /api/enquiries/[id]`                      | Admin  | One enquiry with attachments |
| `PATCH /api/enquiries/[id]`                     | Admin  | Change status |
| `DELETE /api/enquiries/[id]`                    | Admin  | Delete enquiry + its files |
| `GET /api/enquiries/[id]/attachments/[attId]`  | Admin  | Stream a private attachment as a download |

### Projects
| Method & path                          | Access | Purpose |
|----------------------------------------|--------|---------|
| `GET  /api/projects`                   | Mixed  | Public sees `published` only; admin (`?admin=1` + cookie) sees all |
| `POST /api/projects`                   | Admin  | Create (auto-slug) |
| `GET/PATCH/DELETE /api/projects/[id]`  | Admin  | Read / update / delete one |
| `POST /api/projects/[id]/images`       | Admin  | Upload project images |
| `DELETE /api/projects/[id]/images/[imgId]` | Admin | Remove an image |

### Settings
| Method & path        | Access | Purpose |
|----------------------|--------|---------|
| `GET /api/settings`  | Public | Contact details, socials, stats, qualifications |
| `PUT /api/settings`  | Admin  | Save settings + **replace** the stats & qualifications lists |

---

## 6. Walkthroughs of the core flows (with code)

### A. A visitor submits the contact form

Handled by `POST /api/enquiries`
([`app/api/enquiries/route.ts`](../app/api/enquiries/route.ts)). The notable
parts — multipart parsing, validation, and the **rollback** if a file write
fails:

```ts
// app/api/enquiries/route.ts  (POST — public)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('message') || '').trim();
  // …phone, organisation, service…

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email.';
  if (!message) errors.message = 'A message is required.';
  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 400 }); // field-level errors
  }

  const files = form
    .getAll('attachments')
    .filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateFiles(files, {
    maxFiles: 6, maxSizeMB: 10, allowedTypes: ENQUIRY_TYPES,
  });
  if (fileError) {
    return NextResponse.json({ errors: { attachments: fileError } }, { status: 400 });
  }

  const enquiry = await prisma.enquiry.create({
    data: { name, email, phone, organisation, service, message },
  });

  // Save files; on any failure roll BOTH the files and the row back so we
  // never leave a half-written record.
  const saved: string[] = [];
  try {
    for (const file of files) {
      const meta = await saveUpload(file, `uploads/enquiries/${enquiry.id}`);
      saved.push(meta.storedPath);
      await prisma.attachment.create({
        data: { enquiryId: enquiry.id, filename: meta.filename,
                storedPath: meta.storedPath, mimeType: meta.mimeType, size: meta.size },
      });
    }
  } catch (err) {
    await Promise.all(saved.map(deleteUpload));                  // undo files
    await prisma.enquiry.delete({ where: { id: enquiry.id } }).catch(() => {}); // undo row
    return NextResponse.json(
      { error: 'Could not save your attachments. Please try again.' },
      { status: 500 }
    );
  }

  // Best-effort email; never blocks the saved enquiry (see §8).
  await sendEnquiryAlert(
    { name, email, phone, organisation, service, message },
    files.map((f) => f.name)
  );

  return NextResponse.json({ ok: true });
}
```

**Calling it from a form** (the client side). Note: send `FormData`, **not**
JSON, so files come along:

```ts
const fd = new FormData();
fd.append('name', name);
fd.append('email', email);
fd.append('message', message);
for (const file of selectedFiles) fd.append('attachments', file);

const res = await fetch('/api/enquiries', { method: 'POST', body: fd });
const data = await res.json();
if (!res.ok) {
  // data.errors is keyed by field: { email: 'Enter a valid email.' }
}
```

### B. An admin lists, reads, and manages enquiries

**List** with status + text filtering
([`app/api/enquiries/route.ts`](../app/api/enquiries/route.ts) `GET`):

```ts
export async function GET(req: Request) {
  try { await verifyAuth(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status')?.trim();

  const where: { status?: string; OR?: { [k: string]: { contains: string } }[] } = {};
  if (status && isEnquiryStatus(status)) where.status = status;
  if (search) {
    where.OR = [
      { name:    { contains: search } },
      { email:   { contains: search } },
      { message: { contains: search } },
    ];
  }

  const enquiries = await prisma.enquiry.findMany({
    where,
    include: { attachments: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ enquiries });
}
```

**Status update** ([`app/api/enquiries/[id]/route.ts`](../app/api/enquiries/[id]/route.ts) `PATCH`):

```ts
export async function PATCH(req: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try { await verifyAuth(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!isEnquiryStatus(status)) {       // guards against arbitrary strings
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  const enquiry = await prisma.enquiry.update({ where: { id }, data: { status } });
  return NextResponse.json({ enquiry });
}
```

**Auto-mark-read** — when the detail page opens a `new` enquiry it PATCHes it to
`read` so the unread badge clears (from `app/admin/enquiries/[id]/page.tsx`):

```ts
if (data.enquiry?.status === 'new') patchStatus('read');
// patchStatus → fetch(`/api/enquiries/${id}`, { method: 'PATCH', … })
```

**Delete** removes the attachment files *then* the row:

```ts
// app/api/enquiries/[id]/route.ts  (DELETE)
const enquiry = await prisma.enquiry.findUnique({
  where: { id }, include: { attachments: true },
});
if (!enquiry) return NextResponse.json({ error: 'not found' }, { status: 404 });

await Promise.all(enquiry.attachments.map((a) => deleteUpload(a.storedPath))); // files
await prisma.enquiry.delete({ where: { id } });                               // rows (cascade)
return NextResponse.json({ ok: true });
```

**Private attachment download** — verifies the file belongs to that enquiry,
then streams it with a download header
([`app/api/enquiries/[id]/attachments/[attId]/route.ts`](../app/api/enquiries/[id]/attachments/[attId]/route.ts)):

```ts
export async function GET(_req: Request,
  { params }: { params: Promise<{ id: string; attId: string }> }) {
  try { await verifyAuth(); }
  catch { return NextResponse.json({ error: 'unauthorized' }, { status: 401 }); }

  const { id, attId } = await params;
  const attachment = await prisma.attachment.findFirst({
    where: { id: attId, enquiryId: id },   // scoped: can't grab another enquiry's file
  });
  if (!attachment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const buffer = await readFile(path.join(process.cwd(), attachment.storedPath));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': attachment.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': String(attachment.size),
    },
  });
}
```

### C. Creating a project (auto-slug)

`POST /api/projects` generates a unique slug by suffixing on collision
([`app/api/projects/route.ts`](../app/api/projects/route.ts)):

```ts
const base = slugify(title) || 'project';   // "Ashworth Science Campus" → "ashworth-science-campus"
let slug = base;
let n = 2;
while (await prisma.project.findUnique({ where: { slug } })) {
  slug = `${base}-${n++}`;                   // …-2, …-3 on collision
}

const status = isProjectStatus(String(body.status)) ? body.status : 'complete';

const project = await prisma.project.create({
  data: {
    slug, title,
    client: body.client?.trim() || null,
    disciplines: disciplinesFromArray(body.disciplines ?? []), // ["ELE","MEC"] → "ELE,MEC"
    status,
    year: body.year ? Number(body.year) : null,
    featured: Boolean(body.featured),
    published: Boolean(body.published),
    // …summary, detail, location, sector…
  },
  include: { images: true },
});
```

The public-vs-admin visibility split lives in the same file's `GET`:

```ts
const wantAll = searchParams.get('admin') === '1';
const admin = await isAdmin();            // true only with a valid cookie
const projects = await prisma.project.findMany({
  where: wantAll && admin ? {} : { published: true },  // public → published only
  include: { images: { orderBy: { order: 'asc' } } },
  orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
});
```

The `PATCH` handler does **partial** updates — it only writes keys that are
present in the body, so the form can send just what changed:

```ts
// app/api/projects/[id]/route.ts (PATCH, excerpt)
const data: Record<string, unknown> = {};
if (typeof body.title === 'string') data.title = body.title.trim();
if ('client' in body) data.client = body.client?.trim() || null;
if ('disciplines' in body) data.disciplines = disciplinesFromArray(body.disciplines ?? []);
if (typeof body.status === 'string' && isProjectStatus(body.status)) data.status = body.status;
if ('published' in body) data.published = Boolean(body.published);
// …then: prisma.project.update({ where: { id }, data, include: { images: … } })
```

### D. Uploading project images (cover logic)

`POST /api/projects/[id]/images`
([`app/api/projects/[id]/images/route.ts`](../app/api/projects/[id]/images/route.ts))
— the **first image overall becomes the cover**:

```ts
let nextOrder = project.images.length;
let hasCover = project.images.some((i) => i.isCover);

for (const file of files) {
  const meta = await saveUpload(file, `public/uploads/projects/${id}`); // PUBLIC zone
  await prisma.projectImage.create({
    data: {
      projectId: id, filename: meta.filename, storedPath: meta.storedPath,
      mimeType: meta.mimeType, size: meta.size,
      isCover: !hasCover,        // first one in → cover
      order: nextOrder++,
    },
  });
  hasCover = true;
}
```

---

## 7. File uploads

Centralised in [`lib/uploads.ts`](../lib/uploads.ts). The two functions you'll
use most:

```ts
// lib/uploads.ts (excerpts)
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Returns an error string, or null if all files are acceptable. */
export function validateFiles(
  files: File[],
  { maxFiles = 6, maxSizeMB = 10, allowedTypes }: ValidateOptions = {}
): string | null {
  if (files.length > maxFiles) return `Up to ${maxFiles} files.`;
  for (const file of files) {
    if (file.size > maxSizeMB * 1024 * 1024)
      return `${file.name} is over ${maxSizeMB} MB.`;
    if (allowedTypes) {
      const ext = path.extname(file.name).toLowerCase();
      const ok = allowedTypes.includes(file.type) || CAD_EXTS.includes(ext); // .dwg/.dxf/.rvt
      if (!ok) return `${file.name} is not an accepted file type.`;
    }
  }
  return null;
}

/** Write a File under destDirRel (repo-relative). On-disk name is randomised;
 *  the original is preserved in `filename`. */
export async function saveUpload(file: File, destDirRel: string): Promise<SavedFile> {
  const absDir = path.join(process.cwd(), destDirRel);
  await mkdir(absDir, { recursive: true });
  const storedName = `${randomUUID()}${path.extname(file.name)}`;
  const storedPathRel = path.join(destDirRel, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(process.cwd(), storedPathRel), buffer);
  return { filename: file.name, storedPath: storedPathRel,
           mimeType: file.type || 'application/octet-stream', size: file.size };
}
```

**Two storage zones, chosen by privacy:**

| Zone | Path | Served? | Used for |
|------|------|---------|----------|
| Private | `uploads/enquiries/<id>/` | No — outside `public/` | Enquiry attachments (downloaded only via authed route) |
| Public  | `public/uploads/projects/<id>/` | Yes — Next.js serves it | Project register images |

Both folders (plus `prisma/dev.db` and `.env`) are git-ignored and **persist on
the VPS across deploys**. CAD files (`.dwg/.dxf/.rvt`) pass validation by
extension because they have no reliable MIME type.

---

## 8. Email (Resend)

[`lib/email.ts`](../lib/email.ts) sends a plain-text new-enquiry alert. Two
deliberate properties: it **never throws**, and it **no-ops when unconfigured**:

```ts
// lib/email.ts (excerpt)
export async function sendEnquiryAlert(enquiry: EnquiryAlert, filenames: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_NOTIFY_TO;
  const from = process.env.ENQUIRY_FROM || 'MEPM Website <onboarding@resend.dev>';

  if (!apiKey || !to) {                       // not configured → log & return
    console.log(`[email] Resend not configured — skipping alert for ${enquiry.email}`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from, to,
      replyTo: enquiry.email,                 // replies go straight to the enquirer
      subject: `New enquiry — ${enquiry.name}`,
      text: /* name / email / message / attachment list */,
    });
    if (error) console.error('[email] Resend rejected the message:', error);
  } catch (err) {
    console.error('[email] Failed to send enquiry alert:', err); // swallowed, never thrown
  }
}
```

This is why the POST handler can `await sendEnquiryAlert(...)` safely — a mail
outage logs an error but can never lose a saved enquiry. For production, verify
the `mepmservices.co.uk` domain in Resend and set a real `ENQUIRY_FROM`.

---

## 9. The `lib/` layer

Route handlers stay thin; shared logic lives in `lib/`:

| File              | Responsibility |
|-------------------|----------------|
| `lib/db.ts`       | The singleton `PrismaClient` (reused across dev hot-reloads) |
| `lib/auth.ts`     | Password hashing, JWT sign/verify, cookie set/clear, `verifyAuth()` |
| `lib/uploads.ts`  | File validation, save/delete, public-URL mapping |
| `lib/email.ts`    | Resend enquiry alerts (best-effort) |
| `lib/enquiries.ts`| Enquiry status constants/labels + type guards + DTO types |
| `lib/projects.ts` | Discipline/status constants, slugify, CSV↔array, DTO types |
| `lib/settings.ts` | `getSettings()` (+ sensible defaults if the DB is fresh) |
| `lib/services.ts` | **Static** service copy — editorial content shipped in code, not the DB |

**The Prisma singleton** — important so dev hot-reloads don't exhaust DB
connections:

```ts
// lib/db.ts
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**String-validated "enums"** — since SQLite has none, each set of allowed values
is a `const` tuple plus a type guard. Example:

```ts
// lib/enquiries.ts
export const ENQUIRY_STATUSES = ['new', 'read', 'replied', 'archived'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return (ENQUIRY_STATUSES as readonly string[]).includes(value);
}
```

**CSV ↔ array + slug helpers** for projects:

```ts
// lib/projects.ts
export const DISCIPLINES = ['ELE', 'MEC', 'ENV'] as const;

/** "ELE,MEC" → ["ELE","MEC"], filtered to valid codes. */
export function disciplinesToArray(csv: string): Discipline[] {
  return csv.split(',').map((s) => s.trim().toUpperCase())
    .filter((s): s is Discipline => (DISCIPLINES as readonly string[]).includes(s));
}
export function disciplinesFromArray(arr: string[]): string {
  return disciplinesToArray(arr.join(',')).join(',');
}

/** Lowercase, hyphenated, url-safe slug from a title. */
export function slugify(title: string): string {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
```

**Settings read with defaults** so the public site is never empty on a fresh DB:

```ts
// lib/settings.ts (excerpt)
export async function getSettings(): Promise<FullSettings> {
  const [row, stats, qualifications] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    prisma.stat.findMany({ orderBy: { order: 'asc' } }),
    prisma.qualification.findMany({ orderBy: { order: 'asc' } }),
  ]);
  return {
    settings: row ? { /* map row */ } : DEFAULT_SETTINGS,
    stats: stats.length > 0 ? stats : DEFAULT_STATS,  // fallback so the strip shows something
    qualifications,
  };
}
```

`lib/services.ts` is **content, not data** — the three discipline pages and six
service offerings are hard-coded objects because they rarely change, whereas
projects/enquiries/settings are dynamic.

---

## 10. Environment variables

All env lives in **`.env`** (not `.env.local`) so the Prisma CLI can read it
during `prisma db seed`. `.env`, `prisma/dev.db`, `uploads/`, and
`public/uploads/` are git-ignored.

```bash
DATABASE_URL="file:./dev.db"      # SQLite path (relative to prisma/)
JWT_SECRET="<long-random-string>" # signs the auth JWT — set a strong value in prod
ADMIN_USERNAME="admin"            # seeded admin login
ADMIN_PASSWORD="MEPMadmin2026!"   # seeded admin password — CHANGE for production
RESEND_API_KEY="re_…"            # optional; omit to disable email
ENQUIRY_FROM="MEPM Website <noreply@mepmservices.co.uk>"
ENQUIRY_NOTIFY_TO="enquiries@mepmservices.co.uk"
```

> **Local dev credentials:** username `admin`, password `MEPMadmin2026!`.
> Change these before production.

---

## 11. Seeding

[`prisma/seed.ts`](../prisma/seed.ts) is **idempotent** and safe to run on every
deploy:

```ts
// prisma/seed.ts (excerpt)
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'change-me';
const passwordHash = await bcrypt.hash(password, 10);

// Create the admin on first run; re-hash on later runs so a changed
// ADMIN_PASSWORD takes effect on deploy.
await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash },
  create: { username, passwordHash },
});

// Settings singleton — create defaults once, NEVER overwrite admin edits.
await prisma.siteSettings.upsert({
  where: { id: 'main' },
  update: {},                            // ← empty: edits survive re-seeding
  create: { id: 'main', phone: '01482 838080', email: 'info@mepmservices.co.uk', /* … */ },
});

// Default stats — only when none exist, so deletes/edits survive re-seeding.
if ((await prisma.stat.count()) === 0) {
  await prisma.stat.createMany({ data: [ /* 29 years, 3 disciplines, 6 service lines */ ] });
}
```

The three patterns — `upsert` with a real `update`, `upsert` with an empty
`update`, and "create only if empty" — are each chosen so re-running the seed on
every deploy never clobbers real admin changes.

---

## 12. Deployment

The app runs on its **own dedicated VPS** under PM2 as `mepm-website`. Deploy
with [`deploy.sh`](../deploy.sh), run on the VPS from the repo root. It is
**non-destructive by design**:

```bash
# deploy.sh
set -euo pipefail

git pull origin main
npm ci
npx prisma migrate deploy   # applies migrations, NEVER resets the DB
npx prisma db seed          # idempotent (admin user, default settings)
npm run build

if pm2 describe mepm-website > /dev/null 2>&1; then
  pm2 restart mepm-website --update-env
else
  pm2 start npm --name mepm-website -- start
fi
pm2 save
```

The script **never resets or reseeds sample data**, because doing so would wipe
real enquiries and uploaded project drawings. The SQLite DB and the upload
folders persist between deploys. See
[`docs/DEPLOY.md`](./DEPLOY.md) for full server setup.

**Outstanding before production:** real Resend/SMTP credentials for
`mepmservices.co.uk`, and the chosen VPS host/path.

---

## 13. Trying the API by hand (curl)

```bash
# 1. Log in, saving the cookie jar
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"MEPMadmin2026!"}'
# → {"ok":true}   (+ Set-Cookie: auth-token=…)

# 2. Confirm the session
curl -s -b cookies.txt http://localhost:3000/api/auth/me
# → {"ok":true,"username":"admin"}

# 3. Public: read site settings (no cookie needed)
curl -s http://localhost:3000/api/settings

# 4. Admin: list enquiries, filtered
curl -s -b cookies.txt 'http://localhost:3000/api/enquiries?status=new&search=ashworth'

# 5. Public: submit an enquiry with an attachment (multipart)
curl -s -X POST http://localhost:3000/api/enquiries \
  -F 'name=Jane Doe' -F 'email=jane@example.com' \
  -F 'message=Please quote for MEP design.' \
  -F 'attachments=@/path/to/brief.pdf'
# → {"ok":true}

# 6. Admin: mark an enquiry replied
curl -s -b cookies.txt -X PATCH http://localhost:3000/api/enquiries/<id> \
  -H 'Content-Type: application/json' -d '{"status":"replied"}'

# 7. Admin: create a project
curl -s -b cookies.txt -X POST http://localhost:3000/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"title":"Ashworth Science Campus","disciplines":["ELE","MEC"],"published":true}'
```

---

## 14. Common dev tasks

```bash
# Run the app locally (serves pages + API on :3000)
npm run dev

# Apply a schema change in development
#   1. edit prisma/schema.prisma, then:
npx prisma migrate dev --name <change_name>
npx prisma generate          # usually automatic

# Inspect the database visually
npx prisma studio

# Re-seed (idempotent)
npx prisma db seed

# Type-check
npx tsc --noEmit
```

**Adding a model/field** — the end-to-end pattern:

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name add_x` (generates the migration + client).
3. If it's a status/enum-like string, add the `const` tuple + type guard in the
   matching `lib/*` file.
4. Add/extend the DTO type in that `lib/*` file.
5. Read/write it in the route handler — keep validation in `lib/`, handler thin.

---

## 15. Gotchas & design decisions worth knowing

- **Prisma stays at v6** on purpose (v7 needs driver adapters and drops the
  `url` datasource field). Don't `npm update` past 6 without porting the config.
- **SQLite has no `enum`** and limited case-insensitive search. Statuses are
  validated in code; enquiry search uses Prisma `contains` (no `mode:
  'insensitive'`, which SQLite doesn't support the same way).
- **The httpOnly cookie can't be read by JS** — that's why the client guard
  calls `/api/auth/me`. Don't make the cookie readable; the server `verifyAuth()`
  is the real protection anyway.
- **Email must never block a save.** Keep `sendEnquiryAlert` non-throwing and
  *after* the DB write.
- **Enquiry attachments are private; project images are public.** Put new
  uploads in the right zone (`uploads/` vs `public/uploads/`).
- **`deploy.sh` must stay non-destructive.** Never add `migrate reset` or a
  data-reseed — that would delete real enquiries.
- **`verifyAuth()` is the first line of every admin route.** When you add a
  route, copy the `try { await verifyAuth() } catch { return 401 }` guard.
- Admin chrome (header/footer) is hidden on `/admin` routes by a `SiteChrome`
  wrapper so the public layout doesn't bleed into the dashboard.

---

*Backend documentation generated 2026-06-17. Every code block is taken from the
source in `app/api/`, `lib/`, `prisma/`, and `deploy.sh` (lightly trimmed for
length, with elisions marked `…`). Source of truth is always the code — if this
drifts, trust the files it links to.*
