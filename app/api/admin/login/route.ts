import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  const password = body.password;

  console.log('Password received:', password);
  console.log('Password expected:', process.env.ADMIN_PASSWORD);

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('admin-authenticated', 'true', {
      httpOnly: true,
      maxAge: 86400,
    });
    return NextResponse.json({ success: true });
  }

  return new NextResponse(JSON.stringify({ success: false }), {
    status: 401,
  });
}