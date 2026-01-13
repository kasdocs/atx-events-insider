'use client';

import Link from 'next/link';

export default function NavbarClient() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-bold">
          ATX Events Insider
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/browse">Browse</Link>
          <Link href="/stories">Stories</Link>
          <Link href="/saved">Saved</Link>
          <Link href="/login">Log in</Link>
        </nav>
      </div>
    </header>
  );
}
