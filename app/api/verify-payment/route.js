import Stripe from 'stripe';
import { saveReportFromCheckout } from '../../../lib/report-save.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return Response.json({ paid: false, error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json({ paid: false });
    }

    const { address, industry } = session.metadata || {};

    const host = request.headers.get('host') || 'localhost:3003';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    const report = await saveReportFromCheckout(session, origin);

    return Response.json({
      paid: true,
      reportId: report?.id || null,
      address,
      industry,
    });
  } catch (e) {
    console.error('Payment verification failed:', e);
    return Response.json({ paid: false, error: 'Verification failed' }, { status: 500 });
  }
}
