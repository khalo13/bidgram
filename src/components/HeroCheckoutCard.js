'use client';
import { useState } from 'react';

export default function HeroCheckoutCard() {
  const [bidAmount, setBidAmount] = useState(5);
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIncrement = () => setBidAmount(prev => prev + 5);
  const handleDecrement = () => setBidAmount(prev => (prev > 1 ? prev - 5 : 1));

  const startRazorpayPayment = async (e) => {
    e.preventDefault();
    if (!handle) return alert('Please enter your Instagram handle');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, amount: bidAmount }),
      });
      const data = await res.json();

      if (!data.orderId) throw Error('Server error creating order');

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'BidInsta',
        description: `Instagram Rank Bid for @${handle}`,
        order_id: data.orderId,
        handler: async function (response) {
          const verifyRes = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              handle: handle.trim().replace(/^@/, ''),
              amount: bidAmount,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            window.location.reload();
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: { name: handle },
        theme: { color: '#ec4899' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Payment initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111114] border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative">
      <div className="flex justify-between items-center mb-6">
        <span className="text-xs font-mono font-bold tracking-widest text-pink-500 uppercase">
          Live Auction
        </span>
        <span className="text-xs text-zinc-500 font-mono">Instant position update</span>
      </div>

      <div className="text-center space-y-4 mb-6">
        <h3 className="text-lg font-bold text-zinc-200">Set your total bid</h3>
        
        <div className="inline-flex items-center justify-between bg-[#18181c] border border-zinc-800 rounded-2xl px-6 py-3 w-full max-w-xs mx-auto">
          <button type="button" onClick={handleDecrement} className="text-zinc-400 hover:text-white text-xl font-mono transition">−</button>
          <span className="text-3xl font-black font-mono text-white">${bidAmount}</span>
          <button type="button" onClick={handleIncrement} className="text-zinc-400 hover:text-white text-xl font-mono transition">+</button>
        </div>

        <p className="text-xs text-zinc-500">
          Enter your total bid. If you are already listed, you only pay the incremental difference to overtake positions.
        </p>
      </div>

      <form onSubmit={startRazorpayPayment} className="space-y-4">
        <input 
          type="text" 
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@ your Instagram handle" 
          required 
          className="w-full bg-[#18181c] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition font-mono"
        />

        <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
          <input type="checkbox" required className="accent-pink-500 rounded" />
          <span>I agree to the Terms of Service & Privacy Policy</span>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 via-pink-600 to-purple-600 hover:opacity-90 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-pink-500/20 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Processing...' : `Place bid ($${bidAmount})`}</span>
          <span>↗</span>
        </button>
      </form>
    </div>
  );
}