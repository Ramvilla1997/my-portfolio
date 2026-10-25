'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { geminiBriefing, pageBriefing, type Briefing } from '../agents/briefing';
import { roster, rooms, timing, type AgentId, type AgentRole, type Point, type SectionId } from '../agents/roster';
import { useEffects } from './EffectsContext';

type Phase = 'idle' | 'walking' | 'working' | 'done';

interface AgentState {
  readonly phase: Phase;
  readonly at: Point;
}

interface LogEntry {
  readonly key: number;
  readonly agent: AgentId;
  readonly text: string;
  readonly source: 'page' | 'gemini' | 'notice';
}

const LOG_LIMIT = 12;

const PHASE_TEXT: Record<Phase, (role: AgentRole) => string> = {
  idle: () => 'At desk',
  walking: (role) => `Walking to ${sectionLabel(role.section)}`,
  working: (role) => `Working in ${sectionLabel(role.section)}`,
  done: () => 'Briefing filed',
};

const SECTION_LABEL: Record<SectionId, string> = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  resume: 'Resume',
};

function sectionLabel(section: SectionId): string {
  return SECTION_LABEL[section];
}

function initialStates(): Record<AgentId, AgentState> {
  return Object.fromEntries(roster.map((role) => [role.id, { phase: 'idle', at: role.desk }])) as Record<AgentId, AgentState>;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function scrollToSection(section: SectionId, smooth: boolean): void {
  document.getElementById(section)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

function AgentSprite({ color }: { readonly color: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ color }}>
      <rect x="8" y="10" width="32" height="26" rx="10" fill="currentColor" />
      <circle cx="19" cy="22" r="3.4" fill="#fff" />
      <circle cx="29" cy="22" r="3.4" fill="#fff" />
      <circle cx="19.8" cy="22.4" r="1.5" fill="#15171c" />
      <circle cx="29.8" cy="22.4" r="1.5" fill="#15171c" />
      <path d="M18 29 Q24 33 30 29" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="13" y="36" width="6" height="7" rx="3" fill="currentColor" />
      <rect x="29" y="36" width="6" height="7" rx="3" fill="currentColor" />
      <line x1="24" y1="10" x2="24" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="3" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Workspace() {
  const reduced = useReducedMotion() ?? false;
  const { play } = useEffects();
  const [agents, setAgents] = useState<Record<AgentId, AgentState>>(initialStates);
  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const alive = useRef(false);
  const keyRef = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const move = useCallback((id: AgentId, phase: Phase, at: Point) => {
    setAgents((previous) => ({ ...previous, [id]: { phase, at } }));
  }, []);

  const append = useCallback((agent: AgentId, text: string, source: LogEntry['source']) => {
    keyRef.current += 1;
    const entry: LogEntry = { key: keyRef.current, agent, text, source };
    setLog((previous) => [entry, ...previous].slice(0, LOG_LIMIT));
  }, []);

  const runTask = useCallback(
    async (role: AgentRole) => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      setBusy(true);
      const walkMs = reduced ? 0 : timing.walkMs;
      const workMs = reduced ? 0 : timing.workMs;
      const returnMs = reduced ? 0 : timing.returnMs;

      move(role.id, 'walking', role.work);
      await wait(walkMs);
      if (!alive.current) return;

      move(role.id, 'working', role.work);
      play(role.section, role.effect, workMs);
      scrollToSection(role.section, !reduced);
      await wait(workMs);
      if (!alive.current) return;

      append(role.id, pageBriefing(role.id), 'page');
      move(role.id, 'done', role.work);
      await wait(returnMs / 2);
      if (!alive.current) return;

      move(role.id, 'walking', role.desk);
      await wait(returnMs);
      if (!alive.current) return;

      move(role.id, 'idle', role.desk);
      busyRef.current = false;
      setBusy(false);
    },
    [append, move, play, reduced],
  );

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

  return (
    <section id="workspace" className="workspace" aria-labelledby="workspace-title">
      <div className="wrap">
        <p className="eyebrow">Workspace</p>
        <h2 id="workspace-title">Four agents, four jobs.</h2>
        <p className="lede">
          Each agent works one room. Run a task and it walks to that section, does its job on the page, then returns to its desk.
        </p>

        <div className="ws-grid">
          <div className="ws-floor" aria-hidden="true">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="ws-room"
                style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
              >
                <span className="ws-room-label">{room.label}</span>
              </div>
            ))}
            {roster.map((role) => {
              const state = agents[role.id];
              return (
                <motion.div
                  key={role.id}
                  className="ws-agent"
                  style={{ color: role.color }}
                  initial={false}
                  animate={{ left: `${state.at.x}%`, top: `${state.at.y}%` }}
                  transition={{ duration: reduced ? 0 : timing.walkMs / 1000, ease: [0.4, 0, 0.2, 1] }}
                >
                  {state.phase === 'working' && !reduced ? <span className="ws-pulse" /> : null}
                  <span className="ws-sprite">
                    <AgentSprite color={role.color} />
                  </span>
                  <span className="ws-tag">{role.name}</span>
                </motion.div>
              );
            })}
          </div>

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
                  <p className="ws-status" aria-live="polite">{PHASE_TEXT[state.phase](role)}</p>
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
