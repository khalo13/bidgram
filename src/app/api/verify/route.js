import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      handle,
      amount,
      category,
    } = await request.json();

    // 1. Verify Razorpay Signature securely
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Insert only the core data into your lean Supabase table
    const { data, error } = await supabase.from('bids').insert([
      {
        instagram_handle: handle,
        bid_amount: Number(amount),
        category: category,
      },
    ]);

    if (error) {
      console.error('Supabase insertion error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}