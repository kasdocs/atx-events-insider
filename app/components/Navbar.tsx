'use client';

import dynamic from 'next/dynamic';

const NavbarClient = dynamic(() => import('./NavbarClient'), { ssr: false });

export default function Navbar() {
  return <NavbarClient />;
}
