import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 md:px-16 py-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400 flex items-center justify-center font-black text-black text-sm">
          👑
        </div>
        <span className="font-bold text-white tracking-tight text-lg">BidGram</span>
      </Link>

      <div className="flex items-center gap-8 text-sm font-medium text-zinc-400">
        <Link href="/" className="hover:text-white transition">Leaderboard</Link>
        <Link href="/about" className="hover:text-white transition">About</Link>
        <Link href="/policy" className="hover:text-white transition">Policy</Link>
      </div>
    </nav>
  );
}