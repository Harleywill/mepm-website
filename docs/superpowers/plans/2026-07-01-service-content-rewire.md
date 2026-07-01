# Service Content Rewire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin "Services" tab actually control the live mepm.co.uk site, instead of editing database rows that nothing public reads.

**Architecture:** Expand the Prisma `Service` model to hold every field the public `/services` and `/services/[slug]` pages currently render from a hardcoded TypeScript file (`lib/services.ts`), add a new `ServiceOffering` model for the "how we deliver it" content block (also currently hardcoded), migrate the existing static content into the database via the seed script, then repoint every public page and the admin CRUD screens at the database. `lib/services.ts` stops being a data source and becomes a thin data-access + validation layer over Prisma.

**Tech Stack:** Next.js 16 (App Router, async Server Components), Prisma 6 + SQLite, no test runner in this repo — verification is via `tsc --noEmit`, `sqlite3` queries against `prisma/dev.db`, and manual browser checks (no unit tests exist elsewhere in this codebase, so this plan doesn't invent a parallel test suite for one feature).

**Note on file paths:** the project root is `/Users/harleywilliams/websites/MEPM website/mepm-website/` — every path below is relative to that root unless given in full.

---

## Current State (context for every task below)

- `prisma/schema.prisma` has a `Service` model: `id, code, title, desc, points (JSON string), statValue, statLabel, order, createdAt, updatedAt`. Nothing public reads it.
- `lib/services.ts` exports a **hardcoded array** `services: Service[]` (slug, name, navLabel, code, shortDescription, keywords, intro, scope[{title,description}], deliverables[], sustainability, relatedSlugs) and a hardcoded object `serviceOfferings` (6 entries: consulting, design-review, decarbonisation, value-engineering, project-support, commissioning — each with name, shortDescription, description, keywords). This is what the real site renders.
- Public consumers of the static data: `app/components/sections/ServicesOverview.tsx`, `app/services/page.tsx`, `app/services/[slug]/page.tsx`.
- `app/admin/services/page.tsx` inline-edits only `title`/`desc` of the DB `Service` rows. The "Add service" button links to `/admin/services/new`, which **does not exist** (404 today).
- `app/api/services/route.ts` and `app/api/services/[id]/route.ts` are DB CRUD for the current (incomplete) `Service` model.
- `app/admin/preview/page.tsx` and `app/api/export/route.ts` also reference the current DB field names (`title`, `desc`).
- Existing DB rows (`prisma/dev.db`) hold 3 placeholder `Service` rows with different copy than the live static content — these get replaced by the seed script in Task 3, not hand-edited.

---

## Task 1: Expand the Prisma schema

**Files:**
- Modify: `prisma/schema.prisma:111-122` (the `Service` model)

- [ ] **Step 1: Replace the `Service` model and add `ServiceOffering`**

Open `prisma/schema.prisma`, find the existing block:

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

Replace it with:

```prisma
model Service {
  id               String   @id @default(cuid())
  slug             String   @unique // electrical | mechanical | environmental
  code             String   @unique // ELE | MEC | ENV
  name             String
  navLabel         String
  shortDescription String
  intro            String
  keywords         String   @default("[]") // JSON array of strings
  scope            String   @default("[]") // JSON array of {title, description}
  deliverables     String   @default("[]") // JSON array of strings
  sustainability   String   @default("")
  relatedSlugs     String   @default("[]") // JSON array of service slugs
  statValue        String   @default("")
  statLabel        String   @default("")
  order            Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model ServiceOffering {
  id               String   @id @default(cuid())
  slug             String   @unique
  name             String
  shortDescription String
  description      String
  keywords         String   @default("[]") // JSON array of strings
  order            Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

- [ ] **Step 2: Generate and apply the migration**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && npx prisma migrate dev --name expand_service_content
```
Expected: Prisma reports a new migration folder under `prisma/migrations/`, applies it to `prisma/dev.db`, and regenerates the Prisma client with no errors. Since `title`/`desc`/`points` are being replaced by required non-null columns (`name`, `shortDescription`, `slug`, `intro`) with no default, Prisma will prompt about data loss on the 3 existing placeholder rows — accept it (type `y`), since Task 3 immediately reseeds those rows with the real content.

- [ ] **Step 3: Verify the schema applied**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && sqlite3 prisma/dev.db ".schema Service" && sqlite3 prisma/dev.db ".schema ServiceOffering"
```
Expected: both `CREATE TABLE` statements show the new columns from Step 1.

- [ ] **Step 4: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add prisma/schema.prisma prisma/migrations && git commit -m "db: expand Service model and add ServiceOffering for full service page content"
```

---

## Task 2: Rewrite `lib/services.ts` as a data-access layer

**Files:**
- Modify: `lib/services.ts` (entire file — remove the static `services`/`serviceOfferings` data, keep/expand validation helpers, add Prisma-backed data access)

- [ ] **Step 1: Replace the file contents**

The static `services` array and `serviceOfferings` object are deleted (their content moves into `prisma/seed.ts` in Task 3). Replace the whole file with:

```ts
import { prisma } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

export interface ServiceScopeItem {
  title: string;
  description: string;
}

export interface ServiceDTO {
  id: string;
  slug: string;
  code: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  intro: string;
  keywords: string[];
  scope: ServiceScopeItem[];
  deliverables: string[];
  sustainability: string;
  relatedSlugs: string[];
  statValue: string;
  statLabel: string;
  order: number;
}

export interface ServiceOfferingDTO {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  keywords: string[];
  order: number;
}

// ============================================================================
// JSON array helpers (used for keywords / scope / deliverables / relatedSlugs)
// ============================================================================

/** Parse a JSON-stringified array from the DB. Returns [] if invalid/empty. */
export function parseJsonArray<T = string>(json: string): T[] {
  if (!json || typeof json !== 'string') return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Stringify an array (or pass through an already-stringified value) for DB storage. */
export function stringifyJsonArray<T>(value: T[] | string): string {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return JSON.stringify([]);
  return JSON.stringify(value);
}

// ============================================================================
// Service codes
// ============================================================================

export const SERVICE_CODES = ['ELE', 'MEC', 'ENV'] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export const SERVICE_CODE_LABELS: Record<ServiceCode, string> = {
  ELE: 'Electrical',
  MEC: 'Mechanical',
  ENV: 'Environmental',
};

export function isValidServiceCode(value: string): value is ServiceCode {
  return (SERVICE_CODES as readonly string[]).includes(value.toUpperCase());
}

// ============================================================================
// Row <-> DTO mapping
// ============================================================================

type ServiceRow = {
  id: string;
  slug: string;
  code: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  intro: string;
  keywords: string;
  scope: string;
  deliverables: string;
  sustainability: string;
  relatedSlugs: string;
  statValue: string;
  statLabel: string;
  order: number;
};

type ServiceOfferingRow = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  keywords: string;
  order: number;
};

function toServiceDTO(row: ServiceRow): ServiceDTO {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    navLabel: row.navLabel,
    shortDescription: row.shortDescription,
    intro: row.intro,
    keywords: parseJsonArray<string>(row.keywords),
    scope: parseJsonArray<ServiceScopeItem>(row.scope),
    deliverables: parseJsonArray<string>(row.deliverables),
    sustainability: row.sustainability,
    relatedSlugs: parseJsonArray<string>(row.relatedSlugs),
    statValue: row.statValue,
    statLabel: row.statLabel,
    order: row.order,
  };
}

function toOfferingDTO(row: ServiceOfferingRow): ServiceOfferingDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    description: row.description,
    keywords: parseJsonArray<string>(row.keywords),
    order: row.order,
  };
}

// ============================================================================
// Data access (Server Components + API routes)
// ============================================================================

export async function getServices(): Promise<ServiceDTO[]> {
  const rows = await prisma.service.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return rows.map(toServiceDTO);
}

export async function getServiceBySlug(slug: string): Promise<ServiceDTO | null> {
  const row = await prisma.service.findUnique({ where: { slug } });
  return row ? toServiceDTO(row) : null;
}

export async function getServiceOfferings(): Promise<ServiceOfferingDTO[]> {
  const rows = await prisma.serviceOffering.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return rows.map(toOfferingDTO);
}

// ============================================================================
// Validation (used by API routes)
// ============================================================================

export function validateService(data: Record<string, unknown>): string | null {
  const code = String(data.code || '').toUpperCase();
  if (!code || !isValidServiceCode(code)) {
    return `Code must be one of: ${SERVICE_CODES.join(', ')}`;
  }
  if (!String(data.slug || '').trim()) return 'Slug is required';
  if (!String(data.name || '').trim()) return 'Name is required';
  if (!String(data.navLabel || '').trim()) return 'Nav label is required';
  if (!String(data.shortDescription || '').trim()) return 'Short description is required';
  if (!String(data.intro || '').trim()) return 'Intro is required';
  return null;
}

export function validateServiceOffering(data: Record<string, unknown>): string | null {
  if (!String(data.slug || '').trim()) return 'Slug is required';
  if (!String(data.name || '').trim()) return 'Name is required';
  if (!String(data.shortDescription || '').trim()) return 'Short description is required';
  if (!String(data.description || '').trim()) return 'Description is required';
  return null;
}
```

- [ ] **Step 2: Verify no leftover references to the deleted exports**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && grep -rn "from '@/lib/services'" app | grep -v node_modules
```
Expected: this lists `app/components/sections/ServicesOverview.tsx`, `app/services/page.tsx`, `app/services/[slug]/page.tsx`, `app/api/services/route.ts`, `app/api/services/[id]/route.ts`, `app/api/export/route.ts` — all of these are fixed in later tasks in this plan. If any *other* file shows up here, open it and note it before continuing (it will break until updated).

- [ ] **Step 3: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add lib/services.ts && git commit -m "refactor: turn lib/services.ts into a Prisma-backed data-access layer"
```

---

## Task 3: Seed the database with the real content

**Files:**
- Modify: `prisma/seed.ts:63-101` (the "Seed Services" block)

- [ ] **Step 1: Replace the Service seed block**

Find the block starting `// Seed Services` (currently lines 63-101) and replace it entirely with:

```ts
  // Seed Services (disciplines)
  const services = [
    {
      slug: 'electrical',
      code: 'ELE',
      name: 'Electrical engineering',
      navLabel: 'Electrical',
      shortDescription:
        'Power, lighting and life-safety systems designed for performance, compliance and efficiency.',
      intro:
        'From initial load assessments through to detailed design, we engineer electrical systems that are safe, efficient and ready for how a building will actually be used.',
      keywords: JSON.stringify(['Power distribution', 'Lighting design', 'Fire detection', 'EV charging']),
      scope: JSON.stringify([
        { title: 'Power distribution', description: 'LV distribution, switchgear selection and load assessments sized for current demand with headroom for future change.' },
        { title: 'Lighting design', description: 'Interior, exterior and emergency lighting designed for visual comfort, energy efficiency and compliance.' },
        { title: 'Fire detection & alarms', description: 'Life-safety systems designed to the appropriate category and standard for the building and its occupants.' },
        { title: 'Small power & containment', description: 'Socket and data provision with containment routes coordinated against structure and other services.' },
        { title: 'Security & access control', description: 'CCTV, access control and intruder systems specified to suit the building and its operation.' },
        { title: 'EV charging & renewables', description: 'EV charging infrastructure and photovoltaic integration, designed with the supply capacity to back them.' },
      ]),
      deliverables: JSON.stringify([
        'Schematic and detailed design drawings',
        'Electrical load assessments',
        'Lighting calculations and layouts',
        'Specifications and equipment schedules',
        'BS 7671 design compliance',
      ]),
      sustainability:
        'Lighting and power design choices set a building\'s baseline energy use for decades. We design for low energy demand first, then integrate renewables and EV infrastructure where they genuinely pay back.',
      relatedSlugs: JSON.stringify(['mechanical', 'environmental']),
      statValue: '100+',
      statLabel: 'Projects',
      order: 0,
    },
    {
      slug: 'mechanical',
      code: 'MEC',
      name: 'Mechanical engineering',
      navLabel: 'Mechanical',
      shortDescription:
        'Heating, cooling and ventilation systems sized for comfort, air quality and running cost.',
      intro:
        'We design the systems that keep buildings comfortable and healthy: heating, cooling, ventilation and water services, sized from real calculations rather than rules of thumb.',
      keywords: JSON.stringify(['HVAC design', 'Heat pumps', 'Ventilation', 'Public health']),
      scope: JSON.stringify([
        { title: 'Heating & hot water', description: 'System design from heat loss calculations up, including heat pump and low-carbon heat source selection.' },
        { title: 'Ventilation & air quality', description: 'Natural and mechanical ventilation strategies designed for air quality, comfort and energy recovery.' },
        { title: 'Cooling & air conditioning', description: 'Cooling loads assessed honestly, with passive measures considered before plant is sized.' },
        { title: 'Public health services', description: 'Hot and cold water, above-ground drainage and sanitary systems designed for safety and reliability.' },
        { title: 'BMS & controls', description: 'Controls strategies that let well-designed plant actually deliver its designed performance in use.' },
        { title: 'Plant replacement & upgrades', description: 'Like-for-like replacement or system redesign for existing buildings, surveyed and specified properly.' },
      ]),
      deliverables: JSON.stringify([
        'Heat loss and heat gain calculations',
        'Duct and pipework sizing and layouts',
        'Plant and equipment selection',
        'Specifications and schedules',
        'Building Regulations compliance design',
      ]),
      sustainability:
        'Heating and cooling dominate most buildings\' carbon footprint. We start with fabric and demand reduction, then size low-carbon plant to the real load, not the worst-case guess.',
      relatedSlugs: JSON.stringify(['electrical', 'environmental']),
      statValue: '80+',
      statLabel: 'Designs',
      order: 1,
    },
    {
      slug: 'environmental',
      code: 'ENV',
      name: 'Environmental consulting',
      navLabel: 'Environmental',
      shortDescription:
        'Energy assessment and sustainability strategy, from concept design through to compliance.',
      intro:
        'We turn sustainability ambitions into evidenced, compliant designs: energy modelling, regulatory compliance and decarbonisation strategy grounded in how the building will perform.',
      keywords: JSON.stringify(['Energy assessments', 'Part L compliance', 'Overheating analysis', 'Net zero']),
      scope: JSON.stringify([
        { title: 'Energy assessments', description: 'SAP and SBEM calculations and EPCs for new build and existing stock, produced as design tools rather than tick-boxes.' },
        { title: 'Part L compliance', description: 'Building Regulations energy compliance addressed early, when design changes are still cheap.' },
        { title: 'Overheating analysis', description: 'TM52 and TM59 assessments to demonstrate comfort without defaulting to mechanical cooling.' },
        { title: 'BREEAM support', description: 'Credit strategy and evidence support for projects targeting BREEAM certification.' },
        { title: 'Decarbonisation strategy', description: 'Net-zero roadmaps for estates and portfolios, sequenced by cost and carbon impact.' },
        { title: 'Renewable feasibility', description: 'Honest feasibility studies for PV, heat pumps and other renewables, with payback grounded in real usage.' },
      ]),
      deliverables: JSON.stringify([
        'Energy models and compliance reports',
        'EPCs and statutory certification',
        'Overheating assessment reports',
        'Feasibility studies with costed options',
        'Decarbonisation roadmaps',
      ]),
      sustainability:
        'This discipline is sustainability as a deliverable: every output exists to lower a building\'s energy use and carbon footprint, with the evidence to prove it.',
      relatedSlugs: JSON.stringify(['electrical', 'mechanical']),
      statValue: '50+',
      statLabel: 'Assessments',
      order: 2,
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: svc,
      create: svc,
    });
  }
  console.log('Seeded 3 services');

  // Seed Service Offerings (the "how we deliver it" cross-disciplinary lines)
  const serviceOfferings = [
    {
      slug: 'consulting',
      name: 'Consulting',
      shortDescription: 'Full mechanical, electrical, and public health design services for new builds, refurbishments, and fit-outs.',
      description: 'Full mechanical, electrical, and public health design services, including HVAC, power, lighting, fire alarms, drainage, and water services. Fully coordinated designs for new builds, refurbishments, and tenant fit-outs, delivered in compliance with current building regulations, CIBSE guidance, and industry best practices.',
      keywords: JSON.stringify(['HVAC', 'Power', 'Lighting', 'Drainage', 'Water services']),
      order: 0,
    },
    {
      slug: 'design-review',
      name: 'Design Review',
      shortDescription: 'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions.',
      description: 'Integration of MEP systems with architectural and structural elements to ensure clash-free, buildable solutions. Support with BIM Level 2+ coordination using industry-standard tools. Review of third-party designs for compliance, completeness, and accuracy.',
      keywords: JSON.stringify(['BIM coordination', 'Design audit', 'Compliance review', 'Clash detection']),
      order: 1,
    },
    {
      slug: 'decarbonisation',
      name: 'Decarbonisation',
      shortDescription: 'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks.',
      description: 'Strategic planning and design for low-carbon technologies including heat pumps, PV, battery storage, and heat networks. Feasibility studies and phased transition plans for retrofitting existing assets. Support with government funding applications and carbon reporting.',
      keywords: JSON.stringify(['Heat pumps', 'PV', 'Battery storage', 'Heat networks', 'Net zero']),
      order: 2,
    },
    {
      slug: 'value-engineering',
      name: 'Value Engineering',
      shortDescription: 'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance.',
      description: 'Detailed review of MEP systems to identify cost-saving opportunities without compromising performance or compliance. Long-term OPEX and CAPEX optimisation through efficient, future-proof designs. Rationalisation of plant and distribution to reduce installation and maintenance costs.',
      keywords: JSON.stringify(['Cost optimisation', 'OPEX reduction', 'CAPEX reduction', 'Efficiency']),
      order: 3,
    },
    {
      slug: 'project-support',
      name: 'Project Support',
      shortDescription: 'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover.',
      description: 'End-to-end technical support from tender stage through design, procurement, construction, commissioning, and handover. Acting as a trusted partner to both contractors and developers, we ensure technical clarity and compliance at every phase. Responsive support for resolving on-site installation or design conflicts.',
      keywords: JSON.stringify(['Tender support', 'Procurement', 'Site support', 'Commissioning', 'Handover']),
      order: 4,
    },
    {
      slug: 'commissioning',
      name: 'Commissioning Management',
      shortDescription: 'Independent commissioning planning and witnessing services to ensure all systems operate as per design intent.',
      description: 'Independent commissioning planning and witnessing services. Management of commissioning schedules, witnessing documentation, and O&M manual review. Ensuring all systems are fully tested, balanced, and operating as per design intent before handover.',
      keywords: JSON.stringify(['Commissioning', 'System testing', 'Balancing', 'O&M manuals']),
      order: 5,
    },
  ];

  for (const offering of serviceOfferings) {
    await prisma.serviceOffering.upsert({
      where: { slug: offering.slug },
      update: offering,
      create: offering,
    });
  }
  console.log('Seeded 6 service offerings');
```

- [ ] **Step 2: Run the seed script**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && npx tsx prisma/seed.ts
```
Expected: console output includes `Seeded 3 services` and `Seeded 6 service offerings`, no errors.

- [ ] **Step 3: Verify the data landed correctly**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && sqlite3 prisma/dev.db "SELECT slug, code, name FROM Service ORDER BY [order];" && echo --- && sqlite3 prisma/dev.db "SELECT slug, name FROM ServiceOffering ORDER BY [order];"
```
Expected:
```
electrical|ELE|Electrical engineering
mechanical|MEC|Mechanical engineering
environmental|ENV|Environmental consulting
---
consulting|Consulting
design-review|Design Review
decarbonisation|Decarbonisation
value-engineering|Value Engineering
project-support|Project Support
commissioning|Commissioning Management
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add prisma/seed.ts && git commit -m "db: seed real service and service-offering content from the static file"
```

---

## Task 4: Update the public Service API routes

**Files:**
- Modify: `app/api/services/route.ts` (entire file)
- Modify: `app/api/services/[id]/route.ts` (entire file)

- [ ] **Step 1: Replace `app/api/services/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getServices, validateService, stringifyJsonArray } from '@/lib/services';
import type { Role } from '@/lib/roles';

/** Public list of all services, sorted by order. */
export async function GET(_req: Request) {
  const services = await getServices();
  return NextResponse.json({ services });
}

/** Admin: create a new service. */
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

  const body = await req.json().catch(() => ({}));

  const validationError = validateService(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const code = String(body.code || '').toUpperCase();
  const slug = String(body.slug || '').trim();

  const existingCode = await prisma.service.findUnique({ where: { code } });
  if (existingCode) {
    return NextResponse.json({ error: `Service with code "${code}" already exists` }, { status: 400 });
  }
  const existingSlug = await prisma.service.findUnique({ where: { slug } });
  if (existingSlug) {
    return NextResponse.json({ error: `Service with slug "${slug}" already exists` }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      slug,
      code,
      name: String(body.name || '').trim(),
      navLabel: String(body.navLabel || '').trim(),
      shortDescription: String(body.shortDescription || '').trim(),
      intro: String(body.intro || '').trim(),
      keywords: stringifyJsonArray(body.keywords || []),
      scope: stringifyJsonArray(body.scope || []),
      deliverables: stringifyJsonArray(body.deliverables || []),
      sustainability: String(body.sustainability || ''),
      relatedSlugs: stringifyJsonArray(body.relatedSlugs || []),
      statValue: String(body.statValue || ''),
      statLabel: String(body.statLabel || ''),
      order: Number(body.order) || 0,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}
```

- [ ] **Step 2: Replace `app/api/services/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { validateService, stringifyJsonArray, isValidServiceCode } from '@/lib/services';
import type { Role } from '@/lib/roles';

async function requireAuth() {
  return verifyAuthWithUser();
}

/** Admin: fetch one service by id. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ service });
}

/** Admin: update a service (partial updates allowed). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'edit')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};

  if ('code' in body) {
    const code = String(body.code || '').toUpperCase();
    if (!isValidServiceCode(code)) {
      return NextResponse.json({ error: 'Code must be ELE, MEC, or ENV' }, { status: 400 });
    }
    data.code = code;
  }
  if ('slug' in body) {
    const slug = String(body.slug || '').trim();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    data.slug = slug;
  }
  if ('name' in body) {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    data.name = name;
  }
  if ('navLabel' in body) data.navLabel = String(body.navLabel || '').trim();
  if ('shortDescription' in body) {
    const shortDescription = String(body.shortDescription || '').trim();
    if (!shortDescription) return NextResponse.json({ error: 'Short description is required' }, { status: 400 });
    data.shortDescription = shortDescription;
  }
  if ('intro' in body) data.intro = String(body.intro || '').trim();
  if ('keywords' in body) data.keywords = stringifyJsonArray(body.keywords || []);
  if ('scope' in body) data.scope = stringifyJsonArray(body.scope || []);
  if ('deliverables' in body) data.deliverables = stringifyJsonArray(body.deliverables || []);
  if ('sustainability' in body) data.sustainability = String(body.sustainability || '');
  if ('relatedSlugs' in body) data.relatedSlugs = stringifyJsonArray(body.relatedSlugs || []);
  if ('statValue' in body) data.statValue = String(body.statValue || '');
  if ('statLabel' in body) data.statLabel = String(body.statLabel || '');
  if ('order' in body) data.order = Number(body.order) || 0;

  if ('code' in data) {
    const existing = await prisma.service.findUnique({ where: { code: data.code as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Service with code "${data.code}" already exists` }, { status: 400 });
    }
  }
  if ('slug' in data) {
    const existing = await prisma.service.findUnique({ where: { slug: data.slug as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Service with slug "${data.slug}" already exists` }, { status: 400 });
    }
  }

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json({ service });
}

/** Admin: delete a service. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'delete')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
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

Note: these routes now return raw DTOs from `getServices()`/Prisma directly (already parsed by `toServiceDTO` in the GET-list case; the single-record GET/PATCH/POST return the raw Prisma row with JSON-string fields — the admin UI in Task 7 parses those client-side with the exported `parseJsonArray` helper, matching how the old `points` field used to work).

- [ ] **Step 2: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add app/api/services && git commit -m "feat: update Service API routes for expanded content model"
```

---

## Task 5: Add a ServiceOffering CRUD API

**Files:**
- Create: `app/api/service-offerings/route.ts`
- Create: `app/api/service-offerings/[id]/route.ts`

- [ ] **Step 1: Create `app/api/service-offerings/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { getServiceOfferings, validateServiceOffering, stringifyJsonArray } from '@/lib/services';
import type { Role } from '@/lib/roles';

/** Public list of all service offerings, sorted by order. */
export async function GET(_req: Request) {
  const offerings = await getServiceOfferings();
  return NextResponse.json({ offerings });
}

/** Admin: create a new service offering. */
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

  const body = await req.json().catch(() => ({}));

  const validationError = validateServiceOffering(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const slug = String(body.slug || '').trim();
  const existing = await prisma.serviceOffering.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `Offering with slug "${slug}" already exists` }, { status: 400 });
  }

  const offering = await prisma.serviceOffering.create({
    data: {
      slug,
      name: String(body.name || '').trim(),
      shortDescription: String(body.shortDescription || '').trim(),
      description: String(body.description || '').trim(),
      keywords: stringifyJsonArray(body.keywords || []),
      order: Number(body.order) || 0,
    },
  });

  return NextResponse.json({ offering }, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/service-offerings/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import { stringifyJsonArray } from '@/lib/services';
import type { Role } from '@/lib/roles';

async function requireAuth() {
  return verifyAuthWithUser();
}

/** Admin: fetch one offering by id. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const offering = await prisma.serviceOffering.findUnique({ where: { id } });

  if (!offering) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ offering });
}

/** Admin: update an offering (partial updates allowed). */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'edit')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if ('slug' in body) {
    const slug = String(body.slug || '').trim();
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    data.slug = slug;
  }
  if ('name' in body) {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    data.name = name;
  }
  if ('shortDescription' in body) data.shortDescription = String(body.shortDescription || '').trim();
  if ('description' in body) data.description = String(body.description || '').trim();
  if ('keywords' in body) data.keywords = stringifyJsonArray(body.keywords || []);
  if ('order' in body) data.order = Number(body.order) || 0;

  if ('slug' in data) {
    const existing = await prisma.serviceOffering.findUnique({ where: { slug: data.slug as string } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: `Offering with slug "${data.slug}" already exists` }, { status: 400 });
    }
  }

  const offering = await prisma.serviceOffering.update({ where: { id }, data });
  return NextResponse.json({ offering });
}

/** Admin: delete an offering. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'delete')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const { id } = await params;
  const offering = await prisma.serviceOffering.findUnique({ where: { id } });

  if (!offering) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await prisma.serviceOffering.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add app/api/service-offerings && git commit -m "feat: add ServiceOffering CRUD API"
```

---

## Task 6: Point the public pages at the database

**Files:**
- Modify: `app/components/sections/ServicesOverview.tsx` (entire file)
- Modify: `app/services/page.tsx` (entire file)
- Modify: `app/services/[slug]/page.tsx` (entire file)

- [ ] **Step 1: Replace `app/components/sections/ServicesOverview.tsx`**

```tsx
import Link from 'next/link';
import { getServices } from '@/lib/services';
import { Reveal } from '../ui';

export default async function ServicesOverview() {
  const services = await getServices();

  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="mepm-h2 text-navy-700 mb-4">What we do</h2>
            <p className="mepm-lead max-w-xl">
              Electrical, mechanical and environmental engineering, designed
              together from day one.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-navy-700 hover:text-green-600 transition-colors mb-1.5"
          >
            All services →
          </Link>
        </div>
      </Reveal>

      <div>
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={i * 0.08}>
            <Link
              href={`/services/${service.slug}`}
              className="group grid gap-x-8 gap-y-2 md:grid-cols-[72px_minmax(0,1.1fr)_44px] lg:grid-cols-[72px_minmax(0,1.1fr)_minmax(0,0.9fr)_44px] md:items-center border-t border-slate-200 py-9 px-4 -mx-4 hover:bg-slate-50 transition-colors duration-200"
            >
              <span className="font-mono text-sm font-semibold text-green-700">
                {service.code}
              </span>
              <span>
                <span className="block mepm-h3 text-navy-700">
                  {service.name}
                </span>
                <span className="block text-sm text-slate-600 leading-relaxed mt-2 max-w-md">
                  {service.shortDescription}
                </span>
              </span>
              <span className="hidden lg:block text-sm text-slate-500 leading-relaxed">
                {service.keywords.join(' · ')}
              </span>
              <span
                className="hidden md:flex w-11 h-11 rounded-full border border-slate-200 items-center justify-center text-slate-400 group-hover:border-green-500 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-200"
                aria-hidden
              >
                →
              </span>
            </Link>
          </Reveal>
        ))}
        <div className="border-t border-slate-200 -mx-4" />
      </div>
    </section>
  );
}
```

(Only change from the original: `export default async function`, and `const services = await getServices();` replaces the static import.)

- [ ] **Step 2: Replace `app/services/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getServices } from '@/lib/services';
import { Reveal } from '@/app/components/ui';
import { CtaBand } from '@/app/components/sections';

export const metadata: Metadata = {
  title: 'Services — MEPM Building Services Consultants',
  description:
    'Electrical, mechanical and environmental engineering consultancy. Multi-disciplinary building services design from a single Hull-based team.',
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <section className="bp-grid-light border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          <h1 className="mepm-display text-navy-700 mb-6">Services</h1>
          <p className="mepm-lead max-w-2xl">
            Three disciplines, one team. Most projects need at least two of
            them, and designing them together is the point.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.08} className="h-full">
              <Link
                href={`/services/${service.slug}`}
                className="group flex flex-col h-full border border-slate-200 rounded-lg p-8 hover:border-navy-300 hover:shadow-md transition-all duration-200"
              >
                <span className="font-mono text-sm font-semibold text-green-700 mb-5">
                  {service.code}
                </span>
                <h2 className="mepm-h3 text-navy-700 mb-3">{service.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {service.shortDescription}
                </p>
                <ul className="space-y-1.5 mb-8">
                  {service.keywords.map((keyword) => (
                    <li key={keyword} className="text-sm text-slate-500">
                      {keyword}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto text-sm font-medium text-navy-700 group-hover:text-green-600 transition-colors">
                  Explore {service.navLabel.toLowerCase()} →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 3: Replace `app/services/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServices, getServiceBySlug, getServiceOfferings } from '@/lib/services';
import { Reveal } from '@/app/components/ui';
import { CtaBand, ServiceHero3D } from '@/app/components/sections';
import type { ServiceVariant } from '@/app/components/sections';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.name} — MEPM Building Services Consultants`,
    description: service.shortDescription,
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const relatedResults = await Promise.all(service.relatedSlugs.map(getServiceBySlug));
  const related = relatedResults.filter((s): s is NonNullable<typeof s> => Boolean(s));

  const offerings = await getServiceOfferings();

  return (
    <>
      {/* Page hero — drawing sheet header */}
      <section className="bp-grid-light border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid gap-12 lg:grid-cols-[1fr_minmax(280px,360px)] lg:items-start">
          <div>
            <Link
              href="/services"
              className="mepm-spec hover:text-navy-700 transition-colors"
            >
              ← All services
            </Link>
            <h1 className="mepm-display text-navy-700 mt-5 mb-6">
              {service.name.split(' ')[0]}
              <br />
              <span className="text-slate-400">
                {service.name.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="mepm-lead max-w-xl">{service.intro}</p>
          </div>

          {/* Figure above, title block below — like a real drawing sheet */}
          <Reveal delay={0.15}>
            <ServiceHero3D variant={service.slug as ServiceVariant} />
            <div className="mt-4 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="mepm-spec">MEPM · Service sheet</span>
                <span className="font-mono text-sm font-semibold text-green-700">
                  {service.code}
                </span>
              </div>
              <dl className="px-5 py-4 space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Discipline</dt>
                  <dd className="text-sm font-medium text-navy-700 text-right">
                    {service.navLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Scope items</dt>
                  <dd className="font-mono text-sm text-navy-700">
                    {String(service.scope.length).padStart(2, '0')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Combines with</dt>
                  <dd className="font-mono text-sm text-navy-700">
                    {related.map((r) => r.code).join(' · ')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="mepm-spec">Practice</dt>
                  <dd className="text-sm font-medium text-navy-700">
                    29 years
                  </dd>
                </div>
              </dl>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2">
                {service.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Scope — spec register */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <h2 className="mepm-h2 text-navy-700 mb-12">What we cover</h2>
        </Reveal>
        <div className="grid gap-x-12 md:grid-cols-2">
          {service.scope.map((item, i) => (
            <Reveal key={item.title} delay={(i % 2) * 0.08}>
              <div className="border-t border-slate-200 py-7 grid grid-cols-[64px_1fr] gap-5">
                <span className="font-mono text-sm font-medium text-green-700 pt-0.5">
                  {service.code}-{String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Service lines — register of how the discipline is delivered */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <Reveal>
            <h2 className="mepm-h2 text-navy-700 mb-4">
              How we deliver it
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-xl mb-12">
              Six service lines run across every discipline, from first
              feasibility check to final commissioning sign-off.
            </p>
          </Reveal>
          <div className="grid gap-x-12 md:grid-cols-2">
            {offerings.map((offering, i) => (
              <Reveal key={offering.slug} delay={(i % 2) * 0.08}>
                <div className="border-t border-slate-300 py-7 grid grid-cols-[64px_1fr] gap-5">
                  <span className="font-mono text-sm font-medium text-green-700 pt-0.5">
                    SVC-{String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-body font-semibold text-base text-navy-700 mb-2">
                      {offering.name}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {offering.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables — dark band */}
      <section className="bg-navy-900 bp-grid">
        <div className="max-w-7xl mx-auto px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="mepm-h2 text-white mb-5">What you receive</h2>
            <p className="text-white/72 leading-relaxed max-w-md">
              Design work you can build from and evidence you can submit.
              Every output is produced to be used, not filed.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="space-y-4">
              {service.deliverables.map((item) => (
                <li
                  key={item}
                  className="flex gap-4 items-start border-b border-white/12 pb-4"
                >
                  <span
                    className="mt-1 w-5 h-5 rounded-sm bg-mepm-green/20 border border-mepm-green/50 flex items-center justify-center text-mepm-green text-xs font-bold shrink-0"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Sustainability + related */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 h-full">
            <h2 className="mepm-h4 text-navy-700 mb-4">
              Where sustainability fits
            </h2>
            <p className="text-slate-700 leading-relaxed">
              {service.sustainability}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mepm-h4 text-navy-700 mb-5">Often combined with</h2>
          <div className="space-y-4">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/services/${rel.slug}`}
                className="group flex items-center gap-5 border border-slate-200 rounded-lg p-5 hover:border-navy-300 hover:shadow-md transition-all duration-200"
              >
                <span className="font-mono text-sm font-semibold text-green-700 w-11 shrink-0">
                  {rel.code}
                </span>
                <span className="flex-1">
                  <span className="block font-body font-semibold text-base text-navy-700">
                    {rel.name}
                  </span>
                  <span className="block text-sm text-slate-600 mt-0.5">
                    {rel.shortDescription}
                  </span>
                </span>
                <span
                  className="text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-200"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add app/components/sections/ServicesOverview.tsx app/services && git commit -m "feat: render public service pages from the database instead of a static file"
```

---

## Task 7: Fix the admin preview page and the export route

**Files:**
- Modify: `app/admin/preview/page.tsx:10-18` (the `ServiceData` interface) and the render block around lines 227-244
- Modify: `app/api/export/route.ts` (the services export block)

- [ ] **Step 1: Update the `ServiceData` interface in `app/admin/preview/page.tsx`**

Find:
```ts
interface ServiceData {
  id: string;
  code: string;
  title: string;
  desc: string;
  icon?: string;
  statValue?: string;
  statLabel?: string;
}
```
Replace with:
```ts
interface ServiceData {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  icon?: string;
  statValue?: string;
  statLabel?: string;
}
```

- [ ] **Step 2: Update the render block that uses `sv.title`/`sv.desc`**

In the same file, find the `{data.services.map((sv) => (` block (around line 227) and change:
```tsx
<h3 className="mt-1 font-display text-xl font-bold text-navy-800">
  {sv.title}
</h3>
<p className="mt-2 text-sm leading-relaxed text-slate-600">
  {sv.desc}
</p>
```
to:
```tsx
<h3 className="mt-1 font-display text-xl font-bold text-navy-800">
  {sv.name}
</h3>
<p className="mt-2 text-sm leading-relaxed text-slate-600">
  {sv.shortDescription}
</p>
```

- [ ] **Step 3: Update `app/api/export/route.ts`**

Find the `servicesForExport` mapping (around line 133-153):
```ts
    const servicesForExport = services.map((service) => {
      let points: string[] = [];
      if (service.points) {
        try {
          points = JSON.parse(service.points);
        } catch { /* ignore */ }
      }
      return {
        id: service.id,
        code: service.code,
        title: service.title,
        desc: service.desc,
        points,
        statValue: service.statValue,
        statLabel: service.statLabel,
        order: service.order,
      };
    });
```
Replace with:
```ts
    const servicesForExport = services.map((service) => {
      const parseArr = (json: string): string[] => {
        try {
          const parsed = JSON.parse(json);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };
      return {
        id: service.id,
        slug: service.slug,
        code: service.code,
        name: service.name,
        navLabel: service.navLabel,
        shortDescription: service.shortDescription,
        intro: service.intro,
        keywords: parseArr(service.keywords),
        scope: parseArr(service.scope),
        deliverables: parseArr(service.deliverables),
        sustainability: service.sustainability,
        relatedSlugs: parseArr(service.relatedSlugs),
        statValue: service.statValue,
        statLabel: service.statLabel,
        order: service.order,
      };
    });
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add app/admin/preview/page.tsx app/api/export/route.ts && git commit -m "fix: update preview page and export route for renamed Service fields"
```

---

## Task 8: Rebuild the admin Services UI

**Files:**
- Modify: `app/admin/services/page.tsx` (entire file — list view, simplified to read-only rows + links)
- Create: `app/admin/services/new/page.tsx` (currently 404 — this is the "Add service" target)
- Create: `app/admin/services/[id]/edit/page.tsx`
- Create: `app/admin/services/ServiceForm.tsx` (shared form used by both new + edit, to avoid duplicating the scope/deliverables array editors)

This task is the biggest single file-set change. The existing list page tried to inline-edit `title`/`desc` only; with 13 fields (4 of them arrays) that no longer fits in a list row, so editing moves to dedicated new/edit pages sharing one form component — this also finally makes the existing (currently broken) `/admin/services/new` link work.

- [ ] **Step 1: Create the shared form component `app/admin/services/ServiceForm.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';

export interface ServiceFormData {
  slug: string;
  code: string;
  name: string;
  navLabel: string;
  shortDescription: string;
  intro: string;
  keywords: string[];
  scope: { title: string; description: string }[];
  deliverables: string[];
  sustainability: string;
  relatedSlugs: string[];
  statValue: string;
  statLabel: string;
  order: number;
}

const EMPTY: ServiceFormData = {
  slug: '',
  code: 'ELE',
  name: '',
  navLabel: '',
  shortDescription: '',
  intro: '',
  keywords: [],
  scope: [],
  deliverables: [],
  sustainability: '',
  relatedSlugs: [],
  statValue: '',
  statLabel: '',
  order: 0,
};

const inputClass =
  'w-full rounded border border-slate-300 px-3 py-2 text-sm font-body';
const labelClass = 'mb-2 block text-sm font-medium text-navy-700';

function TagListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-600"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...items, draft.trim()]);
                setDraft('');
              }
            }
          }}
          placeholder="Type a value and press Enter"
          className={inputClass}
        />
      </div>
    </div>
  );
}

function ScopeEditor({
  items,
  onChange,
}: {
  items: { title: string; description: string }[];
  onChange: (items: { title: string; description: string }[]) => void;
}) {
  return (
    <div>
      <label className={labelClass}>Scope items</label>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400">
                Item {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
            <input
              type="text"
              value={item.title}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], title: e.target.value };
                onChange(next);
              }}
              placeholder="Title"
              className={`${inputClass} mb-2`}
            />
            <textarea
              value={item.description}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], description: e.target.value };
                onChange(next);
              }}
              placeholder="Description"
              rows={2}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { title: '', description: '' }])}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800"
      >
        <Plus size={14} /> Add scope item
      </button>
    </div>
  );
}

export default function ServiceForm({
  initial,
  serviceId,
}: {
  initial?: Partial<ServiceFormData>;
  serviceId?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ServiceFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = serviceId ? `/api/services/${serviceId}` : '/api/services';
      const method = serviceId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Failed to save service');
        setSaving(false);
        return;
      }
      router.push('/admin/services');
      router.refresh();
    } catch {
      setError('Failed to save service');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Code</label>
          <select
            value={data.code}
            onChange={(e) => set('code', e.target.value)}
            className={inputClass}
          >
            <option value="ELE">ELE — Electrical</option>
            <option value="MEC">MEC — Mechanical</option>
            <option value="ENV">ENV — Environmental</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="electrical"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Electrical engineering"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Nav label</label>
          <input
            type="text"
            value={data.navLabel}
            onChange={(e) => set('navLabel', e.target.value)}
            placeholder="Electrical"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Short description</label>
        <textarea
          value={data.shortDescription}
          onChange={(e) => set('shortDescription', e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Intro (service page hero paragraph)</label>
        <textarea
          value={data.intro}
          onChange={(e) => set('intro', e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      <TagListEditor
        label="Keywords"
        items={data.keywords}
        onChange={(v) => set('keywords', v)}
      />

      <ScopeEditor items={data.scope} onChange={(v) => set('scope', v)} />

      <TagListEditor
        label="Deliverables"
        items={data.deliverables}
        onChange={(v) => set('deliverables', v)}
      />

      <div>
        <label className={labelClass}>Sustainability blurb</label>
        <textarea
          value={data.sustainability}
          onChange={(e) => set('sustainability', e.target.value)}
          rows={3}
          className={inputClass}
        />
      </div>

      <TagListEditor
        label="Related service slugs (e.g. mechanical, environmental)"
        items={data.relatedSlugs}
        onChange={(v) => set('relatedSlugs', v)}
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Stat value</label>
          <input
            type="text"
            value={data.statValue}
            onChange={(e) => set('statValue', e.target.value)}
            placeholder="100+"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Stat label</label>
          <input
            type="text"
            value={data.statLabel}
            onChange={(e) => set('statLabel', e.target.value)}
            placeholder="Projects"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Order</label>
          <input
            type="number"
            value={data.order}
            onChange={(e) => set('order', Number(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save service'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/services')}
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/admin/services/new/page.tsx`**

```tsx
import ServiceForm from '../ServiceForm';

export default function NewServicePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">Add service</h1>
        <p className="mepm-spec mt-1 text-slate-500">
          Create a new discipline block for the "What we do" section
        </p>
      </div>
      <ServiceForm />
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/services/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { parseJsonArray } from '@/lib/services';
import ServiceForm from '../../ServiceForm';

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="mepm-h2 text-navy-700">Edit service</h1>
        <p className="mepm-spec mt-1 text-slate-500">{service.name}</p>
      </div>
      <ServiceForm
        serviceId={service.id}
        initial={{
          slug: service.slug,
          code: service.code,
          name: service.name,
          navLabel: service.navLabel,
          shortDescription: service.shortDescription,
          intro: service.intro,
          keywords: parseJsonArray<string>(service.keywords),
          scope: parseJsonArray<{ title: string; description: string }>(service.scope),
          deliverables: parseJsonArray<string>(service.deliverables),
          sustainability: service.sustainability,
          relatedSlugs: parseJsonArray<string>(service.relatedSlugs),
          statValue: service.statValue,
          statLabel: service.statLabel,
          order: service.order,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/admin/services/page.tsx`** (list view — read-only rows, links to edit, plus a second section for Service Offerings)

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';

interface ServiceRow {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  statValue: string;
  statLabel: string;
}

interface OfferingRow {
  id: string;
  name: string;
  shortDescription: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [svcRes, offRes] = await Promise.all([
        fetch('/api/services').then((r) => r.json()),
        fetch('/api/service-offerings').then((r) => r.json()),
      ]);
      setServices(svcRes.services || []);
      setOfferings(offRes.offerings || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the website?`)) return;
    const res = await fetch(`/api/services/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleDeleteOffering = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" delivery line from the website?`)) return;
    const res = await fetch(`/api/service-offerings/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) setOfferings((prev) => prev.filter((o) => o.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-mono text-slate-400">Loading…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mepm-h2 text-navy-700">Services</h1>
          <p className="mepm-spec mt-1 text-slate-500">
            Discipline blocks and delivery lines shown across the public site
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Plus size={17} /> Add service
        </Link>
      </div>

      <h2 className="mb-4 text-sm font-mono uppercase tracking-widest text-slate-500">
        Disciplines ({services.length})
      </h2>
      <div className="mb-10 flex flex-col gap-4">
        {services.map((sv) => (
          <div key={sv.id} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex h-13 w-13 flex-none items-center justify-center rounded-md bg-navy-700 text-white">
              <Zap size={26} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs tracking-widest text-slate-400">{sv.code}</span>
                <h3 className="font-display text-xl font-bold text-navy-800">{sv.name}</h3>
              </div>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                {sv.shortDescription}
              </p>
            </div>
            {sv.statValue && (
              <div className="flex-none text-right">
                {sv.statLabel && (
                  <div className="mb-0.5 font-mono text-[10px] tracking-wide text-slate-400">
                    {sv.statLabel}
                  </div>
                )}
                <div className="font-display text-2xl font-bold text-navy-800">{sv.statValue}</div>
              </div>
            )}
            <div className="flex flex-none gap-1.5">
              <Link
                href={`/admin/services/${sv.id}/edit`}
                title="Edit"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-navy-50 hover:text-navy-700"
              >
                <Pencil size={15} />
              </Link>
              <button
                onClick={() => handleDeleteService(sv.id, sv.name)}
                title="Delete"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-sm font-mono uppercase tracking-widest text-slate-500">
        Delivery lines ({offerings.length}) — shown on every service page under "How we deliver it"
      </h2>
      <div className="flex flex-col gap-3">
        {offerings.map((o) => (
          <div key={o.id} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-bold text-navy-800">{o.name}</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
                {o.shortDescription}
              </p>
            </div>
            <div className="flex flex-none gap-1.5">
              <button
                onClick={() => handleDeleteOffering(o.id, o.name)}
                title="Delete"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: this task deliberately doesn't build new/edit UI for `ServiceOffering` beyond delete — the 6 delivery lines are stable, rarely-changed content (copied verbatim from the old static file) and the API in Task 5 already supports full CRUD if that's needed later. Building full add/edit screens for it wasn't part of what the user asked to fix (the "Services" tab), so adding it now would be scope creep; skip unless requested.

- [ ] **Step 5: Commit**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add app/admin/services && git commit -m "feat: rebuild admin Services UI with working add/edit for full content model"
```

---

## Task 9: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

Run:
```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && npx tsc --noEmit
```
Expected: no errors referencing `lib/services.ts`, `app/api/services`, `app/api/service-offerings`, `app/services`, `app/admin/services`, `app/admin/preview`, or `app/api/export`. (Pre-existing unrelated errors elsewhere in the repo, if any, are out of scope for this plan.)

- [ ] **Step 2: Confirm the public API returns full content**

Run:
```bash
curl -s http://localhost:<port>/api/services | python3 -m json.tool | head -40
```
(Replace `<port>` with whatever port the dev server is running on.) Expected: JSON with 3 services, each including `slug`, `name`, `intro`, `scope` (array of objects), `deliverables` (array), `relatedSlugs` (array) — not JSON-stringified, actual parsed arrays.

- [ ] **Step 3: Manually verify each page in the browser**

- `/services` — three discipline cards, matching the copy that used to come from the static file.
- `/services/electrical`, `/services/mechanical`, `/services/environmental` — hero intro, 6 scope items, "How we deliver it" 6 offerings, deliverables list, sustainability blurb, related services links all render with the same copy as before the rewire.
- `/admin/services` — lists both disciplines and delivery lines; "Add service" no longer 404s.
- `/admin/services/new` — form submits and a 4th discipline appears in the list (then delete it to restore the original 3).
- Edit an existing discipline via `/admin/services/<id>/edit`, change the "Short description", save, then reload `/services` in a new tab and confirm the change is visible on the public page — this is the core thing that was broken, so this is the step that proves it's fixed.

- [ ] **Step 4: Final commit (if verification turned up small fixes)**

```bash
cd "/Users/harleywilliams/websites/MEPM website/mepm-website" && git add -A && git commit -m "fix: address issues found during service-rewire verification pass"
```
(Skip this commit if Step 3 found nothing to fix.)

---

## Plan self-review notes

- **Spec coverage:** every requirement from the chosen option ("expand the Service DB model to hold everything the detail pages need — scope, deliverables, sustainability, related links — and migrate all service content into the database so every part of the admin tab actually controls the live site") is covered: schema (Task 1), data migration (Task 3), data-access layer (Task 2), API (Tasks 4-5), public pages (Task 6), admin UI including the previously-404 `/admin/services/new` (Task 8), and the two other call sites that referenced old field names — preview page and export route (Task 7).
- **Scope boundary:** full CRUD UI for `ServiceOffering` (add/edit forms) is intentionally left out of Task 8 — the API supports it, but building the screens wasn't asked for and the content changes rarely. Flagged explicitly in Task 8 rather than silently skipped.
- **Type consistency:** `ServiceDTO`/`ServiceOfferingDTO` field names (Task 2) are used identically in the API routes (Tasks 4-5), the public pages (Task 6), and the admin form (Task 8) — `name`/`shortDescription`/`navLabel`/`slug`/`intro`/`keywords`/`scope`/`deliverables`/`sustainability`/`relatedSlugs`/`statValue`/`statLabel`/`order` everywhere, no `title`/`desc` left anywhere after Task 7.
