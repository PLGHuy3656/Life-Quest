import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FoxController, FoxEventName, FoxEventPayloads, FoxEventResult } from '../mascot';
import { foxEventRegistry, type FoxActivity, type FoxMood } from '../mascot';
import { usePrefersReducedMotion } from './environment';

// App-level companion state + business event bus. Pages publish LifeQuest events
// (publish('TASK_COMPLETED')); every mounted companion receives them through its controller's
// handleEvent(). Pages never touch clips or morphs directly.

export type ReducedMotionSetting = 'auto' | 'on' | 'off';
export interface CompanionSettings { level: number; mood: FoxMood; activity: FoxActivity; interaction: boolean; lookAt: boolean; idleVariation: boolean; reducedMotion: ReducedMotionSetting; showProxies: boolean }
export interface EventLogEntry { id: number; at: number; name: string; results: { instance: string; result: FoxEventResult }[] }

interface Ctx {
  settings: CompanionSettings;
  update(p: Partial<CompanionSettings>): void;
  effectiveReducedMotion: boolean;
  publish<E extends FoxEventName>(name: E, payload?: FoxEventPayloads[E]): void;
  register(c: FoxController, meta: InstanceMeta): () => void;
  log: EventLogEntry[];
  modelUrl: string;
}
export interface InstanceMeta { presentation: string; label: string; stats(): Record<string, unknown> }

const CompanionCtx = createContext<Ctx | null>(null);
export const useCompanion = () => { const c = useContext(CompanionCtx); if (!c) throw new Error('CompanionProvider missing'); return c; };

const QS = new URLSearchParams(location.search);
export const MODEL_URL = QS.get('glb') ?? `${import.meta.env.BASE_URL}models/fox_v2_anim_e2.glb`;

declare global { interface Window { __foxSandbox?: Record<string, unknown> } }

export function CompanionProvider({ children }: { children: ReactNode }) {
  const prefersRM = usePrefersReducedMotion();
  const [settings, setSettings] = useState<CompanionSettings>({
    level: Number(QS.get('level') ?? 20), mood: 'neutral', activity: 'idle', interaction: true, lookAt: true, idleVariation: true,
    reducedMotion: (QS.get('rm') as ReducedMotionSetting) ?? 'auto', showProxies: false,
  });
  const instances = useRef(new Map<string, { c: FoxController; meta: InstanceMeta }>());
  const [log, setLog] = useState<EventLogEntry[]>([]);
  const seq = useRef(0);
  const effectiveReducedMotion = settings.reducedMotion === 'on' || (settings.reducedMotion === 'auto' && prefersRM);
  const update = useCallback((p: Partial<CompanionSettings>) => setSettings(s => ({ ...s, ...p })), []);

  const publish = useCallback(<E extends FoxEventName>(name: E, payload?: FoxEventPayloads[E]) => {
    const results: EventLogEntry['results'] = [];
    for (const [id, { c }] of instances.current) results.push({ instance: id, result: c.handleEvent(name as string, payload) });
    // business state the UI owns (the fox reflects it, it does not own it)
    if (name === 'LEVEL_UP' && payload && typeof (payload as { level?: number }).level === 'number') setSettings(s => ({ ...s, level: (payload as { level: number }).level }));
    if (name === 'USER_IDLE') setSettings(s => ({ ...s, activity: 'resting' }));
    if (name === 'USER_RETURNED' || name === 'APP_GREETING') setSettings(s => ({ ...s, activity: s.activity === 'resting' ? 'idle' : s.activity }));
    setLog(l => [{ id: ++seq.current, at: Date.now(), name, results }, ...l].slice(0, 12));
  }, []);

  const register = useCallback((c: FoxController, meta: InstanceMeta) => {
    instances.current.set(c.id, { c, meta });
    return () => { instances.current.delete(c.id); };
  }, []);

  // test / diagnostics hook (Playwright, GPU test)
  useEffect(() => {
    window.__foxSandbox = {
      ...(window.__foxSandbox ?? {}),
      instances: () => [...instances.current.entries()].map(([id, v]) => ({ id, ...v.meta, state: v.c.getState(), stats: { ...v.c.getStats(), ...v.meta.stats() } })),
      controller: (id?: string) => (id ? instances.current.get(id)?.c : [...instances.current.values()][0]?.c),
      controllers: () => [...instances.current.values()].map(v => v.c),
      publish, update, settings, registry: foxEventRegistry,
    };
  }, [publish, update, settings]);

  const value = useMemo(() => ({ settings, update, effectiveReducedMotion, publish, register, log, modelUrl: MODEL_URL }), [settings, update, effectiveReducedMotion, publish, register, log]);
  return <CompanionCtx.Provider value={value}>{children}</CompanionCtx.Provider>;
}
