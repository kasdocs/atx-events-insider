import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('admin-authenticated');

  if (authenticated?.value === 'true') {
    return NextResponse.json({ authenticated: true });
  }

  return new NextResponse(JSON.stringify({ authenticated: false }), {
    status: 401,
  });
}