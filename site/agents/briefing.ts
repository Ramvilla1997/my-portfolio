import { about, jobs, profile, projects } from '../content/portfolio';
import type { AgentId } from './roster';

export interface Briefing {
  readonly agent: AgentId;
  readonly text: string;
  readonly source: 'page' | 'gemini';
}

export const GEMINI_TIMEOUT_MS = 10_000;

export function skillCount(): number {
  return about.skills.reduce((total, group) => total + group.items.length, 0);
}

export function liveDemoCount(): number {
  return projects.filter((project) => project.liveUrl !== undefined).length;
}

export function codeCount(): number {
  return projects.filter((project) => project.codeUrl !== undefined).length;
}

export function inProgressCount(): number {
  return projects.filter((project) => project.inProgress === true).length;
}

/* Built only from the content file, so the page never states something the content does not. */
export function pageBriefing(agent: AgentId): string {
  switch (agent) {
    case 'scout': {
      const firstGroup = about.skills[0];
      return `Scanned ${about.skills.length} skill groups with ${skillCount()} skills, starting with ${firstGroup.items.slice(0, 3).join(', ')}.`;
    }
    case 'archivist': {
      const oldest = jobs[jobs.length - 1].period.split(' – ')[0];
      return `Filed ${jobs.length} roles, newest first, from ${oldest} to present.`;
    }
    case 'builder':
      return `Checked ${projects.length} projects: ${liveDemoCount()} with live demos, ${codeCount()} with public code, ${inProgressCount()} in progress.`;
    case 'courier':
      return `The request form is ready. Requests go to ${profile.email}, and I reply personally.`;
  }
}

/* The facts Gemini may use for an agent. Kept to this list so its wording stays grounded. */
export function groundingFacts(agent: AgentId): readonly string[] {
  switch (agent) {
    case 'scout':
      return [about.summary, ...about.skills.map((group) => `${group.name}: ${group.items.join(', ')}`)];
    case 'archivist':
      return jobs.map((job) => `${job.period}, ${job.title} at ${job.org}. ${job.points.join(' ')}`);
    case 'builder':
      return projects.map((project) => `${project.title}: ${project.summary} Stack: ${project.stack}.`);
    case 'courier':
      return [`Resume requests are sent by the form on this page to ${profile.email}.`, `Resume is shared on request.`];
  }
}

interface GeminiReply {
  readonly text: string;
}

function isGeminiReply(value: unknown): value is GeminiReply {
  return typeof value === 'object' && value !== null && typeof (value as { text?: unknown }).text === 'string';
}

/* Returns null on any failure, so the page briefing still stands when Gemini is unavailable. */
export async function geminiBriefing(
  agent: AgentId,
  apiUrl: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<Briefing | null> {
  if (!apiUrl) {
    return null;
  }
  try {
    const response = await fetchImpl(`${apiUrl.replace(/\/$/, '')}/brief`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agent, facts: groundingFacts(agent) }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body: unknown = await response.json();
    if (!isGeminiReply(body) || body.text.trim().length === 0) {
      return null;
    }
    return { agent, text: body.text.trim().slice(0, 400), source: 'gemini' };
  } catch {
    return null;
  }
}
