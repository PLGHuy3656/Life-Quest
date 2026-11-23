import { useEffect, useRef, useState } from 'react';
import { useCompanion } from '../components/CompanionContext';
import { FoxCanvas } from '../components/FoxCanvas';
import {
  CLIP_CATEGORY, CLIP_META, OUTFIT_IDS, foxEventRegistry,
  type FoxClipName, type FoxController, type FoxEventName, type OutfitId,
} from '../mascot';
import { runVoiceFallbackTests, runVoiceTests, type VoiceTestResult } from './voiceTests';

declare global { interface Window { __voice?: Record<string, unknown> } }

const VOICE_CLIPS = (Object.keys(CLIP_META) as FoxClipName[]).filter(k => CLIP_CATEGORY[k] === 'voice_assistant');
const VOICE_EVENTS = foxEventRegistry.list().filter(e => e.since === 'I');

export function VoiceLabPage() {
  const { settings, update } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [clip, setClip] = useState<FoxClipName>('voice_listen_start');
  const [outfit, setOutfit] = useState<OutfitId | 'default'>('default');
  const [tests, setTests] = useState<VoiceTestResult[] | null>(null);
  const [state, setState] = useState<ReturnType<FoxController['getState']> | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const t = setInterval(() => { const c = ctrl.current; if (c) setState(c.getState()); }, 250);
    window.__voice = {
      controller: () => ctrl.current,
      runTests: () => (ctrl.current ? runVoiceTests(ctrl.current) : []),
      runFallbackTests: () => (ctrl.current ? runVoiceFallbackTests(ctrl.current) : []),
    };
    return () => clearInterval(t);
  }, []);

  const onCtrl = (x: FoxController | null) => {
    ctrl.current = x;
    x?.on(e => {
      if (e.type === 'state' || e.type === 'oneshot-start' || e.type === 'event') {
        setLog(l => [`${e.type}: ${'clip' in e ? e.clip : 'state' in e ? `${e.state} (${e.phase})` : e.name}`, ...l].slice(0, 10));
      }
    });
  };

  const c = ctrl.current;
  const d = state?.daily;

  const applyOutfit = async (id: OutfitId | 'default') => {
    setOutfit(id);
    if (!c) return;
    if (id === 'default') c.resetOutfit();
    else await c.setOutfit(id);
  };

  return (
    <div className="page g1lab g2lab">
      <section className="card g1-stage voice-stage">
        <FoxCanvas presentation="full" label="Fox Gate I voice assistant stage" orbit onController={onCtrl} className="g1-canvas" />
        <div className="g1-hud mono small">
          {state
            ? <>shot <b>{state.oneShot ?? '—'}</b> · base <b>{state.base}</b> · state <b>{d?.visible ?? 'idle'}</b> · props {state.props.map(p => p.id).join(',') || '—'} · fx {state.stateFx.join(',') || '—'}</>
            : 'loading…'}
        </div>
      </section>
      <aside className="panel g1-panel">
        <div className="card">
          <h2>Voice → Task sequence <span className="muted small">handleEvent()</span></h2>
          <div className="event-list">
            {VOICE_EVENTS.map(ev => (
              <button key={ev.name} className="event-btn" title={ev.note} onClick={() => c?.handleEvent(ev.name as FoxEventName)}>
                <span>{ev.name}</span><span className="cov g1">I</span>
              </button>
            ))}
          </div>
          <ul className="mono small evlog">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
        <div className="card">
          <h2>Voice clips <span className="muted small">8 clips</span></h2>
          <div className="row">
            <select value={clip} onChange={e => setClip(e.target.value as FoxClipName)} aria-label="Voice clip">
              {VOICE_CLIPS.map(k => <option key={k} value={k}>{k}{CLIP_META[k].loop ? ' (loop)' : ''}</option>)}
            </select>
            <button className="btn small" onClick={() => c?.play(clip, { priority: 60 })}>▶ Play</button>
            <button className="btn ghost small" onClick={() => c?.handleEvent('VOICE_CANCELLED')}>■ Cancel</button>
          </div>
        </div>
        <div className="card">
          <h2>Outfit &amp; Display</h2>
          <div className="row">
            <select value={outfit} onChange={e => void applyOutfit(e.target.value as OutfitId | 'default')} aria-label="Outfit">
              <option value="default">Default (scarf + backpack)</option>
              {OUTFIT_IDS.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          <div className="row"><span className="small">Level</span><input type="range" min={1} max={40} value={settings.level} onChange={e => update({ level: +e.target.value })} /><b className="num">Lv {settings.level}</b></div>
          <label className="toggle"><input type="checkbox" checked={settings.reducedMotion === 'on'} onChange={e => update({ reducedMotion: e.target.checked ? 'on' : 'auto' })} /> Reduced motion</label>
        </div>
        <div className="card">
          <h2>Gate I Voice Tests</h2>
          <button className="btn small" onClick={() => { if (c) void runVoiceTests(c).then(setTests); }}>Run voice suite</button>
          {tests && <ul className="tests">{tests.map(t => <li key={t.name} className={t.pass ? 'ok' : 'bad'} title={JSON.stringify(t.detail)}>{t.pass ? 'PASS' : 'FAIL'} — {t.name}</li>)}</ul>}
        </div>
      </aside>
    </div>
  );
}
