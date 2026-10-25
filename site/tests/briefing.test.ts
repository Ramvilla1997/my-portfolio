import { describe, expect, it, vi } from 'vitest';
import {
  codeCount,
  geminiBriefing,
  groundingFacts,
  inProgressCount,
  liveDemoCount,
  pageBriefing,
  skillCount,
} from '../agents/briefing';
import { roster } from '../agents/roster';

describe('page briefings', () => {
  it('counts projects from the content, not from hard-coded numbers', () => {
    expect(liveDemoCount()).toBe(2);
    expect(codeCount()).toBe(5);
    expect(inProgressCount()).toBe(1);
    expect(skillCount()).toBe(18);
  });

  it('gives every agent a non-empty briefing and grounding facts', () => {
    for (const agent of roster) {
      expect(pageBriefing(agent.id).length).toBeGreaterThan(20);
      expect(groundingFacts(agent.id).length).toBeGreaterThan(0);
    }
  });

  it('states the oldest role start from the timeline', () => {
    expect(pageBriefing('archivist')).toContain('from Jul 2018 to present');
  });
});

describe('geminiBriefing', () => {
  it('does not call the network when no API URL is configured', async () => {
    const fetchSpy = vi.fn();
    const result = await geminiBriefing('scout', undefined, fetchSpy as unknown as typeof fetch);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns Gemini text, trimmed, and labelled as Gemini', async () => {
    const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ text: '  Six years of work.  ' }), { status: 200 }));
    const result = await geminiBriefing('scout', 'https://api.example.com/', fetchSpy as unknown as typeof fetch);
    expect(result).toEqual({ agent: 'scout', text: 'Six years of work.', source: 'gemini' });
    expect(fetchSpy).toHaveBeenCalledWith('https://api.example.com/brief', expect.objectContaining({ method: 'POST' }));
  });

  it('returns null on HTTP errors, bad bodies and network failures', async () => {
    const cases = [
      async () => new Response('nope', { status: 500 }),
      async () => new Response(JSON.stringify({ wrong: true }), { status: 200 }),
      async () => new Response(JSON.stringify({ text: '   ' }), { status: 200 }),
      async () => {
        throw new TypeError('network down');
      },
    ];
    for (const handler of cases) {
      const result = await geminiBriefing('builder', 'https://api.example.com', handler as unknown as typeof fetch);
      expect(result).toBeNull();
    }
  });
});
