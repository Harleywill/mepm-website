export const DISCIPLINES = ['ELE', 'MEC', 'ENV'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  ELE: 'Electrical',
  MEC: 'Mechanical',
  ENV: 'Environmental',
};

/**
 * Check if a string is a valid discipline code.
 */
export function isValidDiscipline(value: string): value is Discipline {
  return (DISCIPLINES as readonly string[]).includes(value);
}

/**
 * Validate a team member object. Returns an error string, or null if valid.
 */
export function validateTeamMember(data: Record<string, unknown>): string | null {
  const name = String(data.name || '').trim();
  if (!name) return 'Name is required';

  const role = String(data.role || '').trim();
  if (!role) return 'Role is required';

  const discipline = String(data.discipline || '').toUpperCase();
  if (!isValidDiscipline(discipline)) {
    return `Discipline must be one of: ${DISCIPLINES.join(', ')}`;
  }

  return null;
}

export interface TeamMemberDTO {
  id: string;
  name: string;
  role: string;
  discipline: string;
  bio: string;
  photo: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}
