export type AgentId = 'scout' | 'planner' | 'archivist' | 'coder' | 'builder' | 'tester' | 'courier' | 'writer';
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
  readonly idleTasks: readonly string[];
  readonly effect: EffectKind;
}

/* Positions are percentages of the floor plan, so the layout scales with the screen. */
export const rooms: readonly Room[] = [
  { id: 'about', label: 'About', x: 2, y: 2, w: 46, h: 46 },
  { id: 'experience', label: 'Experience', x: 52, y: 2, w: 46, h: 46 },
  { id: 'projects', label: 'Projects', x: 2, y: 52, w: 46, h: 46 },
  { id: 'resume', label: 'Resume', x: 52, y: 52, w: 46, h: 46 },
];

/* The effect each room plays when an agent works there. */
export const ROOM_EFFECT: Readonly<Record<SectionId, EffectKind>> = {
  about: 'radar',
  experience: 'stamp',
  projects: 'sparks',
  resume: 'glow',
};

/* Two specialists per room. Each has its own desk and its own work spot. */
export const roster: readonly AgentRole[] = [
  {
    id: 'scout',
    name: 'Scout',
    role: 'Researcher',
    color: '#0b6e69',
    section: 'about',
    desk: { x: 10, y: 18 },
    work: { x: 16, y: 34 },
    taskLabel: 'Scan the background',
    idleTasks: ['Re-checking the skill list against the summary', 'Counting the skills in each group', 'Reading the background summary again'],
    effect: 'radar',
  },
  {
    id: 'planner',
    name: 'Planner',
    role: 'Planning',
    color: '#6d4fc2',
    section: 'about',
    desk: { x: 34, y: 18 },
    work: { x: 34, y: 34 },
    taskLabel: 'Check the page order',
    idleTasks: ['Checking the sections run in reading order', 'Lining up the four rooms against the nav links', 'Confirming Contact is the last section'],
    effect: 'radar',
  },
  {
    id: 'archivist',
    name: 'Archivist',
    role: 'Records',
    color: '#3b4ea8',
    section: 'experience',
    desk: { x: 62, y: 18 },
    work: { x: 68, y: 34 },
    taskLabel: 'File the timeline',
    idleTasks: ['Checking the timeline is newest first', 'Matching each role to its dates', 'Re-filing the oldest role'],
    effect: 'stamp',
  },
  {
    id: 'coder',
    name: 'Coder',
    role: 'Coding',
    color: '#2a7fd1',
    section: 'experience',
    desk: { x: 86, y: 18 },
    work: { x: 86, y: 34 },
    taskLabel: 'Compare stacks with skills',
    idleTasks: ['Comparing each project stack with the skills list', 'Checking each job lists an organisation', 'Counting the languages across the skill groups'],
    effect: 'stamp',
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Shipping',
    color: '#a8691b',
    section: 'projects',
    desk: { x: 10, y: 70 },
    work: { x: 16, y: 86 },
    taskLabel: 'Check what ships',
    idleTasks: ['Checking which projects have shipped', 'Counting the projects in progress', 'Looking for the newest project'],
    effect: 'sparks',
  },
  {
    id: 'tester',
    name: 'Tester',
    role: 'Testing',
    color: '#c2413a',
    section: 'projects',
    desk: { x: 34, y: 70 },
    work: { x: 34, y: 86 },
    taskLabel: 'Check the project links',
    idleTasks: ['Checking each project card has a summary', 'Checking the in-progress project has no code link', 'Checking every code link points to GitHub'],
    effect: 'sparks',
  },
  {
    id: 'courier',
    name: 'Courier',
    role: 'Requests',
    color: '#a33458',
    section: 'resume',
    desk: { x: 62, y: 70 },
    work: { x: 68, y: 86 },
    taskLabel: 'Prepare a resume request',
    idleTasks: ['Checking the resume request form', 'Confirming where requests are sent', 'Making sure the form is ready to send'],
    effect: 'glow',
  },
  {
    id: 'writer',
    name: 'Writer',
    role: 'Writing',
    color: '#3f8f4a',
    section: 'resume',
    desk: { x: 86, y: 70 },
    work: { x: 86, y: 86 },
    taskLabel: 'Re-read the request copy',
    idleTasks: ['Re-reading the request form wording', 'Checking the intro is plain English', 'Checking the request sentence matches the form'],
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
