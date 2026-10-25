import { describe, expect, it } from 'vitest';
import { buildPrompt, createLimiter, extractText, generateBrief, parseBrief, type BriefDeps } from '../lib/brief';

const ORIGIN = 'https://portfolio.example.dev';

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${ORIGIN}/api/brief`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-forwarded-for': '203.0.113.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const validBody = { agent: 'scout', facts: ['Frontend: React, TypeScript.'] };

function geminiReply(text: string): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
}

function deps(overrides: Partial<BriefDeps> = {}): BriefDeps {
  return {
    apiKey: 'test-key',
    fetchImpl: geminiReply('ok'),
    limiter: createLimiter(),
    now: () => 0,
    ...overrides,
  };
}

describe('generateBrief', () => {
  it('returns Gemini text for a same-origin request', async () => {
    let sentUrl = '';
    let sentInit: RequestInit | undefined;
    const result = await generateBrief(
      request(validBody),
      deps({
        fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
          sentUrl = String(url);
          sentInit = init;
          return geminiReply('Six years of production work.')(url, init);
        }) as typeof fetch,
      }),
    );
    expect(result).toEqual({ status: 200, body: { text: 'Six years of production work.' } });
    expect(sentUrl).toContain('generativelanguage.googleapis.com');
    expect((sentInit?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    expect(String(sentInit?.body)).not.toContain('test-key');
  });

  it('rejects a request from another origin without calling Gemini', async () => {
    let called = false;
    const result = await generateBrief(
      request(validBody, { origin: 'https://evil.example' }),
      deps({ fetchImpl: (async () => ((called = true), new Response('{}'))) as typeof fetch }),
    );
    expect(result.status).toBe(403);
    expect(called).toBe(false);
  });

  it('returns 503 when the key is not configured, without calling Gemini', async () => {
    const result = await generateBrief(request(validBody), deps({ apiKey: undefined }));
    expect(result.status).toBe(503);
  });

  it('rejects unknown agents, empty and oversized facts', async () => {
    const d = deps();
    expect((await generateBrief(request({ agent: 'hacker', facts: ['x'] }), d)).status).toBe(400);
    expect((await generateBrief(request({ agent: 'scout', facts: [] }), d)).status).toBe(400);
    expect((await generateBrief(request({ agent: 'scout', facts: ['x'.repeat(401)] }), d)).status).toBe(400);
    expect((await generateBrief(request({ agent: 'scout', facts: Array(31).fill('x') }), d)).status).toBe(400);
  });

  it('rejects invalid JSON and oversized bodies', async () => {
    const d = deps();
    expect((await generateBrief(request('{not json'), d)).status).toBe(400);
    expect((await generateBrief(request('x'.repeat(9000)), d)).status).toBe(413);
  });

  it('returns 502 when Gemini fails or returns no text', async () => {
    const failing = await generateBrief(
      request(validBody),
      deps({ fetchImpl: (async () => new Response('bad', { status: 500 })) as typeof fetch }),
    );
    expect(failing.status).toBe(502);
    const empty = await generateBrief(
      request(validBody),
      deps({ fetchImpl: (async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 })) as typeof fetch }),
    );
    expect(empty.status).toBe(502);
  });

  it('limits requests per client within the window', async () => {
    let clock = 0;
    const d = deps({ limiter: createLimiter(2, 1000), now: () => clock });
    expect((await generateBrief(request(validBody), d)).status).toBe(200);
    expect((await generateBrief(request(validBody), d)).status).toBe(200);
    expect((await generateBrief(request(validBody), d)).status).toBe(429);
    clock = 1500;
    expect((await generateBrief(request(validBody), d)).status).toBe(200);
  });
});

describe('Gemini busy responses', () => {
  it('retries a 503 and returns the answer when it recovers', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response('busy', { status: 503 });
      }
      return geminiReply('Recovered.')(String(calls), undefined);
    }) as typeof fetch;
    const sleeps: number[] = [];
    const result = await generateBrief(request(validBody), deps({ fetchImpl, sleep: async (ms) => void sleeps.push(ms) }));
    expect(result).toEqual({ status: 200, body: { text: 'Recovered.' } });
    expect(calls).toBe(2);
    expect(sleeps).toEqual([400]);
  });

  it('gives up after the retries and reports a 502', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('busy', { status: 503 });
    }) as typeof fetch;
    const result = await generateBrief(request(validBody), deps({ fetchImpl, sleep: async () => undefined }));
    expect(result.status).toBe(502);
    expect(calls).toBe(6);
  });

  it('does not retry a 429, because retrying spends more of the same quota', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('quota', { status: 429 });
    }) as typeof fetch;
    const result = await generateBrief(request(validBody), deps({ fetchImpl, sleep: async () => undefined }));
    expect(result.status).toBe(502);
    expect(calls).toBe(1);
  });

  it('does not retry a 404 because the model is wrong, not busy', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('gone', { status: 404 });
    }) as typeof fetch;
    const result = await generateBrief(request(validBody), deps({ fetchImpl, sleep: async () => undefined }));
    expect(result.status).toBe(502);
    expect(calls).toBe(1);
  });
});

describe('model fallback', () => {
  it('switches to the fallback model when the main model stays busy', async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request) => {
      urls.push(String(url));
      if (String(url).includes('gemini-3.1-flash-lite')) {
        return new Response('busy', { status: 503 });
      }
      return geminiReply('From the fallback.')(url as string, undefined);
    }) as typeof fetch;
    const result = await generateBrief(request(validBody), deps({ fetchImpl, sleep: async () => undefined }));
    expect(result).toEqual({ status: 200, body: { text: 'From the fallback.' } });
    expect(urls.at(-1)).toContain('gemini-3-flash:generateContent');
  });
});

describe('parseBrief and prompts', () => {
  it('keeps only the agent and trimmed facts', () => {
    expect(parseBrief({ agent: 'builder', facts: ['  one  '], extra: 'ignored' })).toEqual({ agent: 'builder', facts: ['one'] });
  });

  it('lists the facts in the prompt and never includes the key', () => {
    const prompt = buildPrompt({ agent: 'courier', facts: ['Requests go by email.'] });
    expect(prompt).toContain('- Requests go by email.');
    expect(prompt).not.toContain('test-key');
  });

  it('extracts text from Gemini parts and handles missing data', () => {
    expect(extractText({ candidates: [{ content: { parts: [{ text: 'a ' }, { text: 'b' }] } }] })).toBe('a b');
    expect(extractText({})).toBe('');
  });
});
