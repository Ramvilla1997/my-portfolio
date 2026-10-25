import { completeText, type LlmDeps } from './llm';

export const MAX_QUESTION_LENGTH = 200;
export const MAX_CONTEXT_ITEMS = 6;
export const MAX_CONTEXT_LENGTH = 600;
export const MAX_ASK_BODY_BYTES = 8192;

const SYSTEM_PROMPT = [
  "You answer questions about Ram Villa's developer portfolio.",
  'Use only the numbered context passages. Never add facts, numbers, employers or dates that are not in them.',
  "If the passages do not answer the question, say you don't have that on this page and point to the closest section: About, Experience, Projects or Resume.",
  'Answer in two or three plain, friendly sentences. No lists, no headings, no emoji.',
].join(' ');

export interface AskInput {
  readonly question: string;
  readonly context: readonly string[];
}

export interface AskDeps extends LlmDeps {
  readonly limiter: (key: string, now: number) => boolean;
  readonly now: () => number;
}

export interface AskResult {
  readonly status: number;
  readonly body: { readonly text: string } | { readonly error: string };
}

export function parseAsk(body: unknown): AskInput {
  if (typeof body !== 'object' || body === null) {
    throw new AskError(400, 'Expected a JSON object.');
  }
  const { question, context } = body as { question?: unknown; context?: unknown };
  if (typeof question !== 'string') {
    throw new AskError(400, 'Question must be text.');
  }
  const trimmed = question.trim();
  if (trimmed.length < 3 || trimmed.length > MAX_QUESTION_LENGTH) {
    throw new AskError(400, `Question must be between 3 and ${MAX_QUESTION_LENGTH} characters.`);
  }
  if (!Array.isArray(context) || context.length === 0 || context.length > MAX_CONTEXT_ITEMS) {
    throw new AskError(400, `Context must hold 1 to ${MAX_CONTEXT_ITEMS} passages.`);
  }
  const passages = context.map((passage: unknown) => {
    if (typeof passage !== 'string' || passage.length > MAX_CONTEXT_LENGTH) {
      throw new AskError(400, `Each passage must be text of at most ${MAX_CONTEXT_LENGTH} characters.`);
    }
    return passage.trim();
  });
  return { question: trimmed, context: passages };
}

export class AskError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function buildUserMessage({ question, context }: AskInput): string {
  const passages = context.map((passage, index) => `[${index + 1}] ${passage}`).join('\n');
  return `Context passages:\n${passages}\n\nQuestion: ${question}`;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new AskError(400, 'Body is not valid JSON.');
  }
}

export async function generateAnswer(request: Request, deps: AskDeps): Promise<AskResult> {
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return { status: 403, body: { error: 'Origin not allowed.' } };
  }
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!deps.limiter(client, deps.now())) {
    return { status: 429, body: { error: 'Too many questions. Try again in a minute.' } };
  }
  try {
    const raw = await request.text();
    if (raw.length > MAX_ASK_BODY_BYTES) {
      return { status: 413, body: { error: 'Request is too large.' } };
    }
    const input = parseAsk(parseJson(raw));
    if (!deps.groqKey && !deps.apiKey) {
      return { status: 503, body: { error: 'Answers are not configured.' } };
    }
    const text = await completeText(deps, SYSTEM_PROMPT, buildUserMessage(input), 220);
    if (!text) {
      return { status: 502, body: { error: 'The answer service did not respond.' } };
    }
    return { status: 200, body: { text: text.slice(0, 600) } };
  } catch (error) {
    if (error instanceof AskError) {
      return { status: error.status, body: { error: error.message } };
    }
    console.error('ask: unexpected failure', error);
    return { status: 500, body: { error: 'Something went wrong.' } };
  }
}
