import Stripe from 'stripe';
import { saveReportFromCheckout } from '../../../../lib/report-save.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  let event;

  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET is not configured');
      return Response.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    if (!sig) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error('Stripe webhook signature verification failed:', e.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (session.payment_status === 'paid') {
        console.log(`Webhook: checkout.session.completed for ${session.id}`);

        const host = request.headers.get('host') || 'localhost:3003';
        const proto = request.headers.get('x-forwarded-proto') || 'http';
        const origin = `${proto}://${host}`;

        try {
          const report = await saveReportFromCheckout(session, origin);
          if (report) {
            console.log(`Webhook: Report saved — ${report.id} for ${session.metadata?.address}`);
          } else {
            console.warn(`Webhook: Could not save report for session ${session.id}`);
          }
        } catch (e) {
          console.error(`Webhook: Error saving report for session ${session.id}:`, e.message);
        }
      }
      break;
    }

    case 'checkout.session.async_payment_succeeded': {
      // Handle delayed payment methods (bank transfers, etc.)
      const session = event.data.object;
      console.log(`Webhook: async payment succeeded for ${session.id}`);

      const host = request.headers.get('host') || 'localhost:3003';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const origin = `${proto}://${host}`;

      try {
        await saveReportFromCheckout(session, origin);
      } catch (e) {
        console.error(`Webhook: Error on async payment for session ${session.id}:`, e.message);
      }
      break;
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object;
      console.warn(`Webhook: async payment failed for session ${session.id}`);
      break;
    }

    default:
      // Unhandled event type — acknowledge it
      break;
  }

  // Always return 200 to acknowledge receipt
  return Response.json({ received: true });
}
