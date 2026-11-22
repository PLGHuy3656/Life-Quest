import { useEffect, useRef, useState } from 'react';
import { useCompanion } from '../components/CompanionContext';
import { FoxCanvas } from '../components/FoxCanvas';
import { MultiFoxStage } from '../components/MultiFoxStage';
import { CLIP_CATEGORY, CLIP_META, FoxDuoCoordinator, FoxGroupEffectCoordinator, foxEventRegistry, type FoxClipName, type FoxController, type FoxEventName } from '../mascot';
import { G3_EVENTS, measureRender, runG3FallbackTests, runG3MultiTests, runG3Tests, type G3TestResult } from './g3Tests';

// Gate G3 technical harness (not a LifeQuest screen): challenge / duo-group / private-social events on one fox, and a
// multi-fox stage (one canvas, one scene) for the duo high-five and group effects through FoxChoreographyManager.

declare global { interface Window { __g3?: Record<string, unknown> } }
const CATS = ['challenge', 'duo_group', 'social'] as const;
// ?stage=single | multi | both (default): capture scripts render only the stage they record (software rendering is slow)
const STAGE = new URLSearchParams(location.search).get('stage') ?? 'both';
const GROUPS: [string, FoxClipName[]][] = CATS.map(g => [g, (Object.keys(CLIP_META) as FoxClipName[]).filter(k => CLIP_CATEGORY[k] === g)]);

export function G3LabPage() {
  const { settings, update } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [countdown, setCountdown] = useState('3');
  const [members, setMembers] = useState(4);
  const [levels, setLevels] = useState<number[]>([20, 20, 20]);
  const [tests, setTests] = useState<G3TestResult[] | null>(null);
  const [state, setState] = useState<ReturnType<FoxController['getState']> | null>(null);

  useEffect(() => {
    const t = setInterval(() => { const c = ctrl.current; if (c) setState(c.getState()); }, 300);
    const multi = () => window.__g3multi!;
    window.__g3 = {
      controller: () => ctrl.current,
      runTests: () => (ctrl.current ? runG3Tests(ctrl.current) : []),
      runFallbackTests: () => (ctrl.current ? runG3FallbackTests(ctrl.current) : []),
      runMultiTests: () => { (window as unknown as { __g3multiHold?: boolean }).__g3multiHold = true; try { return runG3MultiTests(multi()); } finally { (window as unknown as { __g3multiHold?: boolean }).__g3multiHold = false; } },
      measure: () => measureRender(multi()),
      // only the foxes taking part are drawn (render counts then measure 1 / 2 / 3 instances honestly)
      duo: (lv?: number[], solo = false) => { const m = multi(); m.manager.cancelAll(); if (lv) m.foxes.forEach((f, i) => f.setLevel(lv[i] ?? 20, { immediate: true })); m.foxes.forEach((f, i) => { f.object3D.visible = i === 0 || (!solo && i === 1); }); const d = new FoxDuoCoordinator(m.manager, m.foxes[0], solo ? null : m.foxes[1]); d.layout(); d.start(); return d; },
      group: (mode: 'symbolic' | 'multi' = 'multi') => { const m = multi(); m.manager.cancelAll(); m.foxes.forEach((f, i) => { f.object3D.visible = mode === 'multi' || i === 0; }); const g = new FoxGroupEffectCoordinator(m.manager, mode === 'multi' ? m.foxes : [m.foxes[0]], { mode, members }); g.layout(); g.start(); return g; },
      setLevels,
    };
    return () => clearInterval(t);
  }, [members]);
  const c = ctrl.current;
  const fire = (e: FoxEventName) => {
    if (e === 'CHALLENGE_STARTED') c?.setChallengeCountdown(countdown === '' ? null : (Number.isFinite(+countdown) ? +countdown : countdown));
    c?.handleEvent(e, (e === 'GROUP_VICTORY' || e === 'GROUP_STREAK_ACTIVE' ? { members, days: 9 } : undefined) as never);
  };
  return (
    <div className="page g1lab g3lab">
      {STAGE !== 'multi' && <section className="card g1-stage g3-stage">
        <FoxCanvas presentation="full" label="Fox G3 test stage" orbit onController={x => { ctrl.current = x; }} className="g1-canvas" />
        <div className="g1-hud mono small">{state ? <>shot <b>{state.oneShot ?? '—'}</b> · base <b>{state.base}</b> · props {state.props.map(p => p.id).join(',') || '—'} · streak {state.streak.active ? state.streak.tier : 'off'}</> : 'loading…'}</div>
      </section>}
      <aside className="panel g1-panel">
        <div className="card">
          <h2>G3 events <span className="muted small">handleEvent()</span></h2>
          <div className="row wrap">{G3_EVENTS.map(e => <button key={e} className="btn small" title={foxEventRegistry.get(e)?.note} onClick={() => fire(e)}>{e}</button>)}</div>
          <div className="row"><label className="small">countdown data <input className="mono" style={{ width: 52 }} value={countdown} onChange={x => setCountdown(x.target.value)} /></label>
            <label className="small">team members <input type="number" min={1} max={8} value={members} onChange={x => setMembers(+x.target.value)} style={{ width: 48 }} /></label></div>
          <div className="row"><label className="small"><input type="checkbox" checked={settings.reducedMotion === 'on'} onChange={x => update({ reducedMotion: x.target.checked ? 'on' : 'off' })} /> reduced motion</label>
            <label className="small">level <input type="range" min={1} max={30} value={settings.level} onChange={x => update({ level: +x.target.value })} /> {settings.level}</label></div>
        </div>
        <div className="card">
          <h2>Clips</h2>
          {GROUPS.map(([g, list]) => <div key={g} className="row wrap"><b className="small" style={{ width: 70 }}>{g}</b>{list.map(n => <button key={n} className="btn ghost small" onClick={() => c?.play(n)}>{n}</button>)}</div>)}
        </div>
        <div className="card">
          <h2>Tests</h2>
          <div className="row wrap">
            <button className="btn small" onClick={() => c && setTests(runG3Tests(c))}>runG3Tests</button>
            <button className="btn ghost small" onClick={() => { (window as unknown as { __g3multiHold?: boolean }).__g3multiHold = true; try { setTests(runG3MultiTests(window.__g3multi!)); } finally { (window as unknown as { __g3multiHold?: boolean }).__g3multiHold = false; } }}>runG3MultiTests</button>
          </div>
          {tests && <ul className="small mono">{tests.map(t => <li key={t.name} style={{ color: t.pass ? '#168C78' : '#C2410C' }}>{t.pass ? 'PASS' : 'FAIL'} {t.name}</li>)}</ul>}
        </div>
      </aside>
      <section className="card g3-multi-card">
        <h2>Duo / group stage <span className="muted small">one canvas · one scene · FoxChoreographyManager</span></h2>
        <div className="row wrap">
          <button className="btn small" onClick={() => (window.__g3!.duo as (l?: number[]) => void)([levels[0], levels[1]])}>Duo high-five</button>
          <button className="btn ghost small" onClick={() => (window.__g3!.duo as (l?: number[], s?: boolean) => void)(undefined, true)}>Solo high-five</button>
          <button className="btn small" onClick={() => (window.__g3!.group as (m: string) => void)('multi')}>Group (3 foxes)</button>
          <button className="btn ghost small" onClick={() => (window.__g3!.group as (m: string) => void)('symbolic')}>Group (1 fox + markers)</button>
          {[0, 1, 2].map(i => <label key={i} className="small">Lv{i + 1} <input type="number" min={1} max={30} value={levels[i]} style={{ width: 44 }} onChange={x => setLevels(l => l.map((v, k) => (k === i ? +x.target.value : v)))} /></label>)}
        </div>
        {STAGE !== 'single' && <MultiFoxStage count={3} levels={levels} label="Duo and group test stage" />}
      </section>
    </div>
  );
}
