'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { EffectKind, SectionId } from '../agents/roster';

export interface ActiveEffect {
  readonly section: SectionId;
  readonly kind: EffectKind;
  readonly key: number;
}

interface EffectsValue {
  readonly active: ActiveEffect | null;
  readonly play: (section: SectionId, kind: EffectKind, durationMs: number) => void;
}

const EffectsContext = createContext<EffectsValue | null>(null);

export function EffectsProvider({ children }: { readonly children: ReactNode }) {
  const [active, setActive] = useState<ActiveEffect | null>(null);
  const timer = useRef(0);
  const counter = useRef(0);

  const play = useCallback((section: SectionId, kind: EffectKind, durationMs: number) => {
    window.clearTimeout(timer.current);
    counter.current += 1;
    setActive({ section, kind, key: counter.current });
    if (durationMs <= 0) {
      setActive(null);
      return;
    }
    timer.current = window.setTimeout(() => setActive(null), durationMs);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const value = useMemo(() => ({ active, play }), [active, play]);
  return <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>;
}

export function useEffects(): EffectsValue {
  const value = useContext(EffectsContext);
  if (!value) {
    throw new Error('useEffects must be used inside EffectsProvider');
  }
  return value;
}

/* The effect currently playing on one section, or null. Sections use it to add a class or a canvas. */
export function useSectionEffect(section: SectionId): EffectKind | null {
  const { active } = useEffects();
  return active !== null && active.section === section ? active.kind : null;
}
