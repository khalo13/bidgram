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
  'All',
  'Spirituality',
  'Content Creator',
  'Freelancer',
  'Productivity',
];

export default function Home() {
  const [bids, setBids] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Form states
  const [inputVal, setInputVal] = useState('');
  const [amount, setAmount] = useState('10');
  const [paying, setPaying] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchBids() {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .order('bid_amount', { ascending: false })
        .limit(100);

      if (!error && data) setBids(data);
      setLoading(false);
    }
    fetchBids();
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

  // --- SMART PARSER: Handles Raw Handles, Full URLs, or QR Code text ---
  const parseInstagramInput = (raw) => {
    let cleaned = raw.trim();
    
    // If it's a full URL (e.g. instagram.com/username or instagr.am/username)
    if (cleaned.includes('instagram.com/') || cleaned.includes('instagr.am/')) {
      const parts = cleaned.split(/instagram\.com\/|instagr\.am\//);
      if (parts[1]) {
        cleaned = parts[1].split('/')[0].split('?')[0];
      }
    }

    // Strip leading @ or trailing slashes
    cleaned = cleaned.replace(/^@/, '').replace(/\/$/, '');
    // Keep only valid handle characters
    cleaned = cleaned.replace(/[^a-zA-Z0-9._]/g, '');
    return cleaned;
  };

  const cleanHandle = parseInstagramInput(inputVal);
  const isValidHandleFormat = /^[a-zA-Z0-9._]{1,30}$/.test(cleanHandle);

  // --- QR CODE IMAGE READER HANDLER ---
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
          setInputVal(qrCode.data); // Automatically fills input with scanned link/handle
        } else {
          alert('Could not detect a valid Instagram QR code in this image. Please try another image or paste your URL.');
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
    <main className="min-h-screen bg-[#070708] text-white selection:bg-pink-500 selection:text-white font-sans">
      <Navbar />

      <div className="flex justify-center pt-8 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-white font-semibold">608 online</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400">1,294,383 visitors since launch</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12 md:pt-16 text-center space-y-8 flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono font-bold">
          THE PAID DISCOVERY BOARD
        </span>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          Bid For Attention
        </h1>

        <p className="text-zinc-400 text-sm md:text-base max-w-xl leading-relaxed">
          A transparent leaderboard where Instagram handles compete by category.
        </p>

        {/* Live Trackable Header Box */}
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 rounded-xl shadow-2xl space-y-5 text-left">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-pink-500 font-bold uppercase tracking-wider">LIVE AUCTION ({selectedCategory})</span>
            <span className="text-zinc-500">Secure Gateway ($ USD)</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {isClaimingNumberOne ? `Claim #1 in ${selectedCategory} for` : `Claim #${predictedRank} in ${selectedCategory} for`}
              </h3>

              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl font-mono text-orange-400 font-bold text-lg shadow-inner">
                <button
                  type="button"
                  onClick={() => setAmount(Math.max(1, numericAmount - 5).toString())}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  -
                </button>
                <span>${numericAmount}</span>
                <button
                  type="button"
                  onClick={() => setAmount((numericAmount + 5).toString())}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  +
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-mono">
              <span className="text-orange-400">Category base starts at $1.</span> Bidding ${numericAmount} places you at <span className="text-white font-bold">rank #{predictedRank}</span> in {selectedCategory} simultaneously.
            </p>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-zinc-900">
            {/* Instagram Profile URL or QR Code Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Instagram Profile / QR Code</label>
                
                {/* Hidden File Input for QR Code Upload */}
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
                  className="text-[11px] font-mono text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {scanningQR ? 'Scanning QR...' : '📷 Upload Insta QR Code'}
                </button>
              </div>

              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 focus-within:border-pink-500 transition">
                <span className="text-zinc-500 mr-2 text-xs font-mono">🔗</span>
                <input
                  type="text"
                  placeholder="Paste URL (instagram.com/yourhandle) or handle"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full bg-transparent py-3.5 focus:outline-none text-white text-sm"
                  required
                />
              </div>
            </div>

            {/* Live Position Card Preview */}
            {cleanHandle && isValidHandleFormat && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs font-mono animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 font-bold">#{predictedRank}</span>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Verified Target Profile</span>
                    <a 
                      href={`https://instagram.com/${cleanHandle}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="font-bold text-pink-400 hover:underline text-sm flex items-center gap-1 mt-0.5"
                    >
                      @{cleanHandle} ↗
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[10px] uppercase">Bid Value</span>
                  <span className="text-emerald-400 font-bold text-sm">${numericAmount}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="terms" defaultChecked className="rounded bg-zinc-900 border-zinc-800 text-pink-500 focus:ring-0" required />
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

        <div className="w-full max-w-2xl pt-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">Select category to track & bid:</p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl font-mono text-xs transition duration-200 border ${isActive
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-lg shadow-pink-500/20 font-bold'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                >
                  {cat === 'All' ? '🔥 All' : cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard Table Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-20 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🔥</span> Top 100 Leaderboard — <span className="text-pink-500">{selectedCategory}</span>
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Showing top {filteredLeaderboardBids.length} handles
          </span>
        </div>

        <div className="bg-[#111114] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 px-6 py-4 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Instagram Handle</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-2">Current Bid</div>
            <div className="col-span-2 text-right">Outbid</div>
          </div>

          <div className="divide-y divide-zinc-900">
            {loading ? (
              <div className="text-center py-12 text-zinc-600 font-mono">Loading live board...</div>
            ) : filteredLeaderboardBids.length > 0 ? (
              filteredLeaderboardBids.map((entry, index) => {
                const rank = index + 1;

                return (
                  <div key={entry.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-zinc-900/40 transition text-sm">
                    <div className="col-span-1 font-mono font-bold text-zinc-400">
                      #{rank} {rank === 1 && '👑'}
                    </div>

                    <div className="col-span-4 font-bold flex items-center gap-2">
                      <a href={`https://instagram.com/${entry.instagram_handle}`} target="_blank" rel="noreferrer" className="hover:text-pink-400 transition">
                        @{entry.instagram_handle}
                      </a>
                    </div>

                    <div className="col-span-3 text-xs font-mono text-zinc-400">
                      <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                        {entry.category || 'Productivity'}
                      </span>
                    </div>

                    <div className="col-span-2 font-mono font-semibold text-emerald-400">
                      ${entry.bid_amount}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => {
                          setAmount((entry.bid_amount + 5).toString());
                          setSelectedCategory(entry.category || 'Productivity');
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs px-3.5 py-2 rounded-xl transition"
                      >
                        Outbid ↗
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-zinc-600 font-mono">
                No active bids in this category yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}