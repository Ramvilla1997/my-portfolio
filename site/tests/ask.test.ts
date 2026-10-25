import { describe, expect, it, vi } from 'vitest';
import { createLimiter } from '../lib/limiter';
import { generateAnswer, parseAsk } from '../lib/ask';

const ORIGIN = 'https://portfolio.example.dev';

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${ORIGIN}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const valid = { question: 'Where did you work?', context: ['Senior engineer at Ontario Health.'] };

function reply(text: string): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 })) as typeof fetch;
}

const deps = (overrides = {}) => ({
  groqKey: 'gsk-test',
  apiKey: undefined,
  fetchImpl: reply('Ram worked at Ontario Health.'),
  limiter: createLimiter(),
  now: () => 0,
  ...overrides,
});

describe('generateAnswer', () => {
  it('answers from the supplied passages using Groq', async () => {
    const result = await generateAnswer(request(valid), deps());
    expect(result).toEqual({ status: 200, body: { text: 'Ram worked at Ontario Health.' } });
  });

  it('sends the passages and the question to the model and never the key', async () => {
    const fetchImpl = vi.fn(reply('ok'));
    await generateAnswer(request(valid), deps({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    const body = String(fetchImpl.mock.calls[0]?.[1]?.body);
    expect(body).toContain('Ontario Health');
    expect(body).toContain('Where did you work?');
    expect(body).not.toContain('gsk-test');
  });

  it('rejects another origin before calling any model', async () => {
    const fetchImpl = vi.fn(reply('x'));
    const result = await generateAnswer(request(valid, { origin: 'https://evil.example' }), deps({ fetchImpl: fetchImpl as unknown as typeof fetch }));
    expect(result.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('answers 503 with no keys, and 502 when no model responds', async () => {
    expect((await generateAnswer(request(valid), deps({ groqKey: undefined }))).status).toBe(503);
    const failing = (async () => new Response('down', { status: 400 })) as typeof fetch;
    expect((await generateAnswer(request(valid), deps({ fetchImpl: failing }))).status).toBe(502);
  });

  it('reports bad input as 400 even when no key is configured', async () => {
    const shortQuestion = await generateAnswer(request({ question: 'hi', context: ['x'] }), deps({ groqKey: undefined }));
    expect(shortQuestion.status).toBe(400);
    const badJson = await generateAnswer(request('{not json'), deps({ groqKey: undefined }));
    expect(badJson.status).toBe(400);
  });

  it('rejects questions that are too short, too long or missing passages', () => {
    expect(() => parseAsk({ question: 'hi', context: ['x'] })).toThrow();
    expect(() => parseAsk({ question: 'a'.repeat(201), context: ['x'] })).toThrow();
    expect(() => parseAsk({ question: 'valid question', context: [] })).toThrow();
    expect(() => parseAsk({ question: 'valid question', context: ['x'.repeat(601)] })).toThrow();
  });
});
