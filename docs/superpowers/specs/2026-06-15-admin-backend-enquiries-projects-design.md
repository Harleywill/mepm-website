# MEPM Admin Backend — Enquiries & Projects

**Date:** 2026-06-15
**Status:** Approved design, ready for implementation plan
**Author:** Claude (with Harley)

## Summary

Add a server backend and a password-protected admin area to the MEPM
marketing site. It does two things:

1. **Enquiries** — persist contact-form submissions, email an alert on each
   one, and let an admin review them with a New → Read → Replied → Archived
   status workflow. Form attachments (drawings/photos) are stored and
   downloadable from the admin.
2. **Projects** — an admin CRUD for engineering projects (drawing-sheet
   shape: client, location, sector, disciplines, status, drawings) that
   publishes to public `/projects` index and detail pages.

The stack mirrors the NTS site (the user's other project), which already runs
this pattern in production: Prisma + SQLite, Next.js API route handlers,
`bcryptjs` + `jose` auth in a cookie, `nodemailer` for email, deployed as a
PM2 Node process on a Hostinger-style VPS. The one deliberate divergence: the
admin UI uses **MEPM's own design system**, not NTS's palette.

## Goals / non-goals

**Goals**
- Capture every contact submission in a database; never lose one.
- Email a notification per submission to the practice inbox.
- Admin can triage enquiries by status and download attachments.
- Admin can create/edit/delete projects with drawings, and publish them.
- Public projects index + detail pages in the site's drawing-sheet language.
- Admin UI is visually part of the MEPM site (navy/green/slate, Archivo + IBM
  Plex, drawing-sheet cards), behind a login.

**Non-goals (YAGNI for this build)**
- Multi-user admin, roles, password reset, self-service signup.
- Replying to enquiries from the dashboard (admin emails/calls directly).
- A separate "site settings" editor (NTS has one; not needed here).
- Analytics, rate-limit dashboards, audit logs.
- Rich-text editing for project detail (plain multiline text + paragraphs).

## Stack

- **Persistence:** Prisma ORM + SQLite at `prisma/dev.db`.
- **API:** Next.js App Router route handlers (`app/api/**`). The project has
  no `output: export`, so server routes and runtime file serving work.
- **Auth:** `bcryptjs` (password hashing, 10 rounds) + `jose` (JWT), token in
  an httpOnly `auth-token` cookie, 7-day expiry.
- **Email:** `nodemailer` over SMTP using the `mepmservices.co.uk` mailbox.
  (Resend is a viable drop-in if SMTP credentials are unavailable; SMTP is the
  default to keep mail on the practice's own domain.)
- **Hosting:** Node process under PM2 on a Hostinger-style VPS, behind nginx,
  Node 18+. Deployed via a `deploy.sh` mirroring NTS.
- **New dependencies:** `prisma`, `@prisma/client`, `bcryptjs`, `jose`,
  `nodemailer`, plus `@types/bcryptjs` and `@types/nodemailer` (dev).

Note: MEPM uses `app/` at the repo root (not NTS's `src/app/`) and Tailwind
CSS v4 with tokens in `app/globals.css`. All new code follows MEPM's existing
structure and tokens.

## Data model (Prisma)

```prisma
model Enquiry {
  id           String       @id @default(cuid())
  name         String
  email        String
  phone        String?
  organisation String?
  service      String?      // e.g. "Full M&E"
  message      String
  status       String       @default("new") // new | read | replied | archived
  createdAt    DateTime     @default(now())
  attachments  Attachment[]
}

model Attachment {
  id         String  @id @default(cuid())
  enquiryId  String
  enquiry    Enquiry @relation(fields: [enquiryId], references: [id], onDelete: Cascade)
  filename   String  // original name shown to admin
  storedPath String  // path on disk under uploads/enquiries/
  mimeType   String
  size       Int
}

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
  featured    Boolean        @default(false) // homepage Latest Projects
  published   Boolean        @default(false) // draft vs live
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
  storedPath String  // path under public/uploads/projects/
  mimeType   String
  size       Int
  caption    String?
  isCover    Boolean @default(false)
  order      Int     @default(0)
}

model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

`status` and `disciplines` are validated strings (SQLite has no enums).
`disciplines` is a CSV of the codes `ELE`, `MEC`, `ENV`.

## File storage

Two destinations, one upload helper:

- **Enquiry attachments — private.** Saved under `uploads/enquiries/<enquiryId>/`
  (outside `public/`). Served only through an auth-checked streaming route. A
  visitor cannot guess a URL to someone else's uploaded drawing.
- **Project images — public.** Saved under `public/uploads/projects/<projectId>/`
  and served directly by Next at `/uploads/projects/...`. Published project
  drawings are meant to be public.

Both `uploads/` and `public/uploads/` and `prisma/dev.db` are gitignored;
directories are created on demand at write time.

Server-side validation re-checks the client limits: ≤ 6 files per enquiry,
≤ 10 MB each, allowed types (images, PDF, Office, CAD `.dwg/.dxf/.rvt`).
Project images: images + PDF, same size cap.

## Public flows

### Contact form → enquiry
- `app/contact/ContactForm.tsx` switches from `console.log` to a
  `multipart/form-data` POST to `POST /api/enquiries`.
- Keeps current client-side validation and the success state; on a network/500
  error it shows a friendly retry message and preserves entered values.

### Projects pages (drawing-sheet language)
- `/projects` — register-table index of **published** projects: `PRJ-001`
  style sheet refs, title, sector, discipline codes, year/status; links to
  detail. Empty state when none published.
- `/projects/[slug]` — drawing sheet: cover image as the figure + gallery,
  a title block (client, location, services/disciplines, status, year), then
  summary and detail. `notFound()` for unpublished/missing slugs.
- Homepage gains a **Latest Projects** section showing featured published
  projects; hidden entirely when there are none. The hero "View our work"
  button and the section's "All projects" button link to `/projects`.

## Admin area

Routes under `/admin/*`, MEPM-themed. Client-side route guard (`useEffect`
checks the cookie, redirects to login) for UX; the real enforcement is
server-side in every admin API route. This mirrors NTS, which adopted
client-side guards after a Next.js middleware/`/admin` redirect-loop bug.

- `/admin/login` — public form → `POST /api/auth/login` → sets cookie →
  redirect to `/admin/enquiries`. `bp-grid`-accented panel.
- `/admin` — redirects to `/admin/enquiries`.
- Shared admin shell: top nav (Enquiries · Projects), logout button, MEPM logo.

### Enquiries
- `/admin/enquiries` — table: Name, Service, **status badge**, Date, View.
  Search box (name/email/message) + status filter tabs; unread count in header.
- `/admin/enquiries/[id]` — full detail: every field, the message,
  **attachments with download links**, a status control (New/Read/Replied/
  Archived), and delete (with confirm). Opening a `new` enquiry flips it to
  `read`.

### Projects
- `/admin/projects` — table: Title, Sector, status badge, Published?, Featured?,
  edit/delete.
- `/admin/projects/new` and `/admin/projects/[id]/edit` — one shared form:
  title (auto-slug from title, editable), client, location, sector,
  disciplines (ELE/MEC/ENV chips), status, year, summary, detail, `featured`
  and `published` toggles, and a drawings/photos uploader (reuses
  `FileDropzone`) with per-image caption and a "cover" selector and ordering.

## API routes

All admin routes call a shared `verifyAuth()` that validates the JWT cookie
and returns 401 on failure.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/enquiries` | public | Create enquiry (+ files + email) |
| GET | `/api/enquiries?search=&status=` | admin | List enquiries |
| PATCH | `/api/enquiries/[id]` | admin | Update status |
| DELETE | `/api/enquiries/[id]` | admin | Delete enquiry + files |
| GET | `/api/enquiries/[id]/attachments/[attId]` | admin | Stream attachment download |
| GET | `/api/projects` | public/admin | List (public = published only) |
| POST | `/api/projects` | admin | Create project |
| PATCH | `/api/projects/[id]` | admin | Update project |
| DELETE | `/api/projects/[id]` | admin | Delete project + images |
| POST | `/api/projects/[id]/images` | admin | Upload project images |
| DELETE | `/api/projects/[id]/images/[imgId]` | admin | Remove an image |
| POST | `/api/auth/login` | public | Validate creds, set cookie |
| POST | `/api/auth/logout` | public | Clear cookie |

## Auth detail

- `AdminUser` seeded from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env on
  `prisma db seed`; idempotent (upsert by username, re-hash password).
- Login: look up user, `bcrypt.compare`, on success sign a `jose` JWT
  (`{ sub: username }`, 7-day exp) with `JWT_SECRET`, set httpOnly + secure +
  sameSite=lax cookie `auth-token`.
- `verifyAuth(req)` helper: read cookie, `jwtVerify`, return payload or throw →
  401. Used by all admin API routes. Client guards are UX only.
- Logout clears the cookie.

## Email

On `POST /api/enquiries`, after the DB write succeeds, send a notification via
`nodemailer` SMTP transport to `ENQUIRY_NOTIFY_TO`. The email includes the
submitter's details, the message, the chosen service, and a list of attached
filenames. **Email failure is caught and logged but does not fail the
request** — the enquiry is already saved (NTS's graceful pattern).

## Environment variables

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=<random 32+ chars>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<chosen password>
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ENQUIRY_NOTIFY_TO=info@mepmservices.co.uk
```

## Deployment (mirrors NTS)

`deploy.sh` run on the VPS:
1. `git pull` (main)
2. `npm ci`
3. `npx prisma migrate deploy`
4. `npx prisma db seed` (idempotent admin user)
5. `npm run build`
6. `pm2 restart mepm-website` (or start on first run)

PM2 process `mepm-website`, Node 18+, behind nginx. The VPS host/path are
MEPM-specific and supplied at deploy time (the vault's `72.62.6.180` is NTS's;
do not reuse). `uploads/`, `public/uploads/`, and `prisma/dev.db` persist on
the server's disk across deploys — the deploy must not wipe them.

## Error handling

- Public `POST /api/enquiries`: 400 with field errors on validation failure;
  500 on server error → form shows a retry message, keeps values.
- Admin API: 401 (unauthed), 404 (missing id), 400 (bad input), 500 (server).
- File writes are wrapped so a partial failure rolls back the DB row.
- Email send wrapped in try/catch; never blocks the enquiry save.

## Design / styling

The admin uses MEPM's existing tokens from `app/globals.css`: Archivo
(`font-display`) headings, IBM Plex Sans/Mono body and labels, the navy /
green / slate scales, `mepm-spec` mono labels, drawing-sheet bordered cards,
and a `bp-grid` accent on the login. Status badges: `new` green, `read` slate,
`replied` navy, `archived` muted. No NTS palette anywhere.

## Implementation phasing

The plan should land in reviewable phases:

1. **Foundation** — add deps; Prisma schema + first migration + seed; gitignore;
   `lib/db.ts`, `lib/auth.ts` (sign/verify + `verifyAuth`), upload helper;
   `/api/auth/login` + `/api/auth/logout`; admin shell + login page + client
   guard. Verify login works (watch for the `/admin` redirect-loop bug; fall
   back to a `/login` route if it recurs on Next 16.2.7).
2. **Enquiries** — `POST /api/enquiries` (+files +email); wire `ContactForm` to
   it; admin enquiries list + detail + status + delete + attachment download.
3. **Projects** — project API + admin list/new/edit + image upload; public
   `/projects` index + `/projects/[slug]`; homepage Latest Projects section;
   wire hero/section buttons.

## Open items

- **SMTP credentials** for the `mepmservices.co.uk` mailbox (host/port/user/
  pass) needed before email works in production; until then the save + admin
  still function and email errors are logged.
- **MEPM VPS** host/path/SSH for the first deploy.
- Confirm the `/admin/login` route loads cleanly on Next 16.2.7 during phase 1.
