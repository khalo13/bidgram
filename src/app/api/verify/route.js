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

    // 2. Signature is valid! Fetch existing user bid first to accumulate amounts
    const { data: existingUser, error: fetchError } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('instagram_handle', handle)
      .maybeSingle(); // Use maybeSingle so it doesn't throw an error if the handle doesn't exist yet

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ success: false, error: 'Database check failed' }, { status: 500 });
    }

    // Calculate final cumulative amount
    let finalAmount = Number(amount);
    if (existingUser) {
      finalAmount = Number(existingUser.bid_amount) + Number(amount);
    }

    // 3. Upsert the new cumulative total into Supabase
    const { error: dbError } = await supabase
      .from('bids')
      .upsert(
        { 
          instagram_handle: handle, 
          bid_amount: finalAmount, 
          category: category,
          updated_at: new Date()
        },
        { onConflict: 'instagram_handle' }
      );

    if (dbError) {
      console.error('Supabase update error:', dbError);
      return NextResponse.json({ success: false, error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, newTotal: finalAmount }, { status: 200 });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}