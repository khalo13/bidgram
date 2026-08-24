import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, handle, category } = await request.json();

    // 1. Create Razorpay Order
    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (e.g., cents/paise)
      currency: 'USD',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // 2. Instead of standard modal keys, construct or generate a hosted checkout link 
    // Razorpay standard checkout hosted URL format or using Payment Links API:
    // For direct redirect, many developers create a Payment Link via Razorpay API:
    const paymentLink = await razorpay.paymentLink.create({
      amount: options.amount,
      currency: 'USD',
      description: `Bid for @${handle} in ${category}`,
      customer: {
        name: `@${handle}`,
      },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify?handle=${handle}&amount=${amount}&category=${category}`,
      callback_method: 'get',
    });

    return NextResponse.json({ url: paymentLink.short_url }, { status: 200 });
  } catch (err) {
    console.error('Razorpay Error:', err);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}