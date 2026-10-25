import type { AgentId } from '../agents/roster';

export const AGENT_IDS: readonly AgentId[] = ['scout', 'planner', 'archivist', 'coder', 'builder', 'tester', 'courier', 'writer'];
export const MAX_BODY_BYTES = 8192;
export const MAX_FACTS = 30;
export const MAX_FACT_LENGTH = 400;
export const RATE_LIMIT = 20;
export const RATE_WINDOW_MS = 60_000;

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
/* Tried in order when the main Gemini model stays busy. Each one has its own free quota. */
export const FALLBACK_GEMINI_MODELS: readonly string[] = ['gemini-3.8-flash'];

const ROLE_TASK: Readonly<Record<AgentId, string>> = {
  scout: 'Write two sentences about the person background and core skills.',
  archivist: 'Write two sentences summarising the career timeline, newest first.',
  builder: 'Write two sentences about what has shipped and how it is verified.',
  courier: 'Write two sentences telling a visitor how to request the resume and what happens next.',
  planner: 'Write two sentences about how the page is ordered for a visitor reading from top to bottom.',
  coder: 'Write two sentences comparing the technology in the projects with the skills listed.',
  tester: 'Write two sentences about how the project cards link to code and live demos.',
  writer: 'Write two sentences in plain English describing how a visitor asks for the resume.',
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

export function extractGroqText(data: unknown): string {
  const content = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content.trim().slice(0, 600) : '';
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
  readonly groqKey?: string | undefined;
  readonly groqModel?: string | undefined;
  readonly fetchImpl: typeof fetch;
  readonly limiter: (key: string, now: number) => boolean;
  readonly now: () => number;
  readonly model?: string | undefined;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export interface BriefResult {
  readonly status: number;
  readonly body: { readonly text: string } | { readonly error: string };
}

type Outcome = { readonly ok: true; readonly text: string } | { readonly ok: false };

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

const RETRYABLE_STATUS = new Set([500, 503]);
const RETRY_DELAYS_MS = [400, 1200];

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function modelUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/* Gemini answers 503 when a model is overloaded. That is worth a short wait and another try. */
async function callGemini(deps: BriefDeps, url: string, body: string): Promise<Response> {
  const sleep = deps.sleep ?? defaultSleep;
  const send = () =>
    deps.fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': deps.apiKey ?? '' },
      body,
    });
  let response = await send();
  for (const delay of RETRY_DELAYS_MS) {
    if (response.ok || !RETRYABLE_STATUS.has(response.status)) {
      break;
    }
    console.warn(`brief: Gemini busy (${response.status}), retrying in ${delay} ms`);
    await sleep(delay);
    response = await send();
  }
  return response;
}

async function askGemini(deps: BriefDeps, input: BriefInput): Promise<Outcome> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
    generationConfig: { maxOutputTokens: 160, temperature: 0.3 },
  });
  const models = [...new Set([deps.model ?? DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS])];
  let upstream = await callGemini(deps, modelUrl(models[0] ?? DEFAULT_GEMINI_MODEL), body);
  for (const model of models.slice(1)) {
    if (upstream.ok || !RETRYABLE_STATUS.has(upstream.status)) {
      break;
    }
    console.warn(`brief: switching to ${model} after ${upstream.status}`);
    upstream = await callGemini(deps, modelUrl(model), body);
  }
  if (!upstream.ok) {
    console.error(`brief: Gemini responded ${upstream.status}: ${(await upstream.text()).slice(0, 300)}`);
    return { ok: false };
  }
  const text = extractText(await upstream.json());
  if (text.length === 0) {
    console.error('brief: Gemini returned no text');
    return { ok: false };
  }
  return { ok: true, text };
}

/* Groq is tried first when a key is set. Any failure falls through to Gemini. */
async function askGroq(deps: BriefDeps, input: BriefInput, groqKey: string): Promise<Outcome> {
  try {
    const response = await deps.fetchImpl(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: deps.groqModel ?? DEFAULT_GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(input) },
        ],
        max_tokens: 160,
        temperature: 0.3,
      }),
    });
    if (!response.ok) {
      console.warn(`brief: Groq responded ${response.status}`);
      return { ok: false };
    }
    const text = extractGroqText(await response.json());
    return text.length > 0 ? { ok: true, text } : { ok: false };
  } catch (error) {
    console.warn('brief: Groq request failed', error);
    return { ok: false };
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
  if (!deps.groqKey && !deps.apiKey) {
    console.error('brief: neither GROQ_API_KEY nor GEMINI_API_KEY is set in this environment');
    return { status: 503, body: { error: 'Briefings are not configured.' } };
  }

  try {
    const input = parseBrief(await readJson(request));
    if (deps.groqKey) {
      const groq = await askGroq(deps, input, deps.groqKey);
      if (groq.ok) {
        return { status: 200, body: { text: groq.text } };
      }
    }
    if (!deps.apiKey) {
      return { status: 502, body: { error: 'The briefing service did not answer.' } };
    }
    const gemini = await askGemini(deps, input);
    if (gemini.ok) {
      return { status: 200, body: { text: gemini.text } };
    }
    return { status: 502, body: { error: 'The briefing service did not answer.' } };
  } catch (error) {
    if (error instanceof BriefError) {
      return { status: error.status, body: { error: error.message } };
    }
    console.error('brief: unexpected failure', error);
    return { status: 500, body: { error: 'Something went wrong.' } };
  }
}
