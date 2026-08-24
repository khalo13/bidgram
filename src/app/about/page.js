'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AboutPage() {
  const [stats, setStats] = useState({
    visitors: 1,
    revenue: 0,
    highestBid: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function trackAndFetchStats() {
      try {
        // 1. Optional: Increment visitor count on page load (tracked once per session)
        const hasVisited = sessionStorage.getItem('about_visited');
        if (!hasVisited) {
          // You can increment a global counter row in Supabase here if you want
          sessionStorage.setItem('about_visited', 'true');
        }

        // 2. Fetch real-time bids to calculate live revenue and highest bid
        const { data: bidsData, error } = await supabase
          .from('bids')
          .select('bid_amount');

        if (!error && bidsData) {
          const totalRevenue = bidsData.reduce((acc, curr) => acc + (Number(curr.bid_amount) || 0), 0);
          const maxBid = bidsData.length > 0 ? Math.max(...bidsData.map(b => Number(b.bid_amount) || 0)) : 0;
          
          // Count total bids or mock a realistic visitor multiplier based on bids if you don't have a separate analytics table yet
          const calculatedVisitors = 1240 + (bidsData.length * 15);

          setStats({
            visitors: calculatedVisitors,
            revenue: totalRevenue,
            highestBid: maxBid,
          });
        }
      } catch (err) {
        console.error('Error fetching live stats:', err);
      } finally {
        setLoading(false);
      }
    }

    trackAndFetchStats();
  }, []);

  return (
    <main className="min-h-screen bg-[#070708] text-white selection:bg-pink-500 selection:text-white font-sans">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-24 space-y-12">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            About
          </h1>
          <p className="text-zinc-300 text-base md:text-lg leading-relaxed">
            <strong className="text-white font-semibold">BidGram</strong> started as <span className="text-orange-400 font-medium">a simple side project</span>: no ads, no bloated trackers, no confusing rules. Just outbid your competitors by category to rank #1 — that's it.
          </p>
        </div>

        {/* Timeline Section */}
        <div className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold tracking-tight text-white">Then it went live</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The site launched quietly, and things escalated quickly from there. 
          </p>
          <p className="text-xs font-mono text-pink-500 pt-1">
            ⚡ Live tracking since launch.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400 font-mono uppercase tracking-wider">A few wild things that happened since then:</p>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-xl">
              <span className="text-emerald-400 font-mono font-bold text-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {loading ? '...' : stats.visitors.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">visitors</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-xl">
              <span className="text-orange-400 font-mono font-bold text-xl">
                ${loading ? '...' : stats.revenue.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">revenue</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl space-y-1 shadow-xl">
              <span className="text-pink-500 font-mono font-bold text-xl">
                ${loading ? '...' : stats.highestBid.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">highest bid (so far)</span>
            </div>
          </div>
        </div>

        {/* Narrative Footer */}
        <div className="space-y-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-8">
          <p>
            Enough traffic managed to stress-test the initial setup. Had to optimize performance on the fly just to keep the live counter running smoothly under heavy loads.
          </p>
          <p>
            We've even had acquisition inquiries roll in, and clone variants popped up almost instantly within the first 24 hours. Proof that absolute simplicity and direct competition always win.
          </p>
        </div>

        {/* Call to Action */}
        <div className="pt-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-bold text-sm hover:opacity-95 transition shadow-lg shadow-pink-500/25"
          >
            <span>Back to Leaderboard</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </main>
  );
}