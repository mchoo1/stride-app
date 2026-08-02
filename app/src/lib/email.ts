/**
 * email.ts — Transactional email via Resend
 *
 * Required env var (server-only):
 *   RESEND_API_KEY = re_xxxxxxxxxxxx
 *   → Sign up free at resend.com, create an API key, paste it here.
 *
 * If the key is missing, sendEmail() logs a warning and returns silently —
 * the app never crashes when email is not yet configured.
 */

import { Resend } from 'resend';

const ADMIN_EMAIL = 'stride.singapore@gmail.com';

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface EmailOptions {
  subject: string;
  html: string;
  to?: string;
}

export async function sendEmail({ subject, html, to = ADMIN_EMAIL }: EmailOptions) {
  const resend = getClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping email');
    return;
  }
  try {
    await resend.emails.send({
      from: 'Stride App <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
  } catch (err) {
    // Non-fatal — log and continue
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
    opts.comment            ? ['Comment',         opts.comment]                             : null,
    opts.submittedName      ? ['New name',        opts.submittedName]                       : null,
    opts.submittedCalories  ? ['Calories',        `${opts.submittedCalories} kcal`]         : null,
    opts.submittedProteinG  ? ['Protein',         `${opts.submittedProteinG} g`]            : null,
    opts.submittedCarbsG    ? ['Carbs',           `${opts.submittedCarbsG} g`]              : null,
    opts.submittedFatG      ? ['Fat',             `${opts.submittedFatG} g`]                : null,
    opts.submittedPriceSgd  ? ['Price',           `$${opts.submittedPriceSgd.toFixed(2)}`] : null,
    opts.accuracyRating     ? ['Accuracy rating', `${opts.accuracyRating} / 5`]            : null,
    opts.duplicateOfMealId  ? ['Duplicate of',    opts.duplicateOfMealId]                  : null,
  ].filter(Boolean) as [string, string][];

  const tableRows = rows
    .map(([label, value]) =>
      `<tr><td style="padding:6px 12px;color:#5B6576;white-space:nowrap">${label}</td>` +
      `<td style="padding:6px 12px;font-weight:600;color:#0F1B2D">${value}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#F7F8FB;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #E5E9F2">
    <div style="font-size:20px;font-weight:800;color:#0F1B2D;margin-bottom:4px">📬 New Stride feedback</div>
    <div style="font-size:13px;color:#8B95A7;margin-bottom:20px">${new Date().toUTCString()}</div>
    <table style="border-collapse:collapse;width:100%"><tbody>${tableRows}</tbody></table>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #E5E9F2;font-size:12px;color:#8B95A7">
      Review pending feedback in the Stride admin dashboard.
    </div>
  </div>
</body>
</html>`;
}
