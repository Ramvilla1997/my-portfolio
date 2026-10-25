'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { crewFor, phraseFor, type CrewMember } from '../agents/crew';
import { briefFor } from '../agents/brief';
import { findRole, ROOM_EFFECT, roster, timing, type AgentId, type Point, type SectionId } from '../agents/roster';
import { routeFromDesk, reversed, walkOf, workPointFor, type Walk } from '../agents/routes';
import { search } from '../agents/search';
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
  readonly crew: readonly AgentId[];
  readonly section: SectionId | null;
}

const ASK_TIMEOUT_MS = 12000;
const QUESTION_MAX = 200;
const NOTHING_FOUND = "I couldn't find that on this page. Try “Where did you work?” or “Which AWS services do you use?”";

const SECTION_LABEL: Record<SectionId, string> = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  resume: 'Resume',
};

function initialStates(): Record<AgentId, AgentState> {
  return Object.fromEntries(
    roster.map((role) => [role.id, { phase: 'idle', at: role.desk, walk: walkOf([role.desk]), note: null, startedAt: 0 }]),
  ) as Record<AgentId, AgentState>;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
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
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const move = useCallback((id: AgentId, phase: Phase, at: Point, walk: Walk, note: string | null) => {
    setAgents((previous) => ({
      ...previous,
      [id]: { phase, at, walk, note, startedAt: performance.now() },
    }));
  }, []);

  /* One crew member walks to its room, works there with the room's effect, reports back and returns to its desk. */
  const runCrew = useCallback(
    async ({ role, section }: CrewMember, seed: number) => {
      const scale = reduced ? 0 : 1;
      const out = walkOf(routeFromDesk(role, section));
      const back = walkOf(reversed(routeFromDesk(role, section)));
      const destination = workPointFor(section);

      move(role.id, 'walking', destination, out, phraseFor('walking', seed));
      await wait(out.seconds * 1000 * scale);
      if (!alive.current) return;

      move(role.id, 'working', destination, walkOf([destination]), phraseFor('working', seed));
      play(section, ROOM_EFFECT[section], timing.workMs * scale);
      await wait(timing.workMs * scale);
      if (!alive.current) return;

      move(role.id, 'done', destination, walkOf([destination]), phraseFor('done', seed));
      await wait(timing.returnMs / 2 * scale);
      if (!alive.current) return;

      move(role.id, 'walking', role.desk, back, null);
      await wait(back.seconds * 1000 * scale);
      if (!alive.current) return;

      move(role.id, 'idle', role.desk, walkOf([role.desk]), null);
    },
    [move, play, reduced],
  );

  const ask = useCallback(
    async (question: string) => {
      const hits = search(question);
      if (hits.length === 0) {
        setAnswer({ question, text: NOTHING_FOUND, source: 'none', crew: [], section: null });
        return;
      }
      setPending(true);
      const crew = crewFor(hits);
      const context = hits.map((hit) => hit.passage.text);
      const reply = requestAnswer(question, context);
      const runs = crew.map((member, index) => runCrew(member, index));
      await Promise.all(runs);
      const text = await reply;
      if (alive.current) {
        setAnswer({
          question,
          text: text ?? (hits[0] ? briefFor(hits[0].passage.text, question) : NOTHING_FOUND),
          source: text ? 'ai' : 'page',
          crew: crew.map((member) => member.role.id),
          section: crew[0]?.section ?? null,
        });
        setPending(false);
      }
    },
    [runCrew],
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

  const activity: Partial<Record<AgentId, string>> = {};
  for (const role of roster) {
    const state = agents[role.id];
    if (state.phase !== 'idle' && state.note) {
      activity[role.id] = state.note;
    }
  }

  return (
    <section id="workspace" className="playground" aria-labelledby="playground-title">
      <div className="wrap">
        <p className="eyebrow">Agent playground</p>
        <h2 id="playground-title">Ask the office.</h2>
        <p className="lede">Ask anything about this portfolio. Only the agents you need will leave their desks.</p>

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
            placeholder="Ask about projects, experience or skills"
          />
          <button type="submit" disabled={pending || draft.trim().length < 3}>
            {pending ? 'Working' : 'Ask'}
          </button>
        </form>

        {answer ? (
          <div className="pg-answer" aria-live="polite">
            <p className="pg-question">{answer.question}</p>
            <p className="pg-text">{answer.text}</p>
            <p className="pg-meta">
              {answer.crew.length > 0 ? `${answer.crew.map((id) => findRole(id).name).join(' and ')} answered. ` : ''}
              {answer.source === 'none' ? 'Not on this page.' : answer.source === 'ai' ? 'Answered from this page.' : 'From this page.'}
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
          <OfficeScene agents={agents} activity={activity} reduced={reduced} />
        </div>
      </div>
    </section>
  );
}
