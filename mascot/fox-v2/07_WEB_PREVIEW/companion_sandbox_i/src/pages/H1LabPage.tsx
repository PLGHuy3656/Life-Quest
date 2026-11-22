import { useEffect, useRef, useState } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { useCompanion } from '../components/CompanionContext';
import { FoxCanvas } from '../components/FoxCanvas';
import { COSMETIC_SLOTS, OUTFIT_PRESETS, cosmeticCacheState, purgeCosmeticCache, type CosmeticSlot, type EquippedItem, type FoxController, type OutfitPresetId } from '../mascot';
import { H1_REQUIRED_CLIPS, resetFox, runH1Tests, startClip, type H1TestResult } from './h1Tests';
import { runH2Tests } from './h2Tests';

// Gate H1 technical harness (not a LifeQuest screen): persistent cosmetic slots on the approved Fox — slot selection,
// equip / unequip, outfit presets, animation compatibility runs, level scaling and front / side / 3/4 cameras.

declare global { interface Window { __h1?: Record<string, unknown> } }
type View = 'front' | 'side' | '34' | 'back';
const VIEW_AZ: Record<View, number> = { front: 0, '34': 38, side: 90, back: 180 };

export function H1LabPage() {
  const { settings, update } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [equipped, setEquipped] = useState<EquippedItem[]>([]);
  const [tests, setTests] = useState<H1TestResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>('34');
  const [clip, setClip] = useState<string>('—');
  const [log, setLog] = useState<string[]>([]);

  const setCamera = (v: View) => {
    const c = ctrl.current; const cam = c?.debug.camera as PerspectiveCamera | null; if (!c || !cam) return;
    const target = new Vector3(0, 0.42 * c.scale, 0);
    const dist = 2.75; const a = (VIEW_AZ[v] * Math.PI) / 180;
    cam.position.set(target.x + dist * Math.sin(a), target.y + 0.22, target.z + dist * Math.cos(a));
    cam.lookAt(target); cam.updateMatrixWorld(); setView(v);
  };
  useEffect(() => {
    const t = setInterval(() => { const c = ctrl.current; if (c) setEquipped(c.getEquippedItems()); }, 250);
    window.__h1 = {
      controller: () => ctrl.current,
      runTests: (gl?: unknown) => (ctrl.current ? runH1Tests(ctrl.current, gl as never) : Promise.resolve([])),
      runH2Tests: () => (ctrl.current ? runH2Tests(ctrl.current) : Promise.resolve([])),
      setCamera, resetFox: () => ctrl.current && resetFox(ctrl.current), startClip: (n: string) => ctrl.current && startClip(ctrl.current, n as never),
      clips: H1_REQUIRED_CLIPS, purge: purgeCosmeticCache, cacheState: cosmeticCacheState,
    };
    return () => clearInterval(t);
  }, []);
  const c = ctrl.current;
  const onEvent = (e: { type: string } & Record<string, unknown>) => { if (e.type === 'cosmetic') setLog(l => [`${e.op} ${e.slot ?? ''} ${e.id}${e.reason ? ` (${e.reason})` : ''}${e.cause ? ` [${e.cause}]` : ''}`, ...l].slice(0, 8)); };
  const itemsFor = (s: CosmeticSlot) => (c?.cosmetics.items() ?? []).filter(i => i.slot === s && !i.id.startsWith('__'));
  const current = (s: CosmeticSlot) => equipped.find(e => e.slot === s);
  const play = (n: string) => { if (!c) return; c.resume(); resetFox(c); c.resume(); startClip(c, n as never); setClip(n); };

  return (
    <div className="page g1lab h1lab">
      <section className="card g1-stage h1-stage">
        <FoxCanvas presentation="full" label="Fox H1 cosmetic test stage" onController={x => { ctrl.current = x; if (x) setTimeout(() => setCamera(view), 50); }} onEvent={onEvent as never} className="g1-canvas" />
        <div className="g1-hud mono small">{c ? <>clip <b>{clip}</b> · level <b>{settings.level}</b> · view <b>{view}</b> · {equipped.filter(e => !e.default).map(e => `${e.id}${e.visibility !== 'visible' ? `(${e.visibility})` : ''}`).join(', ') || 'default look'}</> : 'loading…'}</div>
      </section>
      <aside className="panel g1-panel">
        <div className="card">
          <h2>Slots <span className="muted small">equip() / unequip() · outfit library: outfit_* presets</span></h2>
          <table className="small h1-slots"><tbody>
            {COSMETIC_SLOTS.map(s => {
              const cur = current(s);
              return <tr key={s}><td className="mono">{s}</td><td>
                <select value={cur && !cur.default ? cur.id : ''} onChange={x => { const v = x.target.value; if (!c) return; if (v) void c.equip(v); else c.unequip(s); }}>
                  <option value="">{cur?.default ? `default (${cur.id})` : '— none —'}</option>
                  {itemsFor(s).map(i => <option key={i.id} value={i.id}>{i.name}{i.fixture ? ' [fixture]' : ''}</option>)}
                </select></td><td className="muted">{cur && !cur.default ? cur.visibility : ''}</td></tr>;
            })}
          </tbody></table>
          <div className="row wrap">{(Object.keys(OUTFIT_PRESETS) as OutfitPresetId[]).map(p => <button key={p} className="btn small" onClick={() => void c?.setOutfit(p)}>{p}</button>)}
            <button className="btn ghost small" onClick={() => c?.resetOutfit()}>resetOutfit</button></div>
          <ul className="small mono h1-log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
        <div className="card">
          <h2>Animation compatibility <span className="muted small">required clips</span></h2>
          <div className="row wrap">{H1_REQUIRED_CLIPS.map(n => <button key={n} className="btn ghost small" onClick={() => play(n)}>{n}</button>)}</div>
        </div>
        <div className="card">
          <h2>Level · camera</h2>
          <div className="row"><label className="small">level <input type="range" min={1} max={30} value={settings.level} onChange={x => update({ level: +x.target.value })} /> {settings.level}</label>
            <button className="btn ghost small" onClick={() => update({ level: 1 })}>Lv1</button><button className="btn ghost small" onClick={() => update({ level: 30 })}>Lv30</button></div>
          <div className="row">{(['front', 'side', '34', 'back'] as View[]).map(v => <button key={v} className={`btn small ${view === v ? '' : 'ghost'}`} onClick={() => setCamera(v)}>{v === '34' ? '3/4' : v}</button>)}</div>
        </div>
        <div className="card">
          <h2>Tests</h2>
          <button className="btn small" disabled={busy || !c} onClick={async () => { if (!c) return; setBusy(true); try { setTests(await runH1Tests(c)); } finally { setBusy(false); c.resume(); } }}>runH1Tests</button>
          <button className="btn small" disabled={busy || !c} onClick={async () => { if (!c) return; setBusy(true); try { setTests(await runH2Tests(c)); } finally { setBusy(false); c.resume(); } }}>runH2Tests</button>
          {tests && <ul className="small mono">{tests.map(t => <li key={t.name} style={{ color: t.pass ? '#168C78' : '#C2410C' }}>{t.pass ? 'PASS' : 'FAIL'} {t.name}</li>)}</ul>}
        </div>
      </aside>
    </div>
  );
}
