import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { handle, amount } = await req.json();

    // Convert USD to INR (e.g., rate ~95.8) and then to paise (* 100)
    const USD_TO_INR_RATE = 95.8;
    const amountInPaise = Math.round(Number(amount) * USD_TO_INR_RATE * 100);

    const options = {
      amount: amountInPaise, // Passes the correct converted paise value to Razorpay
      currency: 'INR',       // Processed natively via INR to prevent gateway currency mismatches
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}