'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Navbar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('Error getting user:', error);
      if (!cancelled) setUser(data.user ?? null);
    };

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return;
    }
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const goToLogin = () => {
    router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-lg" style={{ color: '#7B2CBF' }}>
            ATX Events Insider
          </span>
        </Link>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
          <Link href="/browse" className="text-gray-700 hover:text-purple-700">
            Browse Events
          </Link>
          <Link href="/stories" className="text-gray-700 hover:text-purple-700">
            Stories
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-purple-700">
            About
          </Link>
          {user && (
            <Link href="/saved" className="text-gray-700 hover:text-purple-700">
              Saved
            </Link>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search icon */}
          <Link
            href="/browse"
            className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Search events"
            title="Search events"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
            </svg>
          </Link>

          {/* Desktop login/logout */}
          <div className="hidden md:block">
            {user ? (
              <button
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
                aria-label="Log out"
                title="Log out"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 17l1 0m8-5H9m10 0l-3-3m3 3l-3 3M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={goToLogin}
                className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
                aria-label="Log in"
                title="Log in"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9M10 17l1 0m0-10h0m8 5H9m10 0l-3-3m3 3l-3 3"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              // X icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M18 6L6 18" />
                <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" d="M4 6h16" />
                <path strokeWidth="2" strokeLinecap="round" d="M4 12h16" />
                <path strokeWidth="2" strokeLinecap="round" d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2 text-sm font-semibold">
            <Link href="/browse" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Browse Events
            </Link>
            <Link href="/stories" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Stories
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              About
            </Link>

            {user && (
              <Link href="/saved" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                Saved
              </Link>
            )}

            <div className="pt-2 border-t border-gray-200">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Log out
                </button>
              ) : (
                <button
                  onClick={goToLogin}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Log in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
