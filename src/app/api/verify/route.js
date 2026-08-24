import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, handle, amount } = await req.json();

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    const cleanHandle = handle.trim().replace(/^@/, '');
    const paidAmount = Number(amount);

    const { data: existingUser } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('instagram_handle', cleanHandle)
      .single();

    if (existingUser) {
      const newTotal = existingUser.bid_amount + paidAmount;
      await supabase
        .from('bids')
        .update({ bid_amount: newTotal, updated_at: new Date().toISOString() })
        .eq('instagram_handle', cleanHandle);
    } else {
      await supabase.from('bids').insert({
        instagram_handle: cleanHandle,
        bid_amount: paidAmount,
        updated_at: new Date().toISOString(),
      });
    }

    // Keep table strictly capped at top 100 entries
    const { data: allBids } = await supabase
      .from('bids')
      .select('id')
      .order('bid_amount', { ascending: false })
      .order('updated_at', { ascending: true });

    if (allBids && allBids.length > 100) {
      const excessIds = allBids.slice(100).map((b) => b.id);
      await supabase.from('bids').delete().in('id', excessIds);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}