/**
 * email.ts — Transactional email via Gmail SMTP (nodemailer)
 *
 * Required env vars (server-only, never NEXT_PUBLIC_):
 *   EMAIL_USER         = stride.singapore@gmail.com
 *   EMAIL_APP_PASSWORD = 16-char Gmail App Password
 *                        (Google Account → Security → 2-Step → App passwords)
 *
 * If either var is missing, sendEmail() logs a warning and returns silently —
 * so the app never crashes when email is not yet configured.
 */

import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'stride.singapore@gmail.com';

function createTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export interface EmailOptions {
  subject: string;
  html: string;
  to?: string; // defaults to ADMIN_EMAIL
}

export async function sendEmail({ subject, html, to = ADMIN_EMAIL }: EmailOptions) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn('[email] EMAIL_USER / EMAIL_APP_PASSWORD not set — skipping email');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Stride App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Non-fatal — log and continue. Email failure should never break the API.
    console.error('[email] Failed to send email:', err);
  }
}

// ─── Prebuilt templates ────────────────────────────────────────────────────────

export function feedbackEmailHtml(opts: {
  feedbackType: string;
  mealId: string;
  userId: string;
  comment?: string | null;
  submittedCalories?: number | null;
  submittedProteinG?: number | null;
  submittedCarbsG?: number | null;
  submittedFatG?: number | null;
  submittedPriceSgd?: number | null;
  accuracyRating?: number | null;
  submittedName?: string | null;
  duplicateOfMealId?: string | null;
}) {
  const rows = [
    ['Feedback type', opts.feedbackType],
    ['Meal ID',       opts.mealId],
    ['User ID',       opts.userId],
    opts.comment            ? ['Comment',          opts.comment]                           : null,
    opts.submittedName      ? ['New name',         opts.submittedName]                     : null,
    opts.submittedCalories  ? ['Calories',         `${opts.submittedCalories} kcal`]       : null,
    opts.submittedProteinG  ? ['Protein',          `${opts.submittedProteinG} g`]          : null,
    opts.submittedCarbsG    ? ['Carbs',            `${opts.submittedCarbsG} g`]            : null,
    opts.submittedFatG      ? ['Fat',              `${opts.submittedFatG} g`]              : null,
    opts.submittedPriceSgd  ? ['Price',            `$${opts.submittedPriceSgd.toFixed(2)}`] : null,
    opts.accuracyRating     ? ['Accuracy rating',  `${opts.accuracyRating} / 5`]          : null,
    opts.duplicateOfMealId  ? ['Duplicate of',     opts.duplicateOfMealId]                 : null,
  ].filter(Boolean) as [string, string][];

  const tableRows = rows
    .map(([label, value]) =>
      `<tr><td style="padding:6px 12px;color:#5B6576;white-space:nowrap">${label}</td>` +
      `<td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${value}</td></tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F8FB;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #E5E9F2">
    <div style="font-size:20px;font-weight:800;color:#0F1B2D;margin-bottom:4px">
      📬 New Stride feedback
    </div>
    <div style="font-size:13px;color:#8B95A7;margin-bottom:20px">${new Date().toUTCString()}</div>
    <table style="border-collapse:collapse;width:100%">
      <tbody>${tableRows}</tbody>
    </table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E5E9F2;font-size:12px;color:#8B95A7">
      Review pending feedback in the Stride admin dashboard.
    </div>
  </div>
</body>
</html>`;
}
