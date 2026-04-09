import { getSession } from '../../../../lib/auth.js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const user = await getSession(sessionCookie);

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({ user: { id: user.id, email: user.email } });
}
