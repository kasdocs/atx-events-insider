'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold" style={{color: '#7B2CBF'}}>
              ATX Events Insider
            </h1>
          </Link>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/browse" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Browse Events
            </Link>
            <Link href="/stories" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Stories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              About
            </Link>
          </div>
          
          {/* Right Side - Desktop & Mobile */}
          <div className="flex items-center space-x-4">
            {/* Desktop Icons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-purple-600 transition-colors">
                🔍
              </button>
              <button className="text-gray-700 hover:text-purple-600 transition-colors">
                👤
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-purple-600 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 top-16"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <Link 
                href="/browse" 
                className="block py-3 px-4 text-lg font-semibold text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Events
              </Link>
              <Link 
                href="/stories" 
                className="block py-3 px-4 text-lg font-semibold text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Stories
              </Link>
              <Link 
                href="/about" 
                className="block py-3 px-4 text-lg font-semibold text-gray-800 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              
              {/* Mobile Icons */}
              <div className="pt-4 border-t border-gray-200 flex gap-4">
                <button className="flex-1 py-3 px-4 bg-purple-50 text-purple-600 font-semibold rounded-lg hover:bg-purple-100 transition-colors">
                  🔍 Search
                </button>
                <button className="flex-1 py-3 px-4 bg-purple-50 text-purple-600 font-semibold rounded-lg hover:bg-purple-100 transition-colors">
                  👤 Profile
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}