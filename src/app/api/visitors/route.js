import { NextResponse } from 'next/server';

// In-memory cache fallback (Note: If deploying on serverless platforms like Vercel, 
// use a fast DB or Redis like Supabase/Upstash to persist the counter across cold starts)
let totalCount = 1000; // Starting baseline or 0
const activeSessions = new Set();

export async function POST(request) {
  try {
    const { sessionId, isNewVisit } = await request.json();

    if (isNewVisit && sessionId && !activeSessions.has(sessionId)) {
      activeSessions.add(sessionId);
      totalCount += 1;
    }

    return NextResponse.json({ totalVisitors: totalCount }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ totalVisitors: totalCount }, { status: 200 });
  }
}