import { prisma } from '@/lib/db';

export interface SiteSettingsDTO {
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

export interface StatDTO {
  id: string;
  prefix: string;
  value: number;
  suffix: string;
  label: string;
  order: number;
}

export interface QualificationDTO {
  id: string;
  label: string;
  order: number;
}

export interface FullSettings {
  settings: SiteSettingsDTO;
  stats: StatDTO[];
  qualifications: QualificationDTO[];
}

export const DEFAULT_SETTINGS: SiteSettingsDTO = {
  phone: '01482 838080',
  email: 'info@mepmservices.co.uk',
  addressLine1: 'Unit F2 Rotterdam Park',
  addressLine2: 'Hull, HU7 0AN',
  addressLine3: 'East Riding of Yorkshire',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
};

// Shown whenever no stats have been set (fresh DB, seed skipped, or all
// removed) so the stat strip is never empty unless the admin overrides it.
export const DEFAULT_STATS: StatDTO[] = [
  { id: 'default-0', prefix: '', value: 29, suffix: '', label: 'Years in practice', order: 0 },
  { id: 'default-1', prefix: '', value: 3, suffix: '', label: 'Engineering disciplines, one team', order: 1 },
  { id: 'default-2', prefix: '', value: 6, suffix: '', label: 'Service lines, feasibility to handover', order: 2 },
];

/** Read settings, stats and qualifications. Server-only (uses Prisma).
 *  Falls back to defaults if the singleton row is missing. */
export async function getSettings(): Promise<FullSettings> {
  const [row, stats, qualifications] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    prisma.stat.findMany({ orderBy: { order: 'asc' } }),
    prisma.qualification.findMany({ orderBy: { order: 'asc' } }),
  ]);

  const settings: SiteSettingsDTO = row
    ? {
        phone: row.phone,
        email: row.email,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2,
        addressLine3: row.addressLine3,
        facebook: row.facebook,
        twitter: row.twitter,
        instagram: row.instagram,
        linkedin: row.linkedin,
      }
    : DEFAULT_SETTINGS;

  return {
    settings,
    stats: stats.length > 0 ? stats : DEFAULT_STATS,
    qualifications,
  };
}
