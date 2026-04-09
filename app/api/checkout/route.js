import Stripe from 'stripe';
import { getSession } from '../../../lib/auth.js';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const user = await getSession(sessionCookie);

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { address, industry, lat, lon } = await request.json();

    if (!address) {
      return Response.json({ error: 'Address is required' }, { status: 400 });
    }

    const host = request.headers.get('host') || 'localhost:3003';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = request.headers.get('origin') || `${proto}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ExpansionLens Location Report',
              description: `Full analysis for: ${address}`,
            },
            unit_amount: 14900, // $149.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId: user.id,
        address,
        industry: industry || 'dental',
        lat: String(lat),
        lon: String(lon),
      },
      success_url: `${origin}/report?session_id={CHECKOUT_SESSION_ID}&address=${encodeURIComponent(address)}&industry=${encodeURIComponent(industry || 'dental')}`,
      cancel_url: `${origin}/report?address=${encodeURIComponent(address)}&industry=${encodeURIComponent(industry || 'dental')}`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error('Checkout session creation failed:', e);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
