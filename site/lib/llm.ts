export interface LlmDeps {
  readonly apiKey?: string | undefined;
  readonly groqKey?: string | undefined;
  readonly groqModel?: string | undefined;
  readonly model?: string | undefined;
  readonly fetchImpl: typeof fetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const FALLBACK_GEMINI_MODELS: readonly string[] = ['gemini-3.8-flash'];

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE_STATUS = new Set([500, 503]);
const RETRY_DELAYS_MS = [400, 1200];

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function askGroq(deps: LlmDeps, groqKey: string, system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const response = await deps.fetchImpl(GROQ_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: deps.groqModel ?? DEFAULT_GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    });
    if (!response.ok) {
      console.warn(`llm: Groq responded ${response.status}`);
      return null;
    }
    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim().length > 0 ? content.trim() : null;
  } catch (error) {
    console.warn('llm: Groq request failed', error);
    return null;
  }
}

async function askGemini(deps: LlmDeps, apiKey: string, system: string, user: string, maxTokens: number): Promise<string | null> {
  const sleep = deps.sleep ?? defaultSleep;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.2 },
  });
  const models = [...new Set([deps.model ?? DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS])];
  for (const model of models) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      const response = await deps.fetchImpl(geminiUrl(model), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      });
      if (response.ok) {
        const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] };
        const text = (data.candidates?.[0]?.content?.parts ?? [])
          .map((part) => (typeof part.text === 'string' ? part.text : ''))
          .join('')
          .trim();
        return text.length > 0 ? text : null;
      }
      if (!RETRYABLE_STATUS.has(response.status)) {
        console.error(`llm: Gemini responded ${response.status} for ${model}`);
        break;
      }
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 400);
      }
    }
  }
  return null;
}

/* Groq first when a key is set, then Gemini. Returns null when neither answers. */
export async function completeText(deps: LlmDeps, system: string, user: string, maxTokens = 220): Promise<string | null> {
  if (deps.groqKey) {
    const groq = await askGroq(deps, deps.groqKey, system, user, maxTokens);
    if (groq) {
      return groq;
    }
  }
  if (deps.apiKey) {
    return askGemini(deps, deps.apiKey, system, user, maxTokens);
  }
  return null;
}
