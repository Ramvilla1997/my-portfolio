'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { geminiBriefing, pageBriefing, type Briefing } from '../agents/briefing';
import { ROOM_EFFECT, roster, rooms, timing, type AgentId, type AgentRole, type Point, type SectionId } from '../agents/roster';
import { routeFromDesk, reversed, walkOf, workPointFor, type Walk } from '../agents/routes';
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

interface LogEntry {
  readonly key: number;
  readonly agent: AgentId;
  readonly text: string;
  readonly source: 'page' | 'gemini' | 'notice';
}

interface LiveItem {
  readonly key: number;
  readonly agent: AgentId;
  readonly text: string;
}

const LOG_LIMIT = 12;
const LIVE_LIMIT = 4;
const AUTO_WORK_MS = 1400;
const AUTO_GAP_MIN_MS = 9000;
const AUTO_GAP_MAX_MS = 14000;
const AUTO_FIRST_MS = 4000;
const PAUSE_AFTER_MANUAL_MS = 30000;
const VISIT_CHANCE = 0.5;

const SECTION_LABEL: Record<SectionId, string> = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  resume: 'Resume',
};

const PHASE_TEXT: Record<Phase, (role: AgentRole) => string> = {
  idle: () => 'At desk',
  walking: (role) => `Walking to ${SECTION_LABEL[role.section]}`,
  working: (role) => `Working in ${SECTION_LABEL[role.section]}`,
  done: () => 'Briefing filed',
};

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

function scrollToSection(section: SectionId, smooth: boolean): void {
  document.getElementById(section)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

export function Workspace() {
  const reduced = useReducedMotion() ?? false;
  const { play } = useEffects();
  const [agents, setAgents] = useState<Record<AgentId, AgentState>>(initialStates);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const [live, setLive] = useState<readonly LiveItem[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const alive = useRef(false);
  const keyRef = useRef(0);
  const lastManualRef = useRef(0);
  const cursorRef = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const move = useCallback((id: AgentId, phase: Phase, at: Point, walk: Walk, note?: string) => {
    setAgents((previous) => ({
      ...previous,
      [id]: { phase, at, walk, note: note ?? previous[id].note, startedAt: performance.now() },
    }));
  }, []);

  const append = useCallback((agent: AgentId, text: string, source: LogEntry['source']) => {
    keyRef.current += 1;
    const entry: LogEntry = { key: keyRef.current, agent, text, source };
    setLog((previous) => [entry, ...previous].slice(0, LOG_LIMIT));
  }, []);

  const pushLive = useCallback((agent: AgentId, text: string) => {
    keyRef.current += 1;
    const item: LiveItem = { key: keyRef.current, agent, text };
    setLive((previous) => [item, ...previous].slice(0, LIVE_LIMIT));
  }, []);

  const runTask = useCallback(
    async (role: AgentRole) => {
      if (busyRef.current) {
        return;
      }
      lastManualRef.current = Date.now();
      busyRef.current = true;
      setBusy(true);
      const workMs = reduced ? 0 : timing.workMs;
      const out = walkOf(routeFromDesk(role, role.section));
      const back = walkOf(reversed(routeFromDesk(role, role.section)));
      const outMs = reduced ? 0 : out.seconds * 1000;
      const backMs = reduced ? 0 : back.seconds * 1000;

      move(role.id, 'walking', role.work, out);
      await wait(outMs);
      if (!alive.current) return;

      move(role.id, 'working', role.work, walkOf([role.work]));
      play(role.section, role.effect, workMs);
      scrollToSection(role.section, !reduced);
      await wait(workMs);
      if (!alive.current) return;

      const briefing = pageBriefing(role.id);
      append(role.id, briefing, 'page');
      pushLive(role.id, briefing);
      move(role.id, 'done', role.work, walkOf([role.work]));
      await wait(reduced ? 0 : timing.returnMs / 2);
      if (!alive.current) return;

      move(role.id, 'walking', role.desk, back);
      await wait(backMs);
      if (!alive.current) return;

      move(role.id, 'idle', role.desk, walkOf([role.desk]));
      busyRef.current = false;
      setBusy(false);
    },
    [append, move, play, pushLive, reduced],
  );

  /* One small task for the next agent in turn. Sometimes it visits another room. It writes no log entry. */
  const autoStep = useCallback(async () => {
    if (busyRef.current) {
      return;
    }
    const role = roster[cursorRef.current % roster.length];
    cursorRef.current += 1;
    if (!role || role.idleTasks.length === 0) {
      return;
    }
    const visiting = Math.random() < VISIT_CHANCE;
    const others = rooms.filter((room) => room.id !== role.section);
    const target: SectionId = visiting && others.length > 0
      ? (others[Math.floor(Math.random() * others.length)]?.id ?? role.section)
      : role.section;
    const task = role.idleTasks[Math.floor(Math.random() * role.idleTasks.length)] ?? role.taskLabel;
    const note = target === role.section ? task : `Visiting ${SECTION_LABEL[target]}: ${task}`;

    const out = walkOf(routeFromDesk(role, target));
    const back = walkOf(reversed(routeFromDesk(role, target)));
    const destination = workPointFor(target);
    busyRef.current = true;
    setBusy(true);
    pushLive(role.id, note);

    move(role.id, 'walking', destination, out);
    await wait(out.seconds * 1000);
    if (!alive.current) return;

    move(role.id, 'working', destination, walkOf([destination]));
    play(target, ROOM_EFFECT[target], AUTO_WORK_MS);
    await wait(AUTO_WORK_MS);
    if (!alive.current) return;

    move(role.id, 'walking', role.desk, back, note);
    await wait(back.seconds * 1000);
    if (!alive.current) return;

    move(role.id, 'idle', role.desk, walkOf([role.desk]), note);
    busyRef.current = false;
    setBusy(false);
  }, [move, play, pushLive]);

  useEffect(() => {
    if (reduced) {
      return;
    }
    let timer = 0;
    const schedule = (delay: number) => {
      timer = window.setTimeout(async () => {
        const quiet = document.hidden || Date.now() - lastManualRef.current < PAUSE_AFTER_MANUAL_MS;
        if (!quiet) {
          await autoStep();
        }
        if (alive.current) {
          schedule(randomBetween(AUTO_GAP_MIN_MS, AUTO_GAP_MAX_MS));
        }
      }, delay);
    };
    schedule(AUTO_FIRST_MS);
    return () => window.clearTimeout(timer);
  }, [autoStep, reduced]);

  const askGemini = useCallback(
    async (role: AgentRole) => {
      const briefing: Briefing | null = await geminiBriefing(role.id);
      if (!alive.current) return;
      if (briefing) {
        append(briefing.agent, briefing.text, 'gemini');
        return;
      }
      append(role.id, 'Gemini is unavailable right now. The briefing from the page still applies.', 'notice');
    },
    [append],
  );

  const workingCount = roster.filter((role) => agents[role.id].phase !== 'idle').length;
  const liveHead = live[0];
  const liveRole = liveHead ? roster.find((role) => role.id === liveHead.agent) : undefined;

  return (
    <section id="workspace" className="workspace" aria-labelledby="workspace-title">
      <div className="wrap">
        <p className="eyebrow">Workspace</p>
        <h2 id="workspace-title">Four agents, four jobs.</h2>
        <p className="lede">
          Each agent works one room. Run a task and it walks to that section, does its job on the page, then returns to its desk.
        </p>

        <div className="ws-live" aria-live="polite">
          <span className="ws-live-dot" aria-hidden="true" />
          {liveRole && liveHead ? (
            <span>
              <strong>{liveRole.name}</strong> {liveHead.text}
            </span>
          ) : (
            <span>The agents are starting their first task.</span>
          )}
        </div>

        <div className="ws-grid">
          <OfficeScene agents={agents} reduced={reduced} working={workingCount} />

          <ul className="ws-roster">
            {roster.map((role) => {
              const state = agents[role.id];
              return (
                <li key={role.id} className="ws-card" style={{ borderColor: role.color }}>
                  <div className="ws-card-head">
                    <span className="ws-dot" style={{ background: role.color }} aria-hidden="true" />
                    <div>
                      <strong>{role.name}</strong>
                      <span className="ws-role"> · {role.role}</span>
                    </div>
                  </div>
                  <p className="ws-status" aria-live="polite">
                    {state.phase === 'idle' && state.note ? state.note : PHASE_TEXT[state.phase](role)}
                  </p>
                  <div className="ws-actions">
                    <button type="button" className="btn btn-primary" onClick={() => void runTask(role)} disabled={busy}>
                      {role.taskLabel}
                    </button>
                    <button type="button" className="btn" onClick={() => void askGemini(role)}>
                      Ask Gemini
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="ws-log-head">
          <h3>Activity</h3>
          <p>Briefings are built from this page's content. Gemini briefings are labelled.</p>
        </div>
        <ol className="ws-log" aria-live="polite">
          {log.length === 0 ? <li className="ws-log-empty">Nothing yet. Run a task to see a briefing here.</li> : null}
          {log.map((entry) => {
            const role = roster.find((candidate) => candidate.id === entry.agent);
            return (
              <li key={entry.key} className="ws-log-item">
                <span className="ws-dot" style={{ background: role ? role.color : 'transparent' }} aria-hidden="true" />
                <div>
                  <strong>{role?.name}</strong>
                  <span className={`ws-source ws-source--${entry.source}`}>
                    {entry.source === 'gemini' ? 'Gemini' : entry.source === 'page' ? 'From the page' : 'Notice'}
                  </span>
                  <p>{entry.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
