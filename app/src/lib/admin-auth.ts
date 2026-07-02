/**
 * Server-only admin verification (imports firebase-admin — never import in a client component).
 * Decodes the Firebase ID token and checks the email against the admin allowlist.
 */
import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';
import { isAdminEmail } from './admin';

export async function verifyAdmin(
  req: NextRequest,
): Promise<{ uid: string; email: string } | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!isAdminEmail(decoded.email)) return null;
    return { uid: decoded.uid, email: decoded.email ?? '' };
  } catch {
    return null;
  }
}
