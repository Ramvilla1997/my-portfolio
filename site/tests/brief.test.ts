import { describe, expect, it } from 'vitest';
import { MAX_BRIEF_LENGTH, briefFor } from '../agents/brief';
import { search } from '../agents/search';

describe('briefFor', () => {
  it('keeps the sentences that match the question, in page order', () => {
    const text = 'Senior Engineer at Ontario Health. Built the ONE Health chatbot. Shrank the bundle from 2.1 MB to 1.3 MB.';
    expect(briefFor(text, 'Tell me about the chatbot at Ontario Health')).toBe(
      'Senior Engineer at Ontario Health. Built the ONE Health chatbot.',
    );
  });

  it('falls back to the first sentence when nothing matches', () => {
    expect(briefFor('First sentence. Second sentence.', 'zebra crossing')).toBe('First sentence.');
  });

  it('never returns more than the length limit', () => {
    const long = `${'word '.repeat(200)}end.`;
    expect(briefFor(long, 'word').length).toBeLessThanOrEqual(MAX_BRIEF_LENGTH + 1);
  });

  it('gives a short answer for a real job passage', () => {
    const [best] = search('where did you work at Ontario Health');
    expect(best).toBeDefined();
    expect(briefFor(best?.passage.text ?? '', 'where did you work at Ontario Health').length).toBeLessThanOrEqual(MAX_BRIEF_LENGTH + 1);
  });
});
