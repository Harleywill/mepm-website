export const ROLES = ['administrator', 'editor', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<Role, string> = {
  administrator: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer',
};
