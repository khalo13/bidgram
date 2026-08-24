import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { handle, amount } = await req.json();

    const options = {
      amount: amount * 100, // Razorpay processes in subunit (paisa/cents)
      currency: 'INR', // Switch to 'USD' if your Razorpay account is international
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}