import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  const password = body.password;

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
cookieStore.set('admin-authenticated', 'true', {
  httpOnly: true,
  maxAge: 86400,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

    return NextResponse.json({ success: true });
  }

  return new NextResponse(JSON.stringify({ success: false }), {
    status: 401,
  });
}