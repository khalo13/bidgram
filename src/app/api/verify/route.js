import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend writes securely
);

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      handle,
      amount,
      category
    } = await request.json();

    // 1. Verify the Razorpay cryptographic signature to ensure it's authentic
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Signature is valid! Now update/insert the bid in Supabase
    // Using upsert ensures if the handle already exists, it updates their bid and category.
    const { error: dbError } = await supabase
      .from('bids')
      .upsert(
        { 
          instagram_handle: handle, 
          bid_amount: Number(amount), 
          category: category,
          updated_at: new Date()
        },
        { onConflict: 'instagram_handle' } // Adjust based on your table's unique constraint column
      );

    if (dbError) {
      console.error('Supabase update error:', dbError);
      return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}