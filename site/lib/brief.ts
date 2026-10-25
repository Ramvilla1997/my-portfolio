import type { AgentId } from '../agents/roster';

export const AGENT_IDS: readonly AgentId[] = ['scout', 'archivist', 'builder', 'courier'];
export const MAX_BODY_BYTES = 8192;
export const MAX_FACTS = 30;
export const MAX_FACT_LENGTH = 400;
export const RATE_LIMIT = 20;
export const RATE_WINDOW_MS = 60_000;
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

const ROLE_TASK: Readonly<Record<AgentId, string>> = {
  scout: 'Write two sentences about the person background and core skills.',
  archivist: 'Write two sentences summarising the career timeline, newest first.',
  builder: 'Write two sentences about what has shipped and how it is verified.',
  courier: 'Write two sentences telling a visitor how to request the resume and what happens next.',
};

const SYSTEM_PROMPT = [
  'You write short briefings for a developer portfolio page.',
  'Use only the facts provided by the user. Do not add names, numbers, employers, dates or claims that are not in those facts.',
  'Write plain, warm, professional English in the first person as the portfolio owner. No headings, no lists, no emoji.',
].join(' ');

export interface BriefInput {
  readonly agent: AgentId;
  readonly facts: readonly string[];
}

export class BriefError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function isAgentId(value: unknown): value is AgentId {
  return typeof value === 'string' && (AGENT_IDS as readonly string[]).includes(value);
}

/* Validates the body and keeps only the fields the prompt may use. */
export function parseBrief(body: unknown): BriefInput {
  if (typeof body !== 'object' || body === null) {
    throw new BriefError(400, 'Expected a JSON object.');
  }
  const { agent, facts } = body as { agent?: unknown; facts?: unknown };
  if (!isAgentId(agent)) {
    throw new BriefError(400, 'Unknown agent.');
  }
  if (!Array.isArray(facts) || facts.length === 0 || facts.length > MAX_FACTS) {
    throw new BriefError(400, 'Facts must be a list of 1 to 30 items.');
  }
  const clean = facts.map((fact: unknown) => {
    if (typeof fact !== 'string' || fact.length > MAX_FACT_LENGTH) {
      throw new BriefError(400, 'Each fact must be a string of at most 400 characters.');
    }
    return fact.trim();
  });
  return { agent, facts: clean };
}

export function buildPrompt({ agent, facts }: BriefInput): string {
  const list = facts.map((fact) => `- ${fact}`).join('\n');
  return `${ROLE_TASK[agent]}\n\nFacts:\n${list}`;
}

export function extractText(data: unknown): string {
  const parts = (data as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)?.candidates?.[0]
    ?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }
  return parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim()
    .slice(0, 600);
}

/* Best-effort limiter per client address. Each serverless instance keeps its own counts. */
export function createLimiter(limit = RATE_LIMIT, windowMs = RATE_WINDOW_MS): (key: string, now: number) => boolean {
  const hits = new Map<string, number[]>();
  return (key, now) => {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    const allowed = recent.length < limit;
    if (allowed) {
      recent.push(now);
    }
    hits.set(key, recent);
    return allowed;
  };
}

export interface BriefDeps {
  readonly apiKey: string | undefined;
  readonly fetchImpl: typeof fetch;
  readonly limiter: (key: string, now: number) => boolean;
  readonly now: () => number;
  readonly model?: string | undefined;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

/* 429 means the key's quota is spent. Retrying only adds requests to that quota, so it is not retried. */
const RETRYABLE_STATUS = new Set([500, 503]);
const RETRY_DELAYS_MS = [400, 1200];

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/* Gemini answers 503 when a model is overloaded. That is worth a short wait and another try. */
async function callGemini(
  deps: BriefDeps,
  url: string,
  body: string,
): Promise<Response> {
  const sleep = deps.sleep ?? defaultSleep;
  let response = await deps.fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.apiKey ?? '' },
    body,
  });
  for (const delay of RETRY_DELAYS_MS) {
    if (response.ok || !RETRYABLE_STATUS.has(response.status)) {
      break;
    }
    console.warn(`brief: Gemini busy (${response.status}), retrying in ${delay} ms`);
    await sleep(delay);
    response = await deps.fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.apiKey ?? '' },
      body,
    });
  }
  return response;
}

export interface BriefResult {
  readonly status: number;
  readonly body: { readonly text: string } | { readonly error: string };
}

async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY_BYTES) {
    throw new BriefError(413, 'Request is too large.');
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new BriefError(413, 'Request is too large.');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new BriefError(400, 'Body is not valid JSON.');
  }
}

/* Same-origin only: the browser always sends Origin on POST, so a foreign page cannot use this route. */
export async function generateBrief(request: Request, deps: BriefDeps): Promise<BriefResult> {
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return { status: 403, body: { error: 'Origin not allowed.' } };
  }
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!deps.limiter(client, deps.now())) {
    return { status: 429, body: { error: 'Too many requests. Try again in a minute.' } };
  }
  if (!deps.apiKey) {
    console.error('brief: GEMINI_API_KEY is not set in this environment');
    return { status: 503, body: { error: 'Briefings are not configured.' } };
  }

  try {
    const input = parseBrief(await readJson(request));
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${deps.model ?? DEFAULT_GEMINI_MODEL}:generateContent`;
    const upstream = await callGemini(
      deps,
      url,
      JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
        generationConfig: { maxOutputTokens: 160, temperature: 0.3 },
      }),
    );
    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 300);
      console.error(`brief: Gemini responded ${upstream.status}: ${detail}`);
      return { status: 502, body: { error: 'The briefing service did not answer.' } };
    }
    const text = extractText(await upstream.json());
    if (text.length === 0) {
      console.error('brief: Gemini returned no text');
      return { status: 502, body: { error: 'The briefing service returned nothing.' } };
    }
    return { status: 200, body: { text } };
  } catch (error) {
    if (error instanceof BriefError) {
      return { status: error.status, body: { error: error.message } };
    }
    console.error('brief: unexpected failure', error);
    return { status: 500, body: { error: 'Something went wrong.' } };
  }
}
