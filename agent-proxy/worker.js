/* Cloudflare Worker that asks Gemini for a short briefing for one portfolio agent.
   The Gemini key lives in the Worker as a secret (GEMINI_API_KEY) and is never sent to the browser.
   The model only sees the facts the site sends for that agent, and the system prompt forbids inventing more. */

export const AGENTS = Object.freeze(['scout', 'archivist', 'builder', 'courier']);
export const MAX_BODY_BYTES = 8192;
export const MAX_FACTS = 30;
export const MAX_FACT_LENGTH = 400;
export const RATE_LIMIT = 20;
export const RATE_WINDOW_MS = 60_000;

const ROLE_TASK = Object.freeze({
  scout: 'Write two sentences about the person background and core skills.',
  archivist: 'Write two sentences summarising the career timeline, newest first.',
  builder: 'Write two sentences about what has shipped and how it is verified.',
  courier: 'Write two sentences telling a visitor how to request the resume and what happens next.',
});

const SYSTEM_PROMPT = [
  'You write short briefings for a developer portfolio page.',
  'Use only the facts provided by the user. Do not add names, numbers, employers, dates or claims that are not in those facts.',
  'Write plain, warm, professional English in the first person as the portfolio owner. No headings, no lists, no emoji.',
].join(' ');

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Validates the request body. Returns only the fields the prompt is allowed to use. */
export function parseBrief(body) {
  if (typeof body !== 'object' || body === null) {
    throw new HttpError(400, 'Expected a JSON object.');
  }
  const { agent, facts } = body;
  if (typeof agent !== 'string' || !AGENTS.includes(agent)) {
    throw new HttpError(400, 'Unknown agent.');
  }
  if (!Array.isArray(facts) || facts.length === 0 || facts.length > MAX_FACTS) {
    throw new HttpError(400, 'Facts must be a list of 1 to 30 items.');
  }
  const clean = facts.map((fact) => {
    if (typeof fact !== 'string' || fact.length > MAX_FACT_LENGTH) {
      throw new HttpError(400, 'Each fact must be a string of at most 400 characters.');
    }
    return fact.trim();
  });
  return { agent, facts: clean };
}

export function buildPrompt({ agent, facts }) {
  const list = facts.map((fact) => `- ${fact}`).join('\n');
  return `${ROLE_TASK[agent]}\n\nFacts:\n${list}`;
}

export function corsHeaders(origin, allowedOrigin) {
  if (!origin || origin !== allowedOrigin) {
    return {};
  }
  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'origin',
  };
}

/** Best-effort limiter per client address. Each Worker isolate keeps its own counts. */
export function createLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS) {
  const hits = new Map();
  return (key, now) => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

function json(status, payload, headers) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export async function readBody(request) {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request is too large.');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request is too large.');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Body is not valid JSON.');
  }
}

export function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim()
    .slice(0, 600);
}

export function createHandler({ fetchImpl = fetch, limiter = createLimiter(), now = () => Date.now() } = {}) {
  return async function handle(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN ?? '';
    const origin = request.headers.get('origin');
    const cors = corsHeaders(origin, allowedOrigin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: origin === allowedOrigin ? 204 : 403, headers: cors });
    }
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/brief') {
      return json(404, { error: 'Not found.' }, cors);
    }
    if (!allowedOrigin || origin !== allowedOrigin) {
      return json(403, { error: 'Origin not allowed.' }, cors);
    }
    if (!limiter(request.headers.get('cf-connecting-ip') ?? 'unknown', now())) {
      return json(429, { error: 'Too many requests. Try again in a minute.' }, cors);
    }
    if (!env.GEMINI_API_KEY) {
      return json(503, { error: 'Briefings are not configured.' }, cors);
    }

    try {
      const input = parseBrief(await readBody(request));
      const model = env.GEMINI_MODEL ?? 'gemini-2.5-flash';
      const upstream = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
          generationConfig: { maxOutputTokens: 160, temperature: 0.3 },
        }),
      });
      if (!upstream.ok) {
        return json(502, { error: 'The briefing service did not answer.' }, cors);
      }
      const text = extractText(await upstream.json());
      if (text.length === 0) {
        return json(502, { error: 'The briefing service returned nothing.' }, cors);
      }
      return json(200, { text }, cors);
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { error: error.message }, cors);
      }
      return json(500, { error: 'Something went wrong.' }, cors);
    }
  };
}

const handle = createHandler();

export default {
  fetch(request, env) {
    return handle(request, env);
  },
};
