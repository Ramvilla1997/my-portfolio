export type AgentId = 'scout' | 'archivist' | 'builder' | 'courier';
export type SectionId = 'about' | 'experience' | 'projects' | 'resume';
export type EffectKind = 'radar' | 'stamp' | 'sparks' | 'glow';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Room extends Point {
  readonly id: SectionId;
  readonly label: string;
  readonly w: number;
  readonly h: number;
}

export interface AgentRole {
  readonly id: AgentId;
  readonly name: string;
  readonly role: string;
  readonly color: string;
  readonly section: SectionId;
  readonly desk: Point;
  readonly work: Point;
  readonly taskLabel: string;
  readonly effect: EffectKind;
}

/* Positions are percentages of the floor plan, so the layout scales with the screen. */
export const rooms: readonly Room[] = [
  { id: 'about', label: 'About', x: 2, y: 2, w: 46, h: 46 },
  { id: 'experience', label: 'Experience', x: 52, y: 2, w: 46, h: 46 },
  { id: 'projects', label: 'Projects', x: 2, y: 52, w: 46, h: 46 },
  { id: 'resume', label: 'Resume', x: 52, y: 52, w: 46, h: 46 },
];

export const roster: readonly AgentRole[] = [
  {
    id: 'scout',
    name: 'Scout',
    role: 'Researcher',
    color: '#0b6e69',
    section: 'about',
    desk: { x: 10, y: 18 },
    work: { x: 24, y: 32 },
    taskLabel: 'Scan the background',
    effect: 'radar',
  },
  {
    id: 'archivist',
    name: 'Archivist',
    role: 'Records',
    color: '#3b4ea8',
    section: 'experience',
    desk: { x: 60, y: 18 },
    work: { x: 74, y: 32 },
    taskLabel: 'File the timeline',
    effect: 'stamp',
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Shipping',
    color: '#a8691b',
    section: 'projects',
    desk: { x: 10, y: 68 },
    work: { x: 24, y: 82 },
    taskLabel: 'Check what ships',
    effect: 'sparks',
  },
  {
    id: 'courier',
    name: 'Courier',
    role: 'Requests',
    color: '#a33458',
    section: 'resume',
    desk: { x: 60, y: 68 },
    work: { x: 74, y: 82 },
    taskLabel: 'Prepare a resume request',
    effect: 'glow',
  },
];

export const timing = { walkMs: 1100, workMs: 2200, returnMs: 900 } as const;

export function findRole(id: AgentId): AgentRole {
  const role = roster.find((candidate) => candidate.id === id);
  if (!role) {
    throw new Error(`Unknown agent: ${id}`);
  }
  return role;
}
