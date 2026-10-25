import { describe, expect, it } from 'vitest';
import { crewFor, MAX_CREW, phraseFor } from '../agents/crew';
import { search } from '../agents/search';

describe('crew selection', () => {
  it('sends one agent for a single-topic question', () => {
    const crew = crewFor(search('what projects have you built'));
    expect(crew.map((member) => member.role.id)).toEqual(['builder']);
  });

  it('never sends more than the crew limit', () => {
    const crew = crewFor(search('projects experience skills resume contact about'));
    expect(crew.length).toBeLessThanOrEqual(MAX_CREW);
    expect(new Set(crew.map((member) => member.role.id)).size).toBe(crew.length);
  });

  it('sends nobody when the page has no answer', () => {
    expect(crewFor(search('what is your favourite football team'))).toEqual([]);
  });
});

describe('speech lines', () => {
  it('keeps every line short enough for a scene label', () => {
    for (const phase of ['walking', 'working', 'done'] as const) {
      for (let seed = 0; seed < 6; seed += 1) {
        expect(phraseFor(phase, seed).length).toBeLessThanOrEqual(30);
      }
    }
  });
});
