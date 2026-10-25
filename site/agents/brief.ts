import { tokens } from './search';

export const MAX_BRIEF_LENGTH = 220;

/* The short answer shown when no model replies: the sentences that best match the question, in page order. */
export function briefFor(text: string, question: string): string {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
  const terms = new Set(tokens(question));
  const ranked = sentences
    .map((sentence, index) => ({ sentence, index, score: tokens(sentence).filter((word) => terms.has(word)).length }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);
  const picked = ranked.every((item) => item.score === 0) ? sentences.slice(0, 1) : ranked.map((item) => item.sentence);
  return clip(picked.join(' ') || text.trim());
}

function clip(text: string): string {
  if (text.length <= MAX_BRIEF_LENGTH) {
    return text;
  }
  const cut = text.slice(0, MAX_BRIEF_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
