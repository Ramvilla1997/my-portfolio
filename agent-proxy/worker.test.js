import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, createLimiter, extractText, parseBrief, buildPrompt, AGENTS } from './worker.js';

const ORIGIN = 'https://ramvilla1997.github.io';
const env = { ALLOWED_ORIGIN: ORIGIN, GEMINI_API_KEY: 'test-key' };

function brief(body, headers = {}) {
  return new Request('https://agents.example.dev/brief', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const validBody = { agent: 'scout', facts: ['Frontend: React, TypeScript.'] };

function geminiReply(text) {
  return async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
}

test('returns Gemini text for a valid request from the allowed origin', async () => {
  let sent;
  const handle = createHandler({
    fetchImpl: async (url, init) => {
      sent = { url, init };
      return geminiReply('Six years of production work.')(url, init);
    },
  });
  const response = await handle(brief(validBody), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Six years of production work.' });
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(sent.init.headers['x-goog-api-key'], 'test-key');
  assert.match(sent.url, /generativelanguage\.googleapis\.com/);
  assert.ok(!sent.init.body.includes('test-key'), 'the key must not be sent in the prompt body');
});

test('rejects other origins without calling Gemini', async () => {
  let called = false;
  const handle = createHandler({ fetchImpl: async () => ((called = true), new Response('{}')) });
  const response = await handle(brief(validBody, { origin: 'https://evil.example' }), env);
  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test('answers preflight only for the allowed origin', async () => {
  const handle = createHandler({});
  const ok = await handle(new Request('https://agents.example.dev/brief', { method: 'OPTIONS', headers: { origin: ORIGIN } }), env);
  assert.equal(ok.status, 204);
  const denied = await handle(new Request('https://agents.example.dev/brief', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), env);
  assert.equal(denied.status, 403);
});

test('returns 503 when the key is not configured, without calling Gemini', async () => {
  const handle = createHandler({ fetchImpl: async () => assert.fail('should not call Gemini') });
  const response = await handle(brief(validBody), { ALLOWED_ORIGIN: ORIGIN });
  assert.equal(response.status, 503);
});

test('rejects unknown agents, empty facts and oversized facts', async () => {
  const handle = createHandler({ fetchImpl: geminiReply('x') });
  assert.equal((await handle(brief({ agent: 'hacker', facts: ['x'] }), env)).status, 400);
  assert.equal((await handle(brief({ agent: 'scout', facts: [] }), env)).status, 400);
  assert.equal((await handle(brief({ agent: 'scout', facts: ['x'.repeat(401)] }), env)).status, 400);
  assert.equal((await handle(brief({ agent: 'scout', facts: Array(31).fill('x') }), env)).status, 400);
});

test('rejects invalid JSON and oversized bodies', async () => {
  const handle = createHandler({ fetchImpl: geminiReply('x') });
  assert.equal((await handle(brief('{not json'), env)).status, 400);
  const big = brief('x'.repeat(9000));
  assert.equal((await handle(big, env)).status, 413);
});

test('returns 502 when Gemini fails or returns no text', async () => {
  const failing = createHandler({ fetchImpl: async () => new Response('bad', { status: 500 }) });
  assert.equal((await failing(brief(validBody), env)).status, 502);
  const empty = createHandler({ fetchImpl: async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }) });
  assert.equal((await empty(brief(validBody), env)).status, 502);
});

test('limits requests per client within the window', async () => {
  let clock = 0;
  const handle = createHandler({ fetchImpl: geminiReply('ok'), limiter: createLimiter(2, 1000), now: () => clock });
  assert.equal((await handle(brief(validBody), env)).status, 200);
  assert.equal((await handle(brief(validBody), env)).status, 200);
  assert.equal((await handle(brief(validBody), env)).status, 429);
  clock = 1500;
  assert.equal((await handle(brief(validBody), env)).status, 200);
});

test('parseBrief keeps only the agent and trimmed facts', () => {
  assert.deepEqual(parseBrief({ agent: 'builder', facts: ['  one  '], extra: 'ignored' }), { agent: 'builder', facts: ['one'] });
  assert.deepEqual([...AGENTS], ['scout', 'archivist', 'builder', 'courier']);
});

test('buildPrompt lists facts and never includes the key', () => {
  const prompt = buildPrompt({ agent: 'courier', facts: ['Requests go by email.'] });
  assert.match(prompt, /- Requests go by email\./);
  assert.ok(!prompt.includes('test-key'));
});

test('extractText joins parts and handles missing data', () => {
  assert.equal(extractText({ candidates: [{ content: { parts: [{ text: 'a ' }, { text: 'b' }] } }] }), 'a b');
  assert.equal(extractText({}), '');
});
