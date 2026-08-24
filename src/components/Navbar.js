'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Leaderboard' },
    { href: '/about', label: 'About' },
    { href: '/policy', label: 'Policy' },
  ];

  return (
    <nav className="border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-16 py-4 sm:py-6">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400 flex items-center justify-center font-black text-black text-sm shrink-0">
            👑
          </div>
          <span className="font-bold text-white tracking-tight text-lg">BidGram</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition">
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition shrink-0"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          menuOpen ? 'max-h-60' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-4 sm:px-6 pb-4 text-sm font-medium text-zinc-400 border-t border-zinc-900">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 px-2 rounded-lg hover:text-white hover:bg-zinc-900 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}