'use client';
import { useState } from 'react';

export default function RowCheckoutForm({ handle: targetHandle, currentBid }) {
  const [boostAmount, setBoostAmount] = useState(currentBid + 5);

  const handleRowPayment = async (e) => {
    e.preventDefault();
    const handleInput = prompt(`Enter your Instagram handle to outbid @${targetHandle} with $${boostAmount}:`);
    if (!handleInput) return;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handleInput, amount: boostAmount }),
      });
      const data = await res.json();

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'BidInsta',
        description: `Outbidding position with $${boostAmount}`,
        order_id: data.orderId,
        handler: async function (response) {
          await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              handle: handleInput.trim().replace(/^@/, ''),
              amount: boostAmount,
            }),
          });
          window.location.reload();
        },
        theme: { color: '#ec4899' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Error triggering checkout');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input 
        type="number" 
        value={boostAmount} 
        onChange={(e) => setBoostAmount(Number(e.target.value))}
        className="w-16 bg-black border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-center text-emerald-400 focus:outline-none focus:border-pink-500"
      />
      <button 
        onClick={handleRowPayment}
        className="text-xs bg-zinc-800 hover:bg-pink-600 hover:text-white text-zinc-300 px-3 py-1.5 rounded-lg font-semibold transition border border-zinc-700 cursor-pointer"
      >
        Grab Spot
      </button>
    </div>
  );
}