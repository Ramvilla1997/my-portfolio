import { findRole, type AgentRole } from './roster';
import type { Hit } from './search';

export const MAX_CREW = 3;

export interface CrewMember {
  readonly role: AgentRole;
  readonly section: Hit['passage']['section'];
}

/* One agent per section the question touches, from the strongest matches only. Never more than MAX_CREW. */
export function crewFor(hits: readonly Hit[]): CrewMember[] {
  const best = hits[0];
  if (!best) {
    return [];
  }
  const crew: CrewMember[] = [];
  for (const hit of hits) {
    if (crew.length >= MAX_CREW) {
      break;
    }
    if (hit.score < best.score * 0.5) {
      continue;
    }
    const role = findRole(hit.passage.agent);
    if (crew.some((member) => member.role.id === role.id)) {
      continue;
    }
    crew.push({ role, section: hit.passage.section });
  }
  return crew;
}

const PHRASES = {
  walking: ['On my way!', 'Coming over', 'Be right there'],
  working: ['Digging through the files', 'Found it, writing up', 'Hold on, reading', 'Checking the drawers'],
  done: ['Done! Ta-da', 'Here you go', 'All yours'],
} as const;

/* Short, playful lines for the speech labels. Kept under 30 characters so they never crowd the scene. */
export function phraseFor(phase: 'walking' | 'working' | 'done', seed: number): string {
  const options = PHRASES[phase];
  return options[Math.abs(seed) % options.length] ?? options[0];
}
