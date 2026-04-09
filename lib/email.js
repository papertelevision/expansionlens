import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address. In production, set EMAIL_FROM to a verified domain address
// (e.g. 'ExpansionLens <noreply@expansionlens.com>'). Falls back to Resend's
// shared sandbox domain in dev so local testing works out of the box.
// See docs/DEPLOY.md for domain verification steps.
const EMAIL_FROM = process.env.EMAIL_FROM || 'ExpansionLens <onboarding@resend.dev>';

export async function sendMagicLinkEmail(email, magicLinkUrl) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your ExpansionLens Login Link',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #1a2b4a; margin-bottom: 1.5rem;">ExpansionLens</div>
          <p style="color: #1e293b; font-size: 1rem; line-height: 1.6;">Click the button below to sign in and continue to your report.</p>
          <a href="${magicLinkUrl}" style="display: inline-block; padding: 0.75rem 2rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; margin: 1.5rem 0;">Sign In & Continue</a>
          <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
          <p style="color: #94a3b8; font-size: 0.75rem; line-height: 1.5;">ExpansionLens &mdash; Location intelligence for growing businesses.</p>
          <p style="color: #94a3b8; font-size: 0.7rem; line-height: 1.5; margin-top: 0.5rem;">This is a transactional email sent because you requested a login link at expansionlens.com. ExpansionLens does not send marketing or promotional email. Questions: <a href="mailto:support@expansionlens.com" style="color: #94a3b8;">support@expansionlens.com</a>.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error('Failed to send magic link email:', e);
    return false;
  }
}

export async function sendPurchaseConfirmationEmail(email, reportAddress, reportIndustry, reportId) {
  try {
    const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://expansionlens.com'}/report?report_id=${reportId}`;
    const industryLabel = reportIndustry
      ? reportIndustry.charAt(0).toUpperCase() + reportIndustry.slice(1)
      : 'General';

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your ExpansionLens Report is Ready',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #1a2b4a; margin-bottom: 1.5rem;">ExpansionLens</div>
          <p style="color: #1e293b; font-size: 1rem; line-height: 1.6; margin-bottom: 0.5rem;">Your location analysis for <strong>${reportAddress}</strong> is ready to view.</p>
          <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">Industry: ${industryLabel}</p>
          <a href="${reportUrl}" style="display: inline-block; padding: 0.75rem 2rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1rem; margin: 0 0 1.5rem;">View Your Report</a>
          <p style="color: #64748b; font-size: 0.85rem; line-height: 1.5;">Your report includes 12 sections of competitive intelligence, demographic data, and a clear expansion score. You can revisit it anytime from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5rem 0;" />
          <p style="color: #94a3b8; font-size: 0.75rem; line-height: 1.5;">ExpansionLens &mdash; Location intelligence for growing businesses.</p>
          <p style="color: #94a3b8; font-size: 0.7rem; line-height: 1.5; margin-top: 0.5rem;">This is a transactional email confirming a purchase you made at expansionlens.com. ExpansionLens does not send marketing or promotional email. Questions or refund requests: <a href="mailto:support@expansionlens.com" style="color: #94a3b8;">support@expansionlens.com</a>.</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error('Failed to send purchase confirmation email:', e);
    return false;
  }
}
