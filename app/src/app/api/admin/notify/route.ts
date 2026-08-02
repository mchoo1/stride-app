/**
 * POST /api/admin/notify
 * ──────────────────────────────────────────────────────────────────────────────
 * Internal endpoint — lets scheduled tasks (Cowork sessions) send admin emails
 * without embedding the RESEND_API_KEY in the task prompt.
 *
 * Auth: Bearer token must match ADMIN_NOTIFY_TOKEN env var.
 *
 * Body: { subject: string, html: string, to?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail }                 from '@/lib/email';

export async function POST(req: NextRequest) {
  // Verify the shared secret
  const auth  = req.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const expected = process.env.ADMIN_NOTIFY_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html    = typeof body.html    === 'string' ? body.html    : '';
  const to      = typeof body.to      === 'string' ? body.to      : undefined;

  if (!subject || !html) {
    return NextResponse.json({ error: 'subject and html required' }, { status: 400 });
  }

  await sendEmail({ subject, html, to });
  return NextResponse.json({ ok: true });
}
