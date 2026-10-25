'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { findRole, ROOM_EFFECT, roster, rooms, timing, type AgentId, type AgentRole, type Point, type SectionId } from '../agents/roster';
import { routeFromDesk, reversed, walkOf, workPointFor, type Walk } from '../agents/routes';
import { search, type Hit } from '../agents/search';
import { useEffects } from './EffectsContext';
import { OfficeScene } from './OfficeScene';

type Phase = 'idle' | 'walking' | 'working' | 'done';

interface AgentState {
  readonly phase: Phase;
  readonly at: Point;
  readonly walk: Walk;
  readonly note: string | null;
  readonly startedAt: number;
}

interface Answer {
  readonly question: string;
  readonly text: string;
  readonly source: 'ai' | 'page' | 'none';
  readonly agent: AgentId | null;
  readonly section: SectionId | null;
}

const AUTO_WORK_MS = 2400;
const AUTO_FIRST_MS = 600;
const AUTO_GAP_MIN_MS = 2500;
const AUTO_GAP_MAX_MS = 4000;
const AUTO_STARTS_PER_TICK = 2;
const VISIT_CHANCE = 0.35;
const ASK_TIMEOUT_MS = 12000;
const QUESTION_MAX = 200;

const SECTION_LABEL: Record<SectionId, string> = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  resume: 'Resume',
};

const NOTHING_FOUND = "I don't have that on this page. Try asking about projects, experience, skills or the resume.";

function initialStates(): Record<AgentId, AgentState> {
  return Object.fromEntries(
    roster.map((role) => [role.id, { phase: 'idle', at: role.desk, walk: walkOf([role.desk]), note: null, startedAt: 0 }]),
  ) as Record<AgentId, AgentState>;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function randomBetween(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function pick<T>(items: readonly T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

async function requestAnswer(question: string, context: readonly string[]): Promise<string | null> {
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, context }),
      signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { text?: unknown };
    return typeof data.text === 'string' && data.text.trim().length > 0 ? data.text.trim() : null;
  } catch {
    return null;
  }
}

export function Playground() {
  const reduced = useReducedMotion() ?? false;
  const { play } = useEffects();
  const [agents, setAgents] = useState<Record<AgentId, AgentState>>(initialStates);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState('');
  const busyRef = useRef<Partial<Record<AgentId, boolean>>>({});
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const setBusy = useCallback((id: AgentId, value: boolean) => {
    busyRef.current[id] = value;
  }, []);

  const move = useCallback((id: AgentId, phase: Phase, at: Point, walk: Walk, note?: string) => {
    setAgents((previous) => ({
      ...previous,
      [id]: { phase, at, walk, note: note ?? previous[id].note, startedAt: performance.now() },
    }));
  }, []);

  /* One agent walks to a room, works there with the room's effect, and returns to its desk. */
  const visit = useCallback(
    async (role: AgentRole, target: SectionId, note: string, workMs: number, onWorking?: () => void) => {
      const scale = reduced ? 0 : 1;
      const out = walkOf(routeFromDesk(role, target));
      const back = walkOf(reversed(routeFromDesk(role, target)));
      const destination = workPointFor(target);

      move(role.id, 'walking', destination, out, note);
      await wait(out.seconds * 1000 * scale);
      if (!alive.current) return;

      move(role.id, 'working', destination, walkOf([destination]), note);
      play(target, ROOM_EFFECT[target], workMs * scale);
      onWorking?.();
      await wait(workMs * scale);
      if (!alive.current) return;

      move(role.id, 'walking', role.desk, back, note);
      await wait(back.seconds * 1000 * scale);
      if (!alive.current) return;

      move(role.id, 'idle', role.desk, walkOf([role.desk]));
    },
    [move, play, reduced],
  );

  /* Background life: idle agents do small checks on the page, two at a time, for as long as the page is open. */
  const autoStep = useCallback(async () => {
    const idle = roster.filter((candidate) => !busyRef.current[candidate.id]);
    const role = pick(idle);
    if (!role) {
      return;
    }
    setBusy(role.id, true);
    const visitRoom = Math.random() < VISIT_CHANCE ? pick(rooms.filter((room) => room.id !== role.section)) : undefined;
    const target: SectionId = visitRoom ? visitRoom.id : role.section;
    const task = pick(role.idleTasks) ?? role.taskLabel;
    await visit(role, target, visitRoom ? `Visiting ${SECTION_LABEL[target]}: ${task}` : task, AUTO_WORK_MS);
    setBusy(role.id, false);
  }, [setBusy, visit]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        if (!document.hidden) {
          for (let index = 0; index < AUTO_STARTS_PER_TICK; index += 1) {
            void autoStep();
          }
        }
        if (alive.current) {
          schedule(randomBetween(AUTO_GAP_MIN_MS, AUTO_GAP_MAX_MS));
        }
      }, delay);
    };
    schedule(AUTO_FIRST_MS);
    return () => window.clearTimeout(timer);
  }, [autoStep, reduced]);

  /* Chooses who answers: the owner of the best passage if free, otherwise any free agent. */
  const chooseAnswerer = useCallback((hit: Hit): AgentRole | undefined => {
    const owner = findRole(hit.passage.agent);
    if (!busyRef.current[owner.id]) {
      return owner;
    }
    return pick(roster.filter((candidate) => !busyRef.current[candidate.id]));
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const hits = search(question);
      if (hits.length === 0) {
        setAnswer({ question, text: NOTHING_FOUND, source: 'none', agent: null, section: null });
        return;
      }
      const best = hits[0];
      if (!best) {
        return;
      }
      setPending(true);
      const role = chooseAnswerer(best);
      const section = best.passage.section;
      const context = hits.map((hit) => hit.passage.text);
      const note = `Answering: ${question.slice(0, 60)}`;

      if (role) {
        setBusy(role.id, true);
        const walking = visit(role, section, note, timing.workMs);
        const reply = requestAnswer(question, context);
        await walking;
        if (alive.current) {
          const text = await reply;
          setAnswer({
            question,
            text: text ?? best.passage.text,
            source: text ? 'ai' : 'page',
            agent: role.id,
            section,
          });
        }
        setBusy(role.id, false);
      } else {
        const text = await requestAnswer(question, context);
        if (alive.current) {
          setAnswer({ question, text: text ?? best.passage.text, source: text ? 'ai' : 'page', agent: null, section });
        }
      }
      if (alive.current) {
        setPending(false);
      }
    },
    [chooseAnswerer, setBusy, visit],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (question.length < 3 || pending) {
      return;
    }
    setDraft('');
    void ask(question.slice(0, QUESTION_MAX));
  };

  const working = roster.filter((role) => agents[role.id].phase !== 'idle').length;
  const activity: Partial<Record<AgentId, string>> = {};
  for (const role of roster) {
    const state = agents[role.id];
    if (state.phase === 'working' && state.note) {
      activity[role.id] = state.note;
    }
  }
  const answerRole = answer?.agent ? findRole(answer.agent) : null;

  return (
    <section id="workspace" className="playground" aria-labelledby="playground-title">
      <div className="wrap">
        <p className="eyebrow">Agent playground</p>
        <h2 id="playground-title">Ask the office.</h2>
        <p className="lede">
          Type any question about this portfolio. The agent who looks after that part of the page walks over, works in its room, and answers from what is on the page.
        </p>

        <form className="pg-search" role="search" onSubmit={onSubmit}>
          <label htmlFor="pg-question" className="sr-only">
            Ask a question about this portfolio
          </label>
          <input
            id="pg-question"
            type="search"
            name="question"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={QUESTION_MAX}
            autoComplete="off"
            placeholder="Ask about projects, experience, skills, or how to get the resume"
          />
          <button type="submit" disabled={pending || draft.trim().length < 3}>
            {pending ? 'Asking' : 'Ask'}
          </button>
        </form>

        {answer ? (
          <div className="pg-answer" aria-live="polite">
            <p className="pg-question">You asked: {answer.question}</p>
            <div className="pg-answer-body">
              {answerRole ? (
                <span className="pg-agent" style={{ borderColor: answerRole.color }}>
                  <span className="pg-agent-dot" style={{ background: answerRole.color }} />
                  {answerRole.name}
                </span>
              ) : null}
              <p>{answer.text}</p>
            </div>
            <p className="pg-meta">
              {answer.source === 'ai'
                ? 'Answered from this page by AI, using only its content.'
                : answer.source === 'page'
                  ? 'Answered from this page.'
                  : 'Not on this page.'}
              {answer.section ? (
                <>
                  {' '}
                  <a href={`#${answer.section}`}>Open {SECTION_LABEL[answer.section]}</a>
                </>
              ) : null}
            </p>
          </div>
        ) : null}

        <div className="pg-scene">
          <OfficeScene agents={agents} activity={activity} reduced={reduced} working={working} />
        </div>
      </div>
    </section>
  );
}
