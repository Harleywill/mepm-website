import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthWithUser } from '@/lib/auth';
import { can, forbidden } from '@/lib/permissions';
import type { Role } from '@/lib/roles';
import { parseJsonArray } from '@/lib/services';
import type { ServiceScopeItem } from '@/lib/services';

/**
 * GET /api/export
 * Admin-only endpoint that exports the entire content tree as JSON.
 * Requires 'system' permission (administrators only).
 * Returns all projects, enquiries, services, team, testimonials, accreditations, stats, and users.
 */
export async function GET(_req: Request) {
  // Verify authentication
  let user;
  try {
    user = await verifyAuthWithUser();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check for 'system' permission (administrators only)
  if (!can(user.role as Role, 'system')) {
    const forbid = forbidden();
    return NextResponse.json({ error: forbid.error }, { status: forbid.status });
  }

  try {
    // Fetch all collections in parallel
    const [
      projects,
      enquiries,
      services,
      serviceOfferings,
      team,
      testimonials,
      accreditations,
      stats,
      users,
    ] = await Promise.all([
      prisma.project.findMany({
        include: { images: { orderBy: { order: 'asc' } } },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.enquiry.findMany({
        include: { attachments: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.serviceOffering.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.team.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.testimonial.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.accreditation.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.stat.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.adminUser.findMany({
        select: { id: true, username: true, role: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Transform projects: map images, find cover, prepare gallery
    const projectsForExport = projects.map((project) => {
      const coverImage = project.images.find((img) => img.isCover);
      const gallery = project.images
        .filter((img) => !img.isCover)
        .map((img) => ({
          id: img.id,
          filename: img.filename,
          storedPath: img.storedPath,
          mimeType: img.mimeType,
          size: img.size,
          caption: img.caption,
          order: img.order,
          cropX: img.cropX,
          cropY: img.cropY,
        }));

      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        sector: project.sector,
        disciplines: project.disciplines ? project.disciplines.split(',') : [],
        summary: project.summary,
        detail: project.detail,
        client: project.client,
        location: project.location,
        year: project.year,
        status: project.status,
        featured: project.featured,
        published: project.published,
        order: project.order,
        hero: coverImage
          ? {
              id: coverImage.id,
              filename: coverImage.filename,
              storedPath: coverImage.storedPath,
              mimeType: coverImage.mimeType,
              size: coverImage.size,
              cropX: coverImage.cropX,
              cropY: coverImage.cropY,
            }
          : null,
        gallery,
        updated: project.updatedAt.toISOString(),
      };
    });

    // Transform enquiries: include attachments
    const enquiriesForExport = enquiries.map((enquiry) => ({
      id: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      organisation: enquiry.organisation,
      service: enquiry.service,
      message: enquiry.message,
      status: enquiry.status,
      date: enquiry.createdAt.toISOString(),
      attachments: enquiry.attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        storedPath: att.storedPath,
        mimeType: att.mimeType,
        size: att.size,
      })),
    }));

    // Transform services: parse JSON array fields
    const servicesForExport = services.map((service) => {
      return {
        id: service.id,
        slug: service.slug,
        code: service.code,
        name: service.name,
        navLabel: service.navLabel,
        shortDescription: service.shortDescription,
        intro: service.intro,
        keywords: parseJsonArray<string>(service.keywords),
        scope: parseJsonArray<ServiceScopeItem>(service.scope),
        deliverables: parseJsonArray<string>(service.deliverables),
        sustainability: service.sustainability,
        relatedSlugs: parseJsonArray<string>(service.relatedSlugs),
        statValue: service.statValue,
        statLabel: service.statLabel,
        order: service.order,
        published: service.published,
        icon: service.icon,
      };
    });

    // Transform service offerings (delivery lines)
    const serviceOfferingsForExport = serviceOfferings.map((offering) => ({
      id: offering.id,
      slug: offering.slug,
      name: offering.name,
      shortDescription: offering.shortDescription,
      description: offering.description,
      keywords: parseJsonArray<string>(offering.keywords),
      order: offering.order,
    }));

    // Transform team
    const teamForExport = team.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      discipline: member.discipline,
      bio: member.bio,
      photo: member.photo,
      order: member.order,
    }));

    // Transform testimonials
    const testimonialsForExport = testimonials.map((testimonial) => ({
      id: testimonial.id,
      quote: testimonial.quote,
      author: testimonial.author,
      company: testimonial.company,
      logo: testimonial.logo,
      order: testimonial.order,
    }));

    // Transform accreditations: return just the labels as string array
    const accreditationsForExport = accreditations.map((acc) => acc.label);

    // Transform stats
    const statsForExport = stats.map((stat) => ({
      id: stat.id,
      prefix: stat.prefix,
      value: stat.value,
      suffix: stat.suffix,
      label: stat.label,
      order: stat.order,
    }));

    // Build export object
    const exportData = {
      projects: projectsForExport,
      enquiries: enquiriesForExport,
      services: servicesForExport,
      serviceOfferings: serviceOfferingsForExport,
      team: teamForExport,
      testimonials: testimonialsForExport,
      accreditations: accreditationsForExport,
      siteStats: statsForExport,
      users,
      exportedAt: new Date().toISOString(),
    };

    // Return with Content-Disposition header for download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mepm-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
