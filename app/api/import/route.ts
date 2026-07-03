import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import type { Role } from '@/lib/roles';
import { stringifyJsonArray } from '@/lib/services';
import { revalidatePublicSite } from '@/lib/revalidate';

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: string[];
}

function emptySummary(): ImportSummary {
  return { imported: 0, skipped: 0, errors: [] };
}

/**
 * POST /api/import
 * Admin-only endpoint that restores content from a JSON file produced by GET /api/export.
 * Merge/upsert semantics: records are matched by id (or by their natural unique key
 * where the export doesn't carry an id, e.g. accreditations). Nothing already in the
 * database is deleted. AdminUser accounts are never imported — the export intentionally
 * omits password hashes, so importing them could only create broken, unusable accounts.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!can(user.role as Role, 'system')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });
  }

  const results: Record<string, ImportSummary> = {};

  // Projects (+ their images)
  if (Array.isArray(body.projects)) {
    const summary = emptySummary();
    for (const p of body.projects) {
      try {
        if (!p?.id || !p?.slug || !p?.title) throw new Error('missing id/slug/title');
        await prisma.project.upsert({
          where: { id: p.id },
          update: {
            slug: p.slug,
            title: p.title,
            sector: p.sector ?? null,
            disciplines: Array.isArray(p.disciplines) ? p.disciplines.join(',') : (p.disciplines ?? ''),
            summary: p.summary ?? '',
            detail: p.detail ?? '',
            client: p.client ?? null,
            location: p.location ?? null,
            year: p.year ?? null,
            status: p.status ?? 'complete',
            featured: Boolean(p.featured),
            published: Boolean(p.published),
            order: Number(p.order) || 0,
          },
          create: {
            id: p.id,
            slug: p.slug,
            title: p.title,
            sector: p.sector ?? null,
            disciplines: Array.isArray(p.disciplines) ? p.disciplines.join(',') : (p.disciplines ?? ''),
            summary: p.summary ?? '',
            detail: p.detail ?? '',
            client: p.client ?? null,
            location: p.location ?? null,
            year: p.year ?? null,
            status: p.status ?? 'complete',
            featured: Boolean(p.featured),
            published: Boolean(p.published),
            order: Number(p.order) || 0,
          },
        });

        const images = [
          ...(p.hero ? [{ ...p.hero, isCover: true, order: -1 }] : []),
          ...(Array.isArray(p.gallery) ? p.gallery : []),
        ];
        for (const img of images) {
          if (!img?.id || !img?.filename || !img?.storedPath) continue;
          await prisma.projectImage.upsert({
            where: { id: img.id },
            update: {
              projectId: p.id,
              filename: img.filename,
              storedPath: img.storedPath,
              mimeType: img.mimeType ?? '',
              size: Number(img.size) || 0,
              caption: img.caption ?? null,
              isCover: Boolean(img.isCover),
              order: Number(img.order) || 0,
            },
            create: {
              id: img.id,
              projectId: p.id,
              filename: img.filename,
              storedPath: img.storedPath,
              mimeType: img.mimeType ?? '',
              size: Number(img.size) || 0,
              caption: img.caption ?? null,
              isCover: Boolean(img.isCover),
              order: Number(img.order) || 0,
            },
          });
        }

        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${p?.title || p?.id || 'unknown project'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.projects = summary;
  }

  // Enquiries (+ their attachments)
  if (Array.isArray(body.enquiries)) {
    const summary = emptySummary();
    for (const e of body.enquiries) {
      try {
        if (!e?.id || !e?.name || !e?.email || !e?.message) throw new Error('missing id/name/email/message');
        await prisma.enquiry.upsert({
          where: { id: e.id },
          update: {
            name: e.name,
            email: e.email,
            phone: e.phone ?? null,
            organisation: e.organisation ?? null,
            service: e.service ?? null,
            message: e.message,
            status: e.status ?? 'new',
          },
          create: {
            id: e.id,
            name: e.name,
            email: e.email,
            phone: e.phone ?? null,
            organisation: e.organisation ?? null,
            service: e.service ?? null,
            message: e.message,
            status: e.status ?? 'new',
          },
        });

        for (const att of Array.isArray(e.attachments) ? e.attachments : []) {
          if (!att?.id || !att?.filename || !att?.storedPath) continue;
          await prisma.attachment.upsert({
            where: { id: att.id },
            update: {
              enquiryId: e.id,
              filename: att.filename,
              storedPath: att.storedPath,
              mimeType: att.mimeType ?? '',
              size: Number(att.size) || 0,
            },
            create: {
              id: att.id,
              enquiryId: e.id,
              filename: att.filename,
              storedPath: att.storedPath,
              mimeType: att.mimeType ?? '',
              size: Number(att.size) || 0,
            },
          });
        }

        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${e?.name || e?.id || 'unknown enquiry'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.enquiries = summary;
  }

  // Services (disciplines)
  if (Array.isArray(body.services)) {
    const summary = emptySummary();
    for (const s of body.services) {
      try {
        if (!s?.id || !s?.slug || !s?.code || !s?.name) throw new Error('missing id/slug/code/name');
        const data = {
          slug: s.slug,
          code: s.code,
          name: s.name,
          navLabel: s.navLabel ?? s.name,
          shortDescription: s.shortDescription ?? '',
          intro: s.intro ?? '',
          keywords: stringifyJsonArray(s.keywords ?? []),
          scope: stringifyJsonArray(s.scope ?? []),
          deliverables: stringifyJsonArray(s.deliverables ?? []),
          sustainability: s.sustainability ?? '',
          relatedSlugs: stringifyJsonArray(s.relatedSlugs ?? []),
          statValue: s.statValue ?? '',
          statLabel: s.statLabel ?? '',
          order: Number(s.order) || 0,
          published: s.published ?? true,
          icon: s.icon ?? 'Zap',
        };
        await prisma.service.upsert({
          where: { id: s.id },
          update: data,
          create: { id: s.id, ...data },
        });
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${s?.name || s?.id || 'unknown service'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.services = summary;
  }

  // Service offerings (delivery lines)
  if (Array.isArray(body.serviceOfferings)) {
    const summary = emptySummary();
    for (const o of body.serviceOfferings) {
      try {
        if (!o?.id || !o?.slug || !o?.name) throw new Error('missing id/slug/name');
        const data = {
          slug: o.slug,
          name: o.name,
          shortDescription: o.shortDescription ?? '',
          description: o.description ?? '',
          keywords: stringifyJsonArray(o.keywords ?? []),
          order: Number(o.order) || 0,
        };
        await prisma.serviceOffering.upsert({
          where: { id: o.id },
          update: data,
          create: { id: o.id, ...data },
        });
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${o?.name || o?.id || 'unknown delivery line'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.serviceOfferings = summary;
  }

  // Team members (name is unique, not just id — a collision throws and is reported as skipped)
  if (Array.isArray(body.team)) {
    const summary = emptySummary();
    for (const m of body.team) {
      try {
        if (!m?.id || !m?.name || !m?.role || !m?.discipline) throw new Error('missing id/name/role/discipline');
        const data = {
          name: m.name,
          role: m.role,
          discipline: m.discipline,
          bio: m.bio ?? '',
          photo: m.photo ?? null,
          order: Number(m.order) || 0,
        };
        await prisma.team.upsert({
          where: { id: m.id },
          update: data,
          create: { id: m.id, ...data },
        });
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${m?.name || m?.id || 'unknown team member'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.team = summary;
  }

  // Testimonials (author is unique, not just id — a collision throws and is reported as skipped)
  if (Array.isArray(body.testimonials)) {
    const summary = emptySummary();
    for (const t of body.testimonials) {
      try {
        if (!t?.id || !t?.quote || !t?.author) throw new Error('missing id/quote/author');
        const data = {
          quote: t.quote,
          author: t.author,
          company: t.company ?? null,
          logo: t.logo ?? null,
          order: Number(t.order) || 0,
        };
        await prisma.testimonial.upsert({
          where: { id: t.id },
          update: data,
          create: { id: t.id, ...data },
        });
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${t?.author || t?.id || 'unknown testimonial'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.testimonials = summary;
  }

  // Accreditations: export only carries labels (no id), so match/create by label.
  if (Array.isArray(body.accreditations)) {
    const summary = emptySummary();
    const existing = await prisma.accreditation.findMany({ select: { label: true } });
    const existingLabels = new Set(existing.map((a) => a.label));
    let nextOrder = existing.length;
    for (const label of body.accreditations) {
      try {
        if (typeof label !== 'string' || !label.trim()) throw new Error('missing label');
        if (existingLabels.has(label)) {
          summary.skipped += 1;
          continue;
        }
        await prisma.accreditation.create({ data: { label, order: nextOrder } });
        existingLabels.add(label);
        nextOrder += 1;
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${typeof label === 'string' ? label : 'unknown accreditation'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.accreditations = summary;
  }

  // Site stats
  if (Array.isArray(body.siteStats)) {
    const summary = emptySummary();
    for (const s of body.siteStats) {
      try {
        if (!s?.id || !s?.label) throw new Error('missing id/label');
        const data = {
          prefix: s.prefix ?? '',
          value: Number(s.value) || 0,
          suffix: s.suffix ?? '',
          label: s.label,
          order: Number(s.order) || 0,
        };
        await prisma.stat.upsert({
          where: { id: s.id },
          update: data,
          create: { id: s.id, ...data },
        });
        summary.imported += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push(`${s?.label || s?.id || 'unknown stat'}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    }
    results.siteStats = summary;
  }

  revalidatePublicSite();

  return NextResponse.json({ ok: true, results, usersSkipped: 'Admin accounts are never imported — recreate them manually if needed.' });
}
