/**
 * POST /api/merchants
 * ──────────────────────────────────────────────────────────────────────────────
 * Submit a merchant / provider partner application.
 * Writes to Firestore merchants/{uid} and emails stride.singapore@gmail.com.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb }                   from '@/lib/firebase-admin';
import { verifyToken }               from '@/lib/api-auth';
import { FieldValue }                from 'firebase-admin/firestore';
import { sendEmail }                 from '@/lib/email';

const UEN_RE = /^[0-9A-Za-z]{9,10}$/;

export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { businessName, uen, outletType, contactEmail, userEmail } = body;

  if (!businessName || typeof businessName !== 'string' || !businessName.trim())
    return NextResponse.json({ error: 'businessName required' }, { status: 400 });
  if (!uen || typeof uen !== 'string' || !UEN_RE.test(uen.trim()))
    return NextResponse.json({ error: 'Invalid UEN' }, { status: 400 });
  if (!outletType || typeof outletType !== 'string')
    return NextResponse.json({ error: 'outletType required' }, { status: 400 });
  if (!contactEmail || typeof contactEmail !== 'string' || !/\S+@\S+\.\S+/.test(contactEmail))
    return NextResponse.json({ error: 'Valid contactEmail required' }, { status: 400 });

  const data = {
    businessName: (businessName as string).trim(),
    uen:          (uen as string).trim().toUpperCase(),
    outletType,
    contactEmail: (contactEmail as string).toLowerCase().trim(),
    userEmail:    typeof userEmail === 'string' ? userEmail : '',
    userId:       uid,
    status:       'pending',
    createdAt:    FieldValue.serverTimestamp(),
  };

  await adminDb.collection('merchants').doc(uid).set(data);

  void sendEmail({
    subject: `[Stride] New partner application — ${data.businessName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F8FB;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #E5E9F2">
    <div style="font-size:20px;font-weight:800;color:#0F1B2D;margin-bottom:4px">🏪 New partner application</div>
    <div style="font-size:13px;color:#8B95A7;margin-bottom:20px">${new Date().toUTCString()}</div>
    <table style="border-collapse:collapse;width:100%">
      <tbody>
        <tr><td style="padding:6px 12px;color:#5B6576">Business name</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${data.businessName}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">UEN</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${data.uen}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Outlet type</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${data.outletType}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">Contact email</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${data.contactEmail}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">User email</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${data.userEmail}</td></tr>
        <tr><td style="padding:6px 12px;color:#5B6576">User ID</td><td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${uid}</td></tr>
      </tbody>
    </table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E5E9F2;font-size:12px;color:#8B95A7">
      Review and approve in the Stride admin dashboard or Firestore merchants collection.
    </div>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ ok: true, status: 'pending' }, { status: 201 });
}
