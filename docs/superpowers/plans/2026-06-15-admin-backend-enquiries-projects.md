# MEPM Admin Backend Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Prisma+SQLite backend and a MEPM-themed password-protected admin for contact enquiries (with status workflow, email alerts, downloadable attachments) and projects (drawing-sheet CRUD + public pages).

**Architecture:** Next.js App Router route handlers over Prisma/SQLite. Auth via `bcryptjs` + `jose` JWT in an httpOnly cookie, client route guards plus server-side `verifyAuth()` on every admin API. Files: private enquiry attachments streamed via authed route; public project images under `public/uploads`. Deploy as PM2 Node process, non-destructive migrations.

**Tech Stack:** Next.js 16, Prisma, SQLite, bcryptjs, jose, nodemailer, Tailwind v4 (MEPM tokens).

**Verification model:** No unit-test runner in this repo. Each task is verified with `npx tsc --noEmit`, `npx next build`, and browser-preview checks — the project's actual practice. Commit after each task.

**Spec:** `docs/superpowers/specs/2026-06-15-admin-backend-enquiries-projects-design.md`

---

## File structure

```
prisma/
  schema.prisma                      # models: Enquiry, Attachment, Project, ProjectImage, AdminUser
  seed.ts                            # idempotent admin user upsert
lib/
  db.ts                              # PrismaClient singleton
  auth.ts                            # hashPassword, verifyPassword, signToken, verifyToken, verifyAuth(req)
  uploads.ts                         # saveUpload(file, destDir), deleteUpload(path), validateFiles()
  enquiries.ts                       # status constants + helpers
  projects.ts                        # disciplines/status constants, slugify, project query helpers
app/api/
  auth/login/route.ts                # POST
  auth/logout/route.ts               # POST
  enquiries/route.ts                 # POST (public), GET (admin)
  enquiries/[id]/route.ts            # PATCH, DELETE (admin)
  enquiries/[id]/attachments/[attId]/route.ts  # GET (admin, stream)
  projects/route.ts                  # GET (public/admin), POST (admin)
  projects/[id]/route.ts             # PATCH, DELETE (admin)
  projects/[id]/images/route.ts      # POST (admin)
  projects/[id]/images/[imgId]/route.ts        # DELETE (admin)
app/admin/
  layout.tsx                         # admin shell (nav, logout) — NOT auth-gated at layout
  AdminGuard.tsx                     # client guard component
  login/page.tsx                     # public login form
  page.tsx                           # redirect -> /admin/enquiries
  enquiries/page.tsx                 # list (client, fetches GET)
  enquiries/[id]/page.tsx            # detail (client)
  projects/page.tsx                  # list
  projects/new/page.tsx              # create form
  projects/[id]/edit/page.tsx        # edit form
  ProjectForm.tsx                    # shared create/edit form (client)
  ui/                                # StatusBadge, AdminTable bits as needed
app/projects/
  page.tsx                           # public register-table index
  [slug]/page.tsx                    # public drawing-sheet detail
app/components/sections/
  LatestProjects.tsx                 # homepage featured-projects section
deploy.sh                            # VPS deploy script
.env.local                           # local env (gitignored)
.env.example                         # template (committed)
```

---

## Phase 1 — Foundation

### Task 1: Install dependencies

- [ ] Install runtime + dev deps

```bash
cd "/Users/harleywilliams/websites/MEPM Website/mepm-website"
npm install @prisma/client bcryptjs jose nodemailer
npm install -D prisma @types/bcryptjs @types/nodemailer
```

- [ ] Verify: `npx prisma --version` prints a version. Commit:

```bash
git add package.json package-lock.json && git commit -m "build: add prisma, auth and email deps"
```

### Task 2: Prisma schema + client singleton

**Files:** Create `prisma/schema.prisma`, `lib/db.ts`. Modify `.gitignore`.

- [ ] `prisma/schema.prisma` — datasource sqlite, generator client, and the five models exactly as in the spec's Data Model section (Enquiry, Attachment, Project, ProjectImage, AdminUser).
- [ ] `lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] Append to `.gitignore`:

```
# Backend
/prisma/dev.db
/prisma/dev.db-journal
/uploads
/public/uploads
.env.local
```

- [ ] Add `.env.local` (gitignored) and committed `.env.example` with the spec's env vars. Set `DATABASE_URL="file:./dev.db"`, a dev `JWT_SECRET`, `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD=<dev pw>`, empty SMTP, `ENQUIRY_NOTIFY_TO=info@mepmservices.co.uk`.
- [ ] Run: `npx prisma migrate dev --name init`. Expected: creates `prisma/migrations/*/migration.sql` and `prisma/dev.db`.
- [ ] Verify: `npx prisma studio` opens (optional) or `npx tsc --noEmit` passes. Commit (schema + migration + lib/db + gitignore + env.example).

### Task 3: Auth library

**Files:** Create `lib/auth.ts`.

- [ ] Implement:

```ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
export const COOKIE = 'auth-token';

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function signToken(username: string) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
}

/** Throws if the request has no valid auth cookie. Use in admin API routes. */
export async function verifyAuth() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) throw new Error('unauthorized');
  return verifyToken(token);
}
```

- [ ] Verify `npx tsc --noEmit`. Commit.

### Task 4: Seed script (admin user)

**Files:** Create `prisma/seed.ts`. Modify `package.json` (add `prisma.seed`).

- [ ] `prisma/seed.ts`: upsert AdminUser by username from env, hashing `ADMIN_PASSWORD`. Idempotent.
- [ ] `package.json`: add `"prisma": { "seed": "tsx prisma/seed.ts" }` and install `tsx` as dev dep (`npm i -D tsx`).
- [ ] Run: `npx prisma db seed`. Expected: "Seeded admin user: admin". Re-run → no duplicate.
- [ ] Verify in `npx prisma studio` (AdminUser has one row) or query. Commit.

### Task 5: Upload + email helpers

**Files:** Create `lib/uploads.ts`, `lib/email.ts`.

- [ ] `lib/uploads.ts`: `validateFiles(files, {maxFiles,maxSizeMB,allowed})`, `saveUpload(file, absDir)` (writes buffer, returns {storedPath, filename, mimeType, size}), `deleteUpload(storedPath)`. Use `node:fs/promises` + `node:path` + `crypto.randomUUID()` for unique names.
- [ ] `lib/email.ts`: `sendEnquiryAlert(enquiry, filenames[])` using nodemailer SMTP transport from env; wrapped so the caller can ignore failures. No-op (log only) when SMTP_HOST is empty.
- [ ] Verify `npx tsc --noEmit`. Commit.

### Task 6: Auth API routes + admin shell + login + guard

**Files:** Create `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/admin/layout.tsx`, `app/admin/AdminGuard.tsx`, `app/admin/login/page.tsx`, `app/admin/page.tsx`.

- [ ] `POST /api/auth/login`: parse {username,password}, look up AdminUser, `verifyPassword`, on success `signToken` + set httpOnly cookie (`secure` in prod, `sameSite:'lax'`, 7d), return `{ok:true}`; 401 otherwise.
- [ ] `POST /api/auth/logout`: clear cookie.
- [ ] `app/admin/login/page.tsx`: MEPM-themed client form (bp-grid panel, Archivo heading, navy/green), POSTs to login, redirects to `/admin/enquiries`.
- [ ] `app/admin/AdminGuard.tsx`: client component, `useEffect` checks `document.cookie` for `auth-token`; if missing `router.replace('/admin/login')`; renders children once present.
- [ ] `app/admin/layout.tsx`: shell with MEPM logo, nav (Enquiries, Projects), logout button (POST logout → redirect login). Wraps non-login admin content in `AdminGuard` (login page opts out by being its own route that the guard ignores).
- [ ] `app/admin/page.tsx`: redirect to `/admin/enquiries`.
- [ ] Verify: `npx next build` passes; preview `/admin/login` loads (watch for the `/admin` redirect-loop bug — if it loops on 16.2.7, add a `/login` route rendering the same page and point redirects there). Log in, confirm cookie set, confirm `/admin` redirects to enquiries. Commit.

---

## Phase 2 — Enquiries

### Task 7: Enquiry create API (public) + email + attachments

**Files:** Create `app/api/enquiries/route.ts`, `lib/enquiries.ts`.

- [ ] `lib/enquiries.ts`: `STATUSES = ['new','read','replied','archived'] as const`, label helper.
- [ ] `POST /api/enquiries`: read `multipart/form-data`; validate text fields (name, email, message required); `validateFiles` the attachments; create `Enquiry`; for each file `saveUpload` to `uploads/enquiries/<id>/` and create `Attachment`; call `sendEnquiryAlert` in try/catch (never fail the request on email error); return `{ok:true}`. Roll back the Enquiry row if a file write throws.
- [ ] `GET /api/enquiries`: `await verifyAuth()` (401 on throw); read `?search=&status=`; return enquiries (with attachments) filtered + ordered `createdAt desc`.
- [ ] Verify `npx tsc --noEmit` + `next build`. Commit.

### Task 8: Wire ContactForm to the API

**Files:** Modify `app/contact/ContactForm.tsx`.

- [ ] Replace the `console.log` submit with a real `FormData` POST to `/api/enquiries` (append text fields + `service` + each file under `attachments`). Keep validation/success state. On non-ok response show a retry message and keep entered values; disable submit while sending.
- [ ] Verify in preview: submit the form with a file → success state; confirm a row appears via `npx prisma studio`. Commit.

### Task 9: Admin enquiries list

**Files:** Create `app/admin/enquiries/page.tsx`, `app/admin/ui/StatusBadge.tsx`.

- [ ] `StatusBadge`: maps status→MEPM colors (new=green, read=slate, replied=navy, archived=muted).
- [ ] `app/admin/enquiries/page.tsx`: client component; fetch `GET /api/enquiries` with search + status filter; table (Name, Service, StatusBadge, Date, View link); search box + status tabs; unread (`new`) count in header. Empty state.
- [ ] Verify in preview (logged in): submitted enquiry shows in the table. Commit.

### Task 10: Admin enquiry detail + status + delete + attachment download

**Files:** Create `app/admin/enquiries/[id]/page.tsx`, `app/api/enquiries/[id]/route.ts`, `app/api/enquiries/[id]/attachments/[attId]/route.ts`.

- [ ] `PATCH /api/enquiries/[id]`: `verifyAuth`; update `status` (validate against STATUSES).
- [ ] `DELETE /api/enquiries/[id]`: `verifyAuth`; delete attachments' files via `deleteUpload`, then delete the Enquiry (cascade rows).
- [ ] `GET /api/enquiries/[id]/attachments/[attId]`: `verifyAuth`; stream the file from disk with correct `Content-Type` + `Content-Disposition: attachment`.
- [ ] `app/admin/enquiries/[id]/page.tsx`: client; fetch one enquiry (add a GET-by-id or reuse list); show all fields + message + attachment download links; status `<select>` → PATCH; delete button (confirm) → DELETE → back to list; on open, if status `new`, PATCH to `read`.
- [ ] Verify in preview: open enquiry (flips to read), change status, download attachment, delete. Commit.

---

## Phase 3 — Projects

### Task 11: Projects helpers + API (list/create)

**Files:** Create `lib/projects.ts`, `app/api/projects/route.ts`.

- [ ] `lib/projects.ts`: `DISCIPLINES=['ELE','MEC','ENV']`, `PROJECT_STATUSES=['planned','in_progress','complete']`, `slugify(title)`, `disciplinesToArray/fromArray`.
- [ ] `GET /api/projects`: if authed and `?admin=1` return all; else return `published:true` ordered by `order,createdAt`. Include images.
- [ ] `POST /api/projects`: `verifyAuth`; create Project from JSON (auto-slug, ensure unique by suffixing). Return the project.
- [ ] Verify `tsc` + `build`. Commit.

### Task 12: Project update/delete + image upload/delete API

**Files:** Create `app/api/projects/[id]/route.ts`, `app/api/projects/[id]/images/route.ts`, `app/api/projects/[id]/images/[imgId]/route.ts`.

- [ ] `PATCH /api/projects/[id]`: `verifyAuth`; update fields (incl. published/featured/order/disciplines CSV).
- [ ] `DELETE /api/projects/[id]`: `verifyAuth`; delete image files under `public/uploads/projects/<id>/`, then the Project.
- [ ] `POST /api/projects/[id]/images`: `verifyAuth`; multipart; validate (images+pdf, ≤10MB); save to `public/uploads/projects/<id>/`; create ProjectImage rows (first image `isCover` if none yet).
- [ ] `DELETE /api/projects/[id]/images/[imgId]`: `verifyAuth`; delete file + row.
- [ ] Verify `tsc` + `build`. Commit.

### Task 13: Admin projects list + shared form

**Files:** Create `app/admin/projects/page.tsx`, `app/admin/projects/new/page.tsx`, `app/admin/projects/[id]/edit/page.tsx`, `app/admin/ProjectForm.tsx`.

- [ ] `app/admin/projects/page.tsx`: client; fetch `GET /api/projects?admin=1`; table (Title, Sector, StatusBadge, Published?, Featured?, Edit/Delete). Empty state + "New project".
- [ ] `ProjectForm.tsx`: shared create/edit; fields title/client/location/sector/disciplines(chips)/status/year/summary/detail/featured/published; on save POST or PATCH. In edit mode, the image manager reuses `FileDropzone` to POST to the images endpoint, lists existing images with caption + cover pick + delete + reorder.
- [ ] new/edit pages render `ProjectForm`.
- [ ] Verify in preview: create a project, add images, set cover, publish. Commit.

### Task 14: Public projects index + detail

**Files:** Create `app/projects/page.tsx`, `app/projects/[slug]/page.tsx`.

- [ ] `app/projects/page.tsx`: server component; fetch published projects via `lib/projects` (direct Prisma, not HTTP); register-table layout (`PRJ-001` refs, title, sector, discipline codes, year/status, link). Empty state. `bp-grid-light` header band matching service pages.
- [ ] `app/projects/[slug]/page.tsx`: server; `generateStaticParams` optional (dynamic is fine); fetch by slug+published else `notFound()`; drawing-sheet layout — cover image figure + gallery, title block (client/location/disciplines/status/year), summary + detail. `generateMetadata` from project.
- [ ] Verify in preview: published project shows on `/projects` and detail renders; unpublished 404s. Commit.

### Task 15: Homepage Latest Projects + button wiring

**Files:** Create `app/components/sections/LatestProjects.tsx`. Modify `app/components/sections/index.ts`, `app/page.tsx`, and the hero ("View our work" → `/projects`).

- [ ] `LatestProjects.tsx`: server component; fetch featured+published (limit 3); 3-up drawing-sheet cards linking to detail; "All projects" → `/projects`. Render nothing if none.
- [ ] Export it; insert into `app/page.tsx` after ProcessTimeline (or before CTA). Point the hero secondary button + any "View our work" to `/projects`.
- [ ] Verify in preview: featured project appears on homepage; section hidden when none. Commit.

---

## Phase 4 — Deploy

### Task 16: deploy.sh + docs

**Files:** Create `deploy.sh`. Modify `README` or add `docs/DEPLOY.md`.

- [ ] `deploy.sh` (non-destructive): `git pull` → `npm ci` → `npx prisma migrate deploy` → `npx prisma db seed` → `npm run build` → `pm2 restart mepm-website || pm2 start npm --name mepm-website -- start`. Must NOT reset the DB or wipe `uploads/` / `public/uploads/`.
- [ ] `docs/DEPLOY.md`: VPS prerequisites (Node 18+, PM2, nginx proxy to :3000), env vars to set in production `.env.local` (real SMTP + strong JWT_SECRET + ADMIN_PASSWORD), first-run steps, and the rule that `uploads/`, `public/uploads/`, `prisma/dev.db` persist across deploys.
- [ ] Verify `bash -n deploy.sh` (syntax). Commit.

---

## Self-review notes

- **Spec coverage:** enquiries (7–10), attachments private download (10), email (5,7), status workflow (9,10), projects model+CRUD (11–13), public pages (14), homepage section (15), MEPM-themed admin (6,9,13), auth (3,6) + server enforcement (every admin route), non-destructive deploy (16). All spec sections map to a task.
- **Type consistency:** `verifyAuth()` (3) used by all admin routes; `STATUSES` (7) used by 9/10; `DISCIPLINES/PROJECT_STATUSES/slugify` (11) used by 12/13/14; `saveUpload/deleteUpload/validateFiles` (5) used by 7/10/12.
- **No test runner:** verification is `tsc --noEmit` + `next build` + preview, per repo practice. If desired later, a vitest harness for the `lib/` helpers is a clean follow-up (out of scope here).
- **Risk:** the `/admin` Next redirect-loop bug (NTS hit it on 16.2.4). Task 6 verifies on 16.2.7 and has the `/login` fallback ready.
