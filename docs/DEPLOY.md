# Deploying the MEPM website

The site is a Next.js app with a Prisma/SQLite backend. It runs as a long-lived
Node process (it is **not** a static export — it serves API routes, the admin,
and runtime-uploaded files), managed by PM2 behind nginx. This mirrors the NTS
deployment.

## Server prerequisites (one-time)

- **Node 18+** and **npm**
- **PM2**: `npm install -g pm2`
- **nginx** reverse-proxying your domain to the app's port (default 3000)
- The repo cloned on the server, e.g. `/var/www/mepm` or `/root/mepm-website`

## Environment

Create `.env` in the repo root on the server (it is gitignored — never commit
it). Use strong production values:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="<long random string, 32+ chars>"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<strong password>"

# SMTP for enquiry alerts — leave SMTP_HOST empty to disable email
SMTP_HOST="mail.mepmservices.co.uk"
SMTP_PORT="587"
SMTP_USER="info@mepmservices.co.uk"
SMTP_PASS="<mailbox password>"
ENQUIRY_NOTIFY_TO="info@mepmservices.co.uk"
```

Changing `ADMIN_PASSWORD` and re-running the deploy updates the admin login
(the seed re-hashes it).

## First deploy

```bash
cd /path/to/mepm-website
npm ci
npx prisma migrate deploy
npx prisma db seed          # creates the admin user
npm run build
pm2 start npm --name mepm-website -- start
pm2 save
```

Point nginx at `http://localhost:3000` (or whatever `PORT` you set).

## Subsequent deploys

From the server, in the repo root:

```bash
bash deploy.sh
```

`deploy.sh` pulls, installs, runs **`prisma migrate deploy`** (applies new
migrations without dropping data), re-seeds the admin user (idempotent),
builds, and restarts PM2.

## Data that must persist (do not delete)

These live on the server's disk and hold real data. The deploy never touches
them; keep them out of any cleanup and include them in backups:

- `prisma/dev.db` — all enquiries and projects
- `uploads/enquiries/` — private enquiry attachments
- `public/uploads/projects/` — project drawings/photos

> ⚠️ Unlike the NTS deploy script (which reset its database on every run to
> reseed sample content), this script must **never** reset the DB — doing so
> would wipe real customer enquiries. Use `prisma migrate deploy`, never
> `prisma migrate reset` or `db push --force-reset`, in production.

## Admin access

- Login: `https://<domain>/admin/login`
- Username/password from `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)
- Enquiries: `/admin/enquiries` · Projects: `/admin/projects`

## Useful commands

```bash
pm2 status
pm2 logs mepm-website
pm2 restart mepm-website
npx prisma migrate status
```
