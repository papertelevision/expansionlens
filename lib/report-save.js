import prisma from './db.js';
import { sendPurchaseConfirmationEmail } from './email.js';

/**
 * Save a purchased report to the database if it doesn't already exist.
 * Shared between verify-payment (client-side) and Stripe webhook (server-side).
 * Returns the report record or null if it couldn't be saved.
 */
export async function saveReportFromCheckout(stripeSession, analyzeBaseUrl) {
  const sessionId = stripeSession.id;
  const { userId, address, industry, lat, lon } = stripeSession.metadata || {};

  if (!userId || !address) return null;

  // Check if already saved (idempotent)
  const existing = await prisma.report.findFirst({
    where: { stripeSessionId: sessionId },
  });

  if (existing) return existing;

  // Run analysis
  let reportData = null;
  try {
    const url = `${analyzeBaseUrl}/api/analyze?address=${encodeURIComponent(address)}&industry=${encodeURIComponent(industry || 'dental')}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (res.ok) {
      reportData = await res.json();
    }
  } catch (e) {
    console.warn('Report analysis failed during save:', e.message);
  }

  if (!reportData) return null;

  const report = await prisma.report.create({
    data: {
      userId,
      address,
      industry: industry || 'dental',
      lat: parseFloat(lat) || 0,
      lon: parseFloat(lon) || 0,
      reportData: JSON.stringify(reportData),
      stripeSessionId: sessionId,
    },
  });

  // Send confirmation email
  const email = stripeSession.customer_email || stripeSession.customer_details?.email;
  if (email) {
    sendPurchaseConfirmationEmail(email, address, industry || 'dental', report.id)
      .catch((err) => console.warn('Purchase confirmation email failed:', err.message));
  }

  return report;
}
