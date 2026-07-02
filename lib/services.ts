import { cache } from 'react';
import { prisma } from '@/lib/db';
import type { Service, ServiceOffering } from '@prisma/client';
export { slugify } from './slug';

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
  published: boolean;
  icon: string;
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
  } catch (error) {
    console.error('parseJsonArray: failed to parse JSON array field', { json, error });
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

function toServiceDTO(row: Service): ServiceDTO {
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
    published: row.published,
    icon: row.icon,
  };
}

function toOfferingDTO(row: ServiceOffering): ServiceOfferingDTO {
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

/** publishedOnly=true is what every public-facing caller should pass. Admin views pass false (the default) to see drafts too. */
export const getServices = cache(async (publishedOnly: boolean = false): Promise<ServiceDTO[]> => {
  try {
    const rows = await prisma.service.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toServiceDTO);
  } catch (error) {
    console.error('getServices: database query failed', error);
    return [];
  }
});

/** publishedOnly=true makes an unpublished service resolve to null (so public pages 404 it, same as a missing slug). */
export const getServiceBySlug = cache(async (slug: string, publishedOnly: boolean = false): Promise<ServiceDTO | null> => {
  try {
    const row = await prisma.service.findUnique({ where: { slug } });
    if (!row) return null;
    if (publishedOnly && !row.published) return null;
    return toServiceDTO(row);
  } catch (error) {
    console.error('getServiceBySlug: database query failed', { slug, error });
    return null;
  }
});

export const getServiceOfferings = cache(async (): Promise<ServiceOfferingDTO[]> => {
  try {
    const rows = await prisma.serviceOffering.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toOfferingDTO);
  } catch (error) {
    console.error('getServiceOfferings: database query failed', error);
    return [];
  }
});

// ============================================================================
// Validation (used by API routes)
// ============================================================================

export function validateService(data: Record<string, unknown>): string | null {
  const code = String(data.code || '').toUpperCase();
  if (!code || !isValidServiceCode(code)) {
    return `Code must be one of: ${SERVICE_CODES.join(', ')}`;
  }
  if (!String(data.name || '').trim()) return 'Name is required';
  if (!String(data.navLabel || '').trim()) return 'Nav label is required';
  if (!String(data.shortDescription || '').trim()) return 'Short description is required';
  if (!String(data.intro || '').trim()) return 'Intro is required';
  return null;
}

export function validateServiceOffering(data: Record<string, unknown>): string | null {
  if (!String(data.name || '').trim()) return 'Name is required';
  if (!String(data.shortDescription || '').trim()) return 'Short description is required';
  if (!String(data.description || '').trim()) return 'Description is required';
  return null;
}
