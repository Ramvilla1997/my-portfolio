import { NextResponse } from 'next/server';
import { createLimiter, generateBrief } from '../../../lib/brief';

export const dynamic = 'force-dynamic';

const limiter = createLimiter();

/* The Gemini key is a server-only environment variable. It is never bundled into the browser code. */
export async function POST(request: Request) {
  const result = await generateBrief(request, {
    apiKey: process.env.GEMINI_API_KEY,
    fetchImpl: fetch,
    limiter,
    now: () => Date.now(),
    model: process.env.GEMINI_MODEL,
  });
  return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}
