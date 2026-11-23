import { useEffect, useRef, useState } from 'react';
import { useCompanion } from '../components/CompanionContext';
import { FoxCanvas } from '../components/FoxCanvas';
import { CLIP_CATEGORY, CLIP_META, FOX_STATE_DEFS, foxEventRegistry, type FoxClipName, type FoxController, type FoxEventName } from '../mascot';
import { runG2FallbackTests, runG2Tests, type G2TestResult } from './g2Tests';

// Gate G2 technical harness (not a LifeQuest screen): daily-life states, G2 events, cooldown data,
// presentation parameters, effect quality, transition / priority / interaction tests, live state.

declare global { interface Window { __g2?: Record<string, unknown> } }
const G2_CATS = ['study', 'sports', 'wake_alarm', 'sleep', 'cooldown'] as const;
const GROUPS: [string, FoxClipName[]][] = G2_CATS.map(g => [g, (Object.keys(CLIP_META) as FoxClipName[]).filter(k => CLIP_CATEGORY[k] === g)]);
const G2_EVENTS = foxEventRegistry.list().filter(e => e.since === 'G2');
const DAILY_STATES = ['alarm', 'sleep', 'sports', 'study', 'cooldown'] as const;
type DailyState = (typeof DAILY_STATES)[number];
const ENTER: Record<DailyState, FoxEventName> = { study: 'STUDY_STARTED', sports: 'SPORTS_STARTED', sleep: 'SLEEP_ENTERED', alarm: 'ALARM_STARTED', cooldown: 'COOLDOWN_STARTED' };
const EXIT: Record<DailyState, FoxEventName> = { study: 'STUDY_COMPLETED', sports: 'SPORTS_COMPLETED', sleep: 'SLEEP_ENDED', alarm: 'ALARM_DISMISSED', cooldown: 'COOLDOWN_COMPLETED' };

export function G2LabPage() {
  const { settings, update } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [clip, setClip] = useState<FoxClipName>('study_start');
  const [progress, setProgress] = useState(0.3);
  const [impatience, setImpatience] = useState(20);
  const [low, setLow] = useState(false);
  const [tests, setTests] = useState<G2TestResult[] | null>(null);
  const [state, setState] = useState<ReturnType<FoxController['getState']> | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const t = setInterval(() => { const c = ctrl.current; if (c) setState(c.getState()); }, 300);
    window.__g2 = { controller: () => ctrl.current, runTests: () => (ctrl.current ? runG2Tests(ctrl.current) : []), runFallbackTests: () => (ctrl.current ? runG2FallbackTests(ctrl.current) : []) };
    return () => clearInterval(t);
  }, []);
  const onCtrl = (x: FoxController | null) => {
    ctrl.current = x;
    x?.on(e => { if (e.type === 'state' || e.type === 'alarm-visual' || e.type === 'cooldown') setLog(l => [`${e.type} ${'state' in e ? `${e.state} ${e.phase}` : JSON.stringify(e)}`, ...l].slice(0, 8)); });
  };
  const c = ctrl.current;
  const d = state?.daily;
  return (
    <div className="page g1lab g2lab">
      <section className="card g1-stage g2-stage">
        <FoxCanvas presentation="full" label="Fox G2 test stage" orbit onController={onCtrl} className="g1-canvas" />
        <div className="g1-hud g2-hud mono small">
          {state ? <>shot <b>{state.oneShot ?? '—'}</b> · base <b>{state.base}</b> · state <b>{d?.visible ?? 'idle'}</b>{d && d.active.length > 1 ? ` (+${d.active.slice(1).join(',')})` : ''} · props {state.props.map(p => p.id).join(',') || '—'} · fx {state.stateFx.join(',') || '—'}</> : 'loading…'}
        </div>
      </section>
      <aside className="panel g1-panel">
        <div className="card">
          <h2>Daily-life states <span className="muted small">handleEvent()</span></h2>
          {DAILY_STATES.map(s => (
            <div className="row" key={s}>
              <b style={{ width: 74 }}>{s}</b><span className="muted small" style={{ width: 34 }}>{FOX_STATE_DEFS[s].priority}</span>
              <button className="btn small" onClick={() => c?.handleEvent(ENTER[s], (s === 'cooldown' ? { progress } : undefined) as never)}>{ENTER[s]}</button>
              <button className="btn ghost small" onClick={() => c?.handleEvent(EXIT[s])}>{EXIT[s]}</button>
            </div>
          ))}
          <div className="row wrap">
            <button className="btn ghost small" onClick={() => c?.handleEvent('WAKE_REQUESTED')}>WAKE_REQUESTED</button>
            <button className="btn ghost small" onClick={() => c?.handleEvent('WAKE_LATE')}>WAKE_LATE</button>
            <button className="btn ghost small" onClick={() => c?.handleEvent('ALARM_DISMISSED', { snoozed: true })}>ALARM snooze</button>
          </div>
          <ul className="mono small evlog">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
        <div className="card">
          <h2>Cooldown data <span className="muted small">setCooldown()</span></h2>
          <div className="row"><span className="small">progress</span><input type="range" min={0} max={1} step={0.01} value={progress} onChange={e => { setProgress(+e.target.value); c?.setCooldown({ progress: +e.target.value }); }} /><b className="num">{Math.round(progress * 100)}%</b></div>
          <div className="row"><span className="small">impatience after (s)</span><input type="number" min={0} max={600} value={impatience} onChange={e => { setImpatience(+e.target.value); c?.setDailyTuning({ impatienceAfterS: +e.target.value }); }} style={{ width: 70 }} /></div>
          <div className="muted small">{d ? `progress ${d.cooldown.progress} · impatient ${d.cooldown.impatient}` : ''}</div>
        </div>
        <div className="card">
          <h2>Animation <span className="muted small">play()</span></h2>
          <div className="row">
            <select value={clip} onChange={e => setClip(e.target.value as FoxClipName)} aria-label="Animation">
              {GROUPS.map(([g, list]) => <optgroup key={g} label={g}>{list.map(k => <option key={k} value={k}>{k}{CLIP_META[k].loop ? ' (loop)' : ''}</option>)}</optgroup>)}
            </select>
            <button className="btn small" onClick={() => c?.play(clip, { priority: 60 })}>▶ Play</button>
            <button className="btn ghost small" onClick={() => { c?.debug.daily.clear(); c?.debug.anim.cancelOneShots(); c?.setActivity('idle'); }}>■ Reset</button>
          </div>
          <div className="muted small">{CLIP_META[clip].durationS.toFixed(3)} s · head {CLIP_META[clip].headControl} · face {CLIP_META[clip].faceControl}{CLIP_META[clip].largeMotion ? ' · large motion' : ''}{CLIP_META[clip].loop ? ' · state loop (use the state buttons)' : ''}</div>
        </div>
        <div className="card">
          <h2>Effects &amp; display</h2>
          <label className="toggle"><input type="checkbox" checked={low} onChange={e => { setLow(e.target.checked); c?.setLowCostEffects(e.target.checked); }} /> Low-cost effects (small displays)</label>
          <div className="row"><span className="small">Level</span><input type="range" min={1} max={40} value={settings.level} onChange={e => update({ level: +e.target.value })} /><b className="num">Lv {settings.level}</b></div>
          <label className="toggle"><input type="checkbox" checked={settings.reducedMotion === 'on'} onChange={e => update({ reducedMotion: e.target.checked ? 'on' : 'auto' })} /> Reduced motion</label>
        </div>
        <div className="card">
          <h2>G2 events</h2>
          <div className="event-list">{G2_EVENTS.map(ev => <button key={ev.name} className="event-btn" title={ev.note} onClick={() => c?.handleEvent(ev.name as FoxEventName)}><span>{ev.name}</span><span className="cov g1">G2</span></button>)}</div>
        </div>
        <div className="card">
          <h2>Transition &amp; priority tests</h2>
          <button className="btn small" onClick={() => c && setTests(runG2Tests(c))}>Run tests</button>
          {tests && <ul className="tests">{tests.map(t => <li key={t.name} className={t.pass ? 'ok' : 'bad'} title={JSON.stringify(t.detail)}>{t.pass ? 'PASS' : 'FAIL'} — {t.name}</li>)}</ul>}
        </div>
      </aside>
    </div>
  );
}
