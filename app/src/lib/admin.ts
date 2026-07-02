/**
 * Admin allowlist (client-safe — NO firebase-admin import here).
 *
 * MVP moderator gate: a hardcoded list of admin emails. Later, replace with a
 * proper `role` field on the user profile. Server-side enforcement lives in
 * `admin-auth.ts` (verifyAdmin); this module is safe to import in the browser
 * for showing/hiding the moderation UI.
 */

export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'deanhoshouyu@gmail.com',
  'mchoo1990@gmail.com',
]);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.has(email.trim().toLowerCase());
}
