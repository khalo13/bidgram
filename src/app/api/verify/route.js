import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const bodyData = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      handle,
      amount,
      category,
    } = bodyData;

    console.log("Verification payload received:", { razorpay_order_id, razorpay_payment_id, handle, amount, category });

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("CRITICAL: RAZORPAY_KEY_SECRET is missing from environment variables!");
      return NextResponse.json({ success: false, error: 'Server secret key missing' }, { status: 500 });
    }

    // 1. Verify Razorpay Signature securely
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error("Signature mismatch! Expected:", generated_signature, "Got:", razorpay_signature);
      return NextResponse.json({ success: false, error: 'Invalid signature mismatch' }, { status: 400 });
    }

    // 2. Initialize Supabase lazily
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3. Insert data into Supabase
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
    console.error('Verification catch error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}