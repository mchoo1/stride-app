// Helper to verify Firebase ID token from API route requests
import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyToken(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('authorization') ?? '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
