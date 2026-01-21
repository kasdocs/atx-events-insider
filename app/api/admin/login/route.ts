import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));

  const ok = password === process.env.ADMIN_PASSWORD;

  if (!ok) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('admin-authenticated', 'true', {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return NextResponse.json({ success: true });
}
