import { useEffect, useRef, useState } from 'react';
import { useCompanion } from '../components/CompanionContext';
import { FoxCanvas } from '../components/FoxCanvas';
import { CLIP_CATEGORY, CLIP_META, FX_CATEGORIES, STREAK_TIERS, foxEventRegistry, type FoxClipName, type FoxController, type FoxEventName, type FxCategory } from '../mascot';
import { runG1Tests, type G1TestResult } from './g1Tests';

// Gate G1 technical test harness (not a LifeQuest screen): animation selector, streak-tier selector,
// event triggers, transition & priority tests, effect visibility controls, live runtime state.

declare global { interface Window { __g1?: Record<string, unknown> } }
const GROUPS: [string, FoxClipName[]][] = (['core', 'quest', 'rewards', 'streak'] as const).map(g => [g, (Object.keys(CLIP_META) as FoxClipName[]).filter(k => CLIP_CATEGORY[k] === g)]);

export function G1LabPage() {
  const { settings, update } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [clip, setClip] = useState<FoxClipName>('quest_complete');
  const [tier, setTier] = useState<'off' | (typeof STREAK_TIERS)[number]>('off');
  const [days, setDays] = useState(7);
  const [fxOn, setFxOn] = useState(true);
  const [cats, setCats] = useState<Record<FxCategory, boolean>>(() => Object.fromEntries(FX_CATEGORIES.map(c => [c, true])) as Record<FxCategory, boolean>);
  const [tests, setTests] = useState<G1TestResult[] | null>(null);
  const [state, setState] = useState<ReturnType<FoxController['getState']> | null>(null);
  const [stats, setStats] = useState<ReturnType<FoxController['getStats']> | null>(null);

  useEffect(() => {
    const t = setInterval(() => { const c = ctrl.current; if (c) { setState(c.getState()); setStats(c.getStats()); } }, 300);
    window.__g1 = { controller: () => ctrl.current, runTests: () => (ctrl.current ? runG1Tests(ctrl.current) : []) };
    return () => clearInterval(t);
  }, []);

  const c = ctrl.current;
  const applyStreak = (t: typeof tier, d = days) => { setTier(t); c?.setStreak(t === 'off' ? { active: false } : { active: true, tier: t }); void d; };
  return (
    <div className="page g1lab">
      <section className="card g1-stage">
        <FoxCanvas presentation="full" label="Fox G1 test stage" orbit onController={x => { ctrl.current = x; }} className="g1-canvas" />
        <div className="g1-hud mono small">
          {state ? <>shot <b>{state.oneShot ?? '—'}</b> · base <b>{state.base}</b> · Lv {state.level} ({state.scale.toFixed(3)}×) · streak {state.streak.active ? state.streak.tier : 'off'} · fx {stats?.effects.active ?? 0}{stats?.effects.char ? ` · char ${stats.effects.char}` : ''}</> : 'loading…'}
        </div>
      </section>
      <aside className="panel g1-panel">
        <div className="card">
          <h2>Animation <span className="muted small">play()</span></h2>
          <div className="row">
            <select value={clip} onChange={e => setClip(e.target.value as FoxClipName)} aria-label="Animation">
              {GROUPS.map(([g, list]) => <optgroup key={g} label={g}>{list.map(k => <option key={k} value={k}>{k}{CLIP_META[k].loop ? ' (loop)' : ''}</option>)}</optgroup>)}
            </select>
            <button className="btn small" onClick={() => c?.play(clip, { priority: 60 })}>▶ Play</button>
            <button className="btn ghost small" onClick={() => { c?.debug.anim.cancelOneShots(); c?.setStreak({ active: false }); setTier('off'); }}>■ Stop</button>
          </div>
          <div className="muted small">{CLIP_META[clip].durationS.toFixed(3)} s · head {CLIP_META[clip].headControl} · face {CLIP_META[clip].faceControl}{CLIP_META[clip].largeMotion ? ' · large motion' : ''}</div>
        </div>
        <div className="card">
          <h2>Streak <span className="muted small">setStreak()</span></h2>
          <div className="row wrap">{(['off', ...STREAK_TIERS] as const).map(t => <button key={t} className={`chip ${tier === t ? 'on' : ''}`} onClick={() => applyStreak(t)}>{t}</button>)}</div>
          <div className="row"><span className="small">days</span><input type="number" min={0} max={400} value={days} onChange={e => setDays(+e.target.value)} style={{ width: 70 }} />
            <button className="btn ghost small" onClick={() => { c?.setStreak({ active: true, days }); setTier(c?.getStreak().tier ?? 'orange'); }}>Apply days</button></div>
        </div>
        <div className="card">
          <h2>Events <span className="muted small">handleEvent()</span></h2>
          <div className="event-list">
            {foxEventRegistry.list().map(ev => (
              <button key={ev.name} className="event-btn" title={ev.note} onClick={() => c?.handleEvent(ev.name as FoxEventName, (ev.name === 'LEVEL_UP' ? { level: settings.level + 1 } : ev.name.startsWith('STREAK_') && ev.name !== 'STREAK_LOST' ? { days } : undefined) as never)}>
                <span>{ev.name}</span><span className="row" style={{ margin: 0, gap: 4 }}>{ev.since === 'G1' && <span className="cov g1">G1</span>}<span className={`cov ${ev.coverage}`}>{ev.coverage}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Effects</h2>
          <label className="toggle"><input type="checkbox" checked={fxOn} onChange={e => { setFxOn(e.target.checked); c?.setEffectsEnabled(e.target.checked); }} /> All effects</label>
          <div className="row wrap">{FX_CATEGORIES.map(k => <label key={k} className="toggle small"><input type="checkbox" checked={cats[k]} onChange={e => { setCats(s => ({ ...s, [k]: e.target.checked })); c?.setEffectVisible(k, e.target.checked); }} /> {k}</label>)}</div>
          <div className="row"><span className="small">Level</span><input type="range" min={1} max={40} value={settings.level} onChange={e => update({ level: +e.target.value })} /><b className="num">Lv {settings.level}</b></div>
          <label className="toggle"><input type="checkbox" checked={settings.reducedMotion === 'on'} onChange={e => update({ reducedMotion: e.target.checked ? 'on' : 'auto' })} /> Reduced motion</label>
          <label className="toggle"><input type="checkbox" checked={settings.showProxies} onChange={e => update({ showProxies: e.target.checked })} /> Hit proxies</label>
        </div>
        <div className="card">
          <h2>Transition &amp; priority tests</h2>
          <button className="btn small" onClick={() => c && setTests(runG1Tests(c))}>Run tests</button>
          {tests && <ul className="tests">{tests.map(t => <li key={t.name} className={t.pass ? 'ok' : 'bad'} title={JSON.stringify(t.detail)}>{t.pass ? 'PASS' : 'FAIL'} — {t.name}</li>)}</ul>}
        </div>
        <div className="card perf">
          <h2>Runtime</h2>
          <dl>
            <dt>Modules</dt><dd>{stats?.modules.map(m => `${m.id}: ${m.ok ? 'OK' : 'REJECTED'} · ${m.boundTracks}/${m.tracks} tracks`).join(' · ') || '–'}</dd>
            <dt>Clips</dt><dd>{stats?.availableClips ?? '–'}</dd>
            <dt>Effects</dt><dd>{stats ? `${stats.effects.active} active ${JSON.stringify(stats.effects.byCategory)} · fx objects ${stats.effects.rootObjects}` : '–'}</dd>
            <dt>Flame</dt><dd>{stats ? `${stats.effects.streak.active ? stats.effects.streak.tier : 'off'} ${stats.effects.streak.colors.mid}` : '–'}</dd>
          </dl>
        </div>
      </aside>
    </div>
  );
}
