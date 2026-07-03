import { revalidatePath } from 'next/cache';

/**
 * Invalidate every cached public page. Call after any admin content mutation
 * (projects, services, team, stats, settings…) so ISR pages re-render with
 * fresh data on the next visit instead of waiting for a rebuild.
 *
 * Deliberately coarse: content edits are rare and regeneration is cheap
 * (local SQLite), so invalidating the whole tree is simpler and safer than
 * tracking which entity appears on which page (services show in the nav and
 * footer of every page, projects on the homepage, etc.).
 */
export function revalidatePublicSite(): void {
  revalidatePath('/', 'layout');
}
