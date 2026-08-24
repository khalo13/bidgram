'use client';
import { useState } from 'react';

export default function BidModal() {
  const [handle, setHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!handle || !amount || Number(amount) <= 0) {
      alert('Please enter a valid Instagram handle and bid amount.');
      return;
    }

    setLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), handle: handle.trim() }),
      });

      const orderData = await orderRes.json();
      if (!orderData.orderId) {
        alert(orderData.error || 'Failed to create payment order.');
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BidGram',
        description: `Outbid / Claim spot for @${handle}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          const verifyRes = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment successful! Your spot is secured.');
            window.location.reload();
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: handle,
        },
        theme: {
          color: '#000000',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong during checkout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-md w-full mx-auto text-white shadow-xl">
      <h2 className="text-xl font-bold mb-4 tracking-tight">Claim Your Spot</h2>
      <form onSubmit={handleCheckout} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
            Instagram Handle
          </label>
          <div className="flex items-center bg-neutral-800 rounded-xl px-3 border border-neutral-700 focus-within:border-white transition">
            <span className="text-neutral-400 mr-1">@</span>
            <input
              type="text"
              placeholder="yourhandle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full bg-transparent py-3 focus:outline-none text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
            Bid Amount (₹ / Equivalent)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition text-white"
              required
              min="1"
            />
            <button
              type="button"
              onClick={() => {
                const current = Number(amount) || 0;
                setAmount((current + 1).toString());
              }}
              className="px-4 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded-xl font-mono text-xs font-bold transition shrink-0 cursor-pointer"
              title="Increase amount by minimum 1"
            >
              + $1 Min
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-neutral-200 transition duration-200 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Initializing Checkout...' : `Pay ₹${amount || 0} & Outbid`}
        </button>
      </form>
    </div>
  );
}