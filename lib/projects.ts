export const DISCIPLINES = ['ELE', 'MEC', 'ENV'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  ELE: 'Electrical',
  MEC: 'Mechanical',
  ENV: 'Environmental',
};

export const PROJECT_STATUSES = ['draft', 'published'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  published: 'Published',
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}

/** "ELE,MEC" -> ["ELE","MEC"], filtered to valid codes. */
export function disciplinesToArray(csv: string): Discipline[] {
  return csv
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is Discipline =>
      (DISCIPLINES as readonly string[]).includes(s)
    );
}

export function disciplinesFromArray(arr: string[]): string {
  return disciplinesToArray(arr.join(',')).join(',');
}

export { slugify } from './slug';

/** Map a ProjectImage.storedPath (under public/) to its served URL. Pure
 *  string helper so client components can use it without node:fs. */
export function imageUrl(storedPath: string): string {
  return '/' + storedPath.replace(/^public\//, '');
}

export interface ProjectImageDTO {
  id: string;
  storedPath: string;
  caption: string | null;
  isCover: boolean;
  order: number;
}

export interface ProjectDTO {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  location: string | null;
  sector: string | null;
  disciplines: string;
  status: string;
  year: number | null;
  summary: string;
  detail: string;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  images: ProjectImageDTO[];
}
