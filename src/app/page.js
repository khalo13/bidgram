import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import HeroCheckoutCard from '@/components/HeroCheckoutCard';
import RowCheckoutForm from '@/components/RowCheckoutForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function Home() {
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .order('bid_amount', { ascending: false })
    .limit(100);

  return (
    <main className="min-h-screen bg-[#070708] text-white selection:bg-pink-500 selection:text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-12 md:pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono font-bold">
            The Paid Discovery Board
          </span>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Bid for attention.{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Own the top spot.
            </span>
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
            A transparent leaderboard where Instagram handles compete for visibility. Your total cumulative bid sets your exact rank position.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono text-zinc-400 border-t border-zinc-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Top 100 Board</span>
            </div>
            <div>•</div>
            <div>Instant Position Shifting</div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroCheckoutCard />
        </div>
      </div>

      {/* Leaderboard Table Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 py-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🔥</span> Live Top 100 Leaderboard
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Showing {bids?.length || 0} active handles
          </span>
        </div>

        <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 px-6 py-4 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Instagram Handle</div>
            <div className="col-span-3">Current Bid</div>
            <div className="col-span-3 text-right">Outbid / Grab Spot</div>
          </div>

          <div className="divide-y divide-zinc-900">
            {bids && bids.length > 0 ? (
              bids.map((entry, index) => {
                const rank = index + 1;

                return (
                  <div key={entry.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-zinc-900/40 transition text-sm">
                    <div className="col-span-1 font-mono font-bold text-zinc-400">
                      #{rank} {rank === 1 && '👑'}
                    </div>

                    <div className="col-span-5 font-bold flex items-center gap-2">
                      <a href={`https://instagram.com/${entry.instagram_handle}`} target="_blank" rel="noreferrer" className="hover:text-pink-400 transition">
                        @{entry.instagram_handle}
                      </a>
                    </div>

                    <div className="col-span-3 font-mono font-semibold text-emerald-400">
                      ${entry.bid_amount}
                    </div>

                    <div className="col-span-3 flex justify-end">
                      <RowCheckoutForm handle={entry.instagram_handle} currentBid={entry.bid_amount} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-600 font-mono">
                No active bids yet. Be the first to claim #1.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}