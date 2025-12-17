'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold" style={{ color: '#7B2CBF' }}>
              ATX Events Insider
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/browse" className="text-gray-700 hover:text-purple-600 font-medium">
              Browse Events
            </Link>
            <Link href="/stories" className="text-gray-700 hover:text-purple-600 font-medium">
              Stories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-purple-600 font-medium">
              About
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-purple-600">🔍</button>

              {!user ? (
                <Link href="/login" className="text-gray-700 hover:text-purple-600">
                  👤
                </Link>
              ) : (
                <>
                  <Link href="/saved" className="text-gray-700 hover:text-purple-600">
                    💾
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-700 hover:text-purple-600"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-6 space-y-4">
            <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>Browse Events</Link>
            <Link href="/stories" onClick={() => setMobileMenuOpen(false)}>Stories</Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>About</Link>

            <div className="pt-4 border-t">
              {!user ? (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  👤 Login
                </Link>
              ) : (
                <>
                  <Link href="/saved" onClick={() => setMobileMenuOpen(false)}>
                    💾 Saved Events
                  </Link>
                  <button onClick={logout} className="block mt-2">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
