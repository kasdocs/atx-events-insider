import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page itself
  if (pathname === '/admin') return NextResponse.next();

  // Protect everything else under /admin/*
  if (pathname.startsWith('/admin')) {
    const isAuthed = req.cookies.get('admin-authenticated')?.value === 'true';

    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
