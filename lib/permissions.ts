import type { Role } from './roles';

// Map of role → allowed actions
export const PERMS: Record<Role, Set<string>> = {
  administrator: new Set(['edit', 'delete', 'publish', 'system', 'users', 'browse']),
  editor: new Set(['edit', 'delete', 'publish', 'browse']),
  viewer: new Set(['browse']),
};

/**
 * Check if a role can perform an action.
 * Returns true if the role has permission for the action.
 */
export function can(role: Role, action: string): boolean {
  return PERMS[role]?.has(action) ?? false;
}

/**
 * Return a function that checks permission. Throws if not allowed.
 * Usage: const require = requirePermission(role); require('edit');
 */
export function requirePermission(role: Role) {
  return (action: string) => {
    if (!can(role, action)) {
      throw new Error(`Forbidden: role "${role}" cannot "${action}"`);
    }
  };
}

/**
 * Helper for routes: verify role can perform action, else return 403.
 * Usage:  const role = user.role; if (!can(role, 'edit')) return NextResponse.json(..., { status: 403 });
 */
export function forbidden() {
  return { error: 'Forbidden: insufficient permissions', status: 403 };
}
