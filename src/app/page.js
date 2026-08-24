'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsQR from 'jsqr';
import Navbar from '@/components/Navbar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CATEGORIES = [
  { name: 'All', icon: 'grid' },
  { name: 'Spirituality', icon: 'sparkle' },
  { name: 'Content Creator', icon: 'megaphone' },
  { name: 'Freelancer', icon: 'briefcase' },
  { name: 'Productivity', icon: 'bolt' },
  { name: 'Travel & Lifestyle', icon: 'plane' },
  { name: 'Fitness & Health', icon: 'heart' },
];

// Small inline icon set for category pills (no extra dependency)
function CategoryIcon({ type, className = 'w-4 h-4' }) {
  const common = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };
  switch (type) {
    case 'grid':
      return (
        <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
      );
    case 'sparkle':
      return (
        <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.5-6.5L15 8m-6 8l-2.5 2.5m11-2.5L15 15.5m-6-8L6.5 5" /></svg>
      );
    case 'megaphone':
      return (
        <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 8a4 4 0 010 8m3-11a8 8 0 010 14" /></svg>
      );
    case 'briefcase':
      return (
        <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" /></svg>
      );
    case 'bolt':
      return (
        <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" /></svg>
      );
    case 'plane':
      return (
        <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 20l1.5-5 6.5-6.5a1.5 1.5 0 00-2-2L10 13l-5-1.5-2 1.5 5 3 2 5z" /></svg>
      );
    case 'heart':
      return (
        <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.35-9.5-8.5C.5 8 2 4.5 5.5 4A5 5 0 0112 6.5 5 5 0 0118.5 4C22 4.5 23.5 8 21.5 11.5 19 15.65 12 20 12 20z" /></svg>
      );
    default:
      return null;
  }
}

// Deterministic gradient + initial "avatar" for handles without a profile image
const AVATAR_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-pink-500 to-purple-600',
  'from-purple-500 to-indigo-500',
  'from-emerald-400 to-cyan-500',
  'from-amber-400 to-orange-500',
  'from-fuchsia-500 to-pink-500',
  'from-sky-400 to-blue-600',
];
function avatarGradient(handle = '') {
  const sum = handle.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}
function HandleAvatar({ handle, size = 'w-12 h-12 text-lg' }) {
  return (
    <div className={`${size} shrink-0 rounded-2xl bg-gradient-to-br ${avatarGradient(handle)} flex items-center justify-center font-black text-white`}>
      {handle?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function Home() {
  const [bids, setBids] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Dynamic Total Visitors state (initialized to null/0 so it pulls directly from your backend cache)
  const [totalVisitors, setTotalVisitors] = useState(null);

  // Form states
  const [inputVal, setInputVal] = useState('');
  const [amount, setAmount] = useState('10');
  const [paying, setPaying] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // 1. Generate or retrieve unique session ID for this browser tab
    let sessionId = sessionStorage.getItem('bidgram_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2);
      sessionStorage.setItem('bidgram_session_id', sessionId);
    }

    const hasVisitedBefore = sessionStorage.getItem('render_server_cached_visitor');
    const isNewVisit = !hasVisitedBefore;
    if (isNewVisit) {
      sessionStorage.setItem('render_server_cached_visitor', 'true');
    }

    // 2. Track visit / fetch live counter from backend API cache
    async function trackVisitor() {
      try {
        const res = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            isNewVisit: isNewVisit && window.isFirstPing !== true
          }),
        });
        window.isFirstPing = true; // Prevents double-counting new visits on subsequent triggers
        const data = await res.json();
        if (data.totalVisitors !== undefined) {
          setTotalVisitors(data.totalVisitors);
        }
      } catch (err) {
        console.error('Error syncing visitor stats:', err);
      }
    }

    // 3. Fetch Bids Leaderboard from Supabase
    async function fetchBids() {
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .select('*')
        .order('bid_amount', { ascending: false })
        .limit(100);

      if (!bidError && bidData) setBids(bidData);
      setLoading(false);
    }

    fetchBids();
    trackVisitor();
  }, []);

  const filteredLeaderboardBids = bids.filter((bid) => {
    if (selectedCategory === 'All') return true;
    return bid.category?.toLowerCase() === selectedCategory.toLowerCase();
  }).slice(0, 100);

  const activeCategoryBids = bids.filter((bid) => {
    if (selectedCategory === 'All') return true;
    return bid.category?.toLowerCase() === selectedCategory.toLowerCase();
  }).sort((a, b) => b.bid_amount - a.bid_amount);

  const numericAmount = Number(amount) || 0;
  const currentTopBidForCategory = activeCategoryBids.length > 0 ? activeCategoryBids[0].bid_amount : 0;
  const isClaimingNumberOne = numericAmount > currentTopBidForCategory;
  const predictedRank = activeCategoryBids.filter(b => b.bid_amount > numericAmount).length + 1;

  const parseInstagramInput = (raw) => {
    let cleaned = raw.trim();
    if (cleaned.includes('instagram.com/') || cleaned.includes('instagr.am/')) {
      const parts = cleaned.split(/instagram\.com\/|instagr\.am\//);
      if (parts[1]) {
        cleaned = parts[1].split('/')[0].split('?')[0];
      }
    }
    cleaned = cleaned.replace(/^@/, '').replace(/\/$/, '');
    cleaned = cleaned.replace(/[^a-zA-Z0-9._]/g, '');
    return cleaned;
  };

  const cleanHandle = parseInstagramInput(inputVal);
  const isValidHandleFormat = /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningQR(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode && qrCode.data) {
          setInputVal(qrCode.data);
        } else {
          alert('Could not detect a valid Instagram QR code in this image.');
        }
        setScanningQR(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!cleanHandle || !isValidHandleFormat) {
      alert('Please enter a valid Instagram handle or profile URL.');
      return;
    }

    if (numericAmount <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    const targetCategoryForPayment = selectedCategory === 'All' ? 'Productivity' : selectedCategory;

    setPaying(true);
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Payment gateway failed to load.');
      setPaying(false);
      return;
    }

    try {
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, handle: cleanHandle, category: targetCategoryForPayment }),
      });

      const orderData = await orderRes.json();
      if (!orderData.orderId) {
        alert(orderData.error || 'Failed to create payment order.');
        setPaying(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'USD',
        name: 'BidGram',
        description: `Bid for @${cleanHandle} in ${targetCategoryForPayment}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          const verifyRes = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              handle: cleanHandle,
              amount: numericAmount,
              category: targetCategoryForPayment,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment successful! Your position is updated.');
            window.location.reload();
          } else {
            alert('Payment verification failed.');
          }
        },
        theme: { color: '#000000' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong during checkout.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070708] text-white selection:bg-pink-500 selection:text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* Dynamic Backend-Synced Total Visitors Tracker Badge */}
      <div className="flex justify-center pt-6 sm:pt-8 px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] sm:text-xs font-mono text-zinc-400 shadow-inner max-w-full">
          <span className="w-2 h-2 shrink-0 rounded-full bg-emerald-500"></span>
          <span className="text-zinc-300 font-semibold truncate">
            {totalVisitors !== null ? `${totalVisitors.toLocaleString()} visitors since launch` : 'Syncing visitors...'}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 md:pt-16 text-center space-y-6 sm:space-y-8 flex flex-col items-center">
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-mono font-bold">
          THE PAID DISCOVERY BOARD
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight leading-[1.1] md:leading-[1.05] bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent px-2">
          Bid For Attention
        </h1>

        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed px-2">
          A transparent leaderboard where Instagram handles compete by category.
        </p>

        {/* Live Trackable Header Box */}
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800/80 p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl space-y-5 text-left">
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono gap-2">
            <span className="text-pink-500 font-bold uppercase tracking-wider">LIVE AUCTION ({selectedCategory})</span>
            <span className="text-zinc-500 whitespace-nowrap">Secure Gateway ($ USD)</span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {isClaimingNumberOne ? `Claim #1 in ${selectedCategory} for` : `Claim #${predictedRank} in ${selectedCategory} for`}
              </h3>

              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl font-mono text-orange-400 font-bold text-lg shadow-inner self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAmount(Math.max(1, numericAmount - 1).toString())}
                  className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer shrink-0"
                >
                  -
                </button>
                <span>${numericAmount}</span>
                <button
                  type="button"
                  onClick={() => setAmount((numericAmount + 1).toString())}
                  className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-mono leading-relaxed">
              <span className="text-orange-400">Category base starts at $1.</span> Bidding ${numericAmount} places you at <span className="text-white font-bold">rank #{predictedRank}</span> in {selectedCategory} simultaneously.
            </p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-zinc-900">
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Instagram Profile / QR Code</label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-mono text-pink-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  {scanningQR ? 'Scanning QR...' : '📷 Upload Insta QR Code'}
                </button>
              </div>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 focus-within:border-pink-500 transition">
                <span className="text-zinc-500 mr-2 text-xs font-mono shrink-0">🔗</span>
                <input
                  type="text"
                  placeholder="Paste URL or handle"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full min-w-0 bg-transparent py-3.5 focus:outline-none text-white text-sm"
                  required
                />
              </div>
            </div>

            {cleanHandle && isValidHandleFormat && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-zinc-500 font-bold shrink-0">#{predictedRank}</span>
                  <div className="min-w-0">
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Verified Target Profile</span>
                    <a
                      href={`https://instagram.com/${cleanHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-pink-400 hover:underline text-sm flex items-center gap-1 mt-0.5 truncate"
                    >
                      @{cleanHandle} ↗
                    </a>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-zinc-500 block text-[10px] uppercase">Bid Value</span>
                  <span className="text-emerald-400 font-bold text-sm">${numericAmount}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="terms" defaultChecked className="rounded bg-zinc-900 border-zinc-800 text-pink-500 focus:ring-0 shrink-0" required />
              <label htmlFor="terms" className="text-xs text-zinc-400">
                I agree to the Terms of Service & Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={paying || !isValidHandleFormat}
              className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-95 transition shadow-lg shadow-pink-500/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{paying ? 'Initializing Gateway...' : `Place bid ($${numericAmount})`}</span>
              <span>↗</span>
            </button>
          </form>
        </div>

        <div className="w-full max-w-7xl pt-6">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">Select category to track & bid:</p>
          <div className="flex items-center justify-center sm:justify-center gap-2 sm:gap-2.5 flex-wrap  overflow-x-auto sm:overflow-visible">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono text-[11px] sm:text-xs transition duration-200 border whitespace-nowrap ${isActive
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-lg shadow-pink-500/20 font-bold'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                >
                  <CategoryIcon type={cat.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 mb-6">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🔥</span> Top 100 Leaderboard — <span className="text-pink-500">{selectedCategory}</span>
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Showing top {filteredLeaderboardBids.length} handles
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-600 font-mono bg-[#111114] border border-zinc-800/80 rounded-2xl">
            Loading live board...
          </div>
        ) : filteredLeaderboardBids.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 font-mono bg-[#111114] border border-zinc-800/80 rounded-2xl px-4">
            No active bids in this category yet. Be the first!
          </div>
        ) : (
          (() => {
            const top3 = filteredLeaderboardBids.slice(0, 3);
            const rest = filteredLeaderboardBids.slice(3);

            // Group ranks 4+ into chunks of ten (4-10, 11-20, 21-30, ...) so a
            // "TOP N" divider can be dropped between chunks.
            const restChunks = [];
            let currentChunk = [];
            rest.forEach((entry, j) => {
              const rank = j + 4;
              currentChunk.push({ entry, rank });
              if (rank % 10 === 0) {
                restChunks.push(currentChunk);
                currentChunk = [];
              }
            });
            if (currentChunk.length > 0) restChunks.push(currentChunk);

            const outbid = (entry) => {
              setAmount((entry.bid_amount + 1).toString());
              setSelectedCategory(entry.category || 'Productivity');
              window.scrollTo({ top: 400, behavior: 'smooth' });
            };

            const RANK_STYLES = {
              1: {
                border: 'border-orange-500/50',
                bg: 'bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent',
                badge: 'bg-gradient-to-br from-orange-500 to-pink-500 text-white',
                price: 'text-orange-400',
              },
              2: {
                border: 'border-zinc-700',
                bg: 'bg-zinc-900/40',
                badge: 'bg-zinc-800 text-zinc-200 border border-zinc-700',
                price: 'text-orange-400',
              },
              3: {
                border: 'border-zinc-800',
                bg: 'bg-zinc-900/20',
                badge: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
                price: 'text-orange-400',
              },
            };

            return (
              <div className="space-y-8">
                {/* Ranks #1-#3: standalone featured cards */}
                <div className="space-y-3">
                  {top3.map((entry, i) => {
                    const rank = i + 1;
                    const style = RANK_STYLES[rank];
                    const nextEntry = top3[i + 1];

                    return (
                      <div key={entry.id}>
                        <div className={`relative rounded-2xl border ${style.border} ${style.bg} p-4 sm:p-5 shadow-lg transition hover:border-pink-500/40`}>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center font-mono font-black text-xs sm:text-sm ${style.badge}`}>
                              {rank}
                            </div>

                            <HandleAvatar handle={entry.instagram_handle} size="w-11 h-11 sm:w-12 sm:h-12 text-base sm:text-lg" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <a
                                  href={`https://instagram.com/${entry.instagram_handle}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-white hover:text-pink-400 transition truncate text-sm sm:text-base"
                                >
                                  @{entry.instagram_handle} {rank === 1 && '👑'}
                                </a>
                                <span className={`shrink-0 font-mono font-black text-base sm:text-lg ${style.price}`}>
                                  ${entry.bid_amount.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-2 text-[11px] sm:text-xs font-mono text-zinc-500">
                                <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400">
                                  <CategoryIcon
                                    type={CATEGORIES.find((c) => c.name === (entry.category || 'Productivity'))?.icon || 'grid'}
                                    className="w-3 h-3"
                                  />
                                  {entry.category || 'Productivity'}
                                </span>
                                <button
                                  onClick={() => outbid(entry)}
                                  className="text-pink-400 hover:underline cursor-pointer"
                                >
                                  outbid this rank ↗
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Claim-this-rank banner between featured cards */}
                        {nextEntry && (
                          <div className="flex justify-center -my-2 relative z-10">
                            <button
                              onClick={() => outbid(nextEntry)}
                              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[11px] sm:text-xs font-mono font-bold shadow-lg shadow-pink-500/25 hover:opacity-90 transition cursor-pointer whitespace-nowrap"
                            >
                              claim this rank for ${(nextEntry.bid_amount + 1).toLocaleString()}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ranks #4+: compact list rows, grouped in chunks of ten */}
                {restChunks.map((chunk, ci) => {
                  const lastRank = chunk[chunk.length - 1].rank;
                  const isFinalChunk = ci === restChunks.length - 1;

                  return (
                    <div key={`chunk-${ci}`}>
                      <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl divide-y divide-zinc-900">
                        {chunk.map(({ entry, rank }) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-zinc-900/40 transition"
                          >
                            <div className="w-6 sm:w-8 shrink-0 font-mono font-bold text-zinc-500 text-sm text-center">
                              {rank}
                            </div>

                            <HandleAvatar handle={entry.instagram_handle} size="w-9 h-9 sm:w-10 sm:h-10 text-sm" />

                            <div className="min-w-0 flex-1">
                              <a
                                href={`https://instagram.com/${entry.instagram_handle}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-white hover:text-pink-400 transition truncate block text-sm"
                              >
                                @{entry.instagram_handle}
                              </a>
                              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] sm:text-[11px] font-mono text-zinc-500">
                                <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400">
                                  <CategoryIcon
                                    type={CATEGORIES.find((c) => c.name === (entry.category || 'Productivity'))?.icon || 'grid'}
                                    className="w-3 h-3"
                                  />
                                  {entry.category || 'Productivity'}
                                </span>
                                <button
                                  onClick={() => outbid(entry)}
                                  className="text-pink-400 hover:underline cursor-pointer"
                                >
                                  outbid ↗
                                </button>
                              </div>
                            </div>

                            <span className="shrink-0 font-mono font-bold text-orange-400 text-sm sm:text-base">
                              ${entry.bid_amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* "TOP N" divider between chunks */}
                      {!isFinalChunk && (
                        <div className="flex items-center gap-3 pt-6">
                          <span className="flex-1 h-px bg-zinc-800" />
                          <span className="px-4 py-1.5 rounded-full border border-pink-500/40 bg-pink-500/5 text-pink-400 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest whitespace-nowrap">
                            TOP {lastRank}
                          </span>
                          <span className="flex-1 h-px bg-zinc-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </main>
  );
}