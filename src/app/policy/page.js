'use client';
import Navbar from '@/components/Navbar';

export default function PolicyPage() {
  return (
    <main className="min-h-screen bg-[#070708] text-white selection:bg-pink-500 selection:text-white font-sans">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-24 space-y-12">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Privacy & Terms
          </h1>
          <p className="text-zinc-400 text-sm font-mono">
            Last updated: August 2026
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/80 w-full" />

        {/* Content Sections */}
        <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
          
          <section className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">1. Overview</h3>
            <p className="text-zinc-400">
              Welcome to BidGram. By accessing or using our platform, you agree to comply with and be bound by these terms. If you do not agree, please do not use our live bidding platform.
            </p>
          </section>

          <section className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">2. Bidding & Payments</h3>
            <ul className="space-y-2 text-zinc-400 list-disc list-inside">
              <li>All bids submitted are final once processed securely through our payment gateway.</li>
              <li>Placing a higher bid secures your rank position on the leaderboard within your chosen category in real time.</li>
              <li>Fees paid for placement are non-refundable once the transaction is completed and the rank is assigned.</li>
            </ul>
          </section>

          <section className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">3. Instagram Handles & Conduct</h3>
            <p className="text-zinc-400">
              You must submit valid and legitimate Instagram profile handles or URLs. We reserve the right to remove any handles that violate community standards, promote malicious content, or impersonate third parties without notice.
            </p>
          </section>

          <section className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-6 md:p-8 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold tracking-tight text-white">4. Data & Privacy</h3>
            <p className="text-zinc-400">
              We collect minimal information necessary to process payments and display your public handle on the leaderboard. We do not sell or share your personal data with third-party advertisers.
            </p>
          </section>

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