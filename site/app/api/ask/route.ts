import { NextResponse } from 'next/server';
import { generateAnswer } from '../../../lib/ask';
import { createLimiter } from '../../../lib/brief';

export const dynamic = 'force-dynamic';

const limiter = createLimiter(30, 60_000);

/* Answers a visitor's question from passages the page supplies. Keys are read on the server only. */
export async function POST(request: Request) {
  const result = await generateAnswer(request, {
    apiKey: process.env.GEMINI_API_KEY,
    groqKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL,
    model: process.env.GEMINI_MODEL,
    fetchImpl: fetch,
    limiter,
    now: () => Date.now(),
  });
  return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}
