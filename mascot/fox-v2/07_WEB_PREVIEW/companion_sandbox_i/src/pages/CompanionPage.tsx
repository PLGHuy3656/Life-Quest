import { useEffect, useRef, useState } from 'react';
import { MOOD_LABEL } from '../components/CompanionCards';
import { useCompanion, type ReducedMotionSetting } from '../components/CompanionContext';
import { EventToasts } from '../components/EventToasts';
import { FoxCanvas } from '../components/FoxCanvas';
import { ACTIVITIES, MOODS, CORE_ONE_SHOT_CLIPS as ONE_SHOT_CLIPS, foxEventRegistry, levelToScale, type FoxController, type FoxEventName } from '../mascot';

// Full Companion View: large responsive stage + the runtime control panel (QA surface).

const ACTIVITY_LABEL = { idle: 'Đứng chơi', walk: 'Đi bộ', run: 'Chạy', resting: 'Nghỉ (fallback)' } as const;

export function CompanionPage() {
  const { settings, update, publish, effectiveReducedMotion } = useCompanion();
  const ctrl = useRef<FoxController | null>(null);
  const [state, setState] = useState<ReturnType<FoxController['getState']> | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const c = ctrl.current; if (!c) return;
      setState(c.getState());
      const inst = (window.__foxSandbox?.instances as (() => { id: string; stats: Record<string, unknown> }[]) | undefined)?.().find(i => i.id === c.id);
      setStats(inst?.stats ?? null);
    }, 400);
    return () => clearInterval(t);
  }, []);

  const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize;
  return (
    <div className="page companion">
      <section className="stage card">
        <FoxCanvas presentation="full" label="Cáo LifeQuest — chế độ tương tác đầy đủ" orbit onController={c => { ctrl.current = c; }} className="stage-canvas">
          <div className="stage-badge">
            <span className="lv">Lv {settings.level}</span>
            <span>{MOOD_LABEL[state?.mood ?? settings.mood]}</span>
            {state?.oneShot && <span className="playing">▶ {state.oneShot}</span>}
          </div>
          <div className="stage-help muted small">Di chuột: cáo nhìn theo · bấm/vuốt đầu · bấm đuôi · kéo nền để xoay</div>
        </FoxCanvas>
      </section>

      <aside className="panel">
        <div className="card">
          <h2>Cấp độ</h2>
          <div className="row"><input type="range" min={1} max={40} value={settings.level} onChange={e => update({ level: +e.target.value })} aria-label="Cấp độ" /><b className="num">Lv {settings.level}</b></div>
          <div className="row wrap">{[1, 10, 20, 30].map(l => <button key={l} className={`chip ${settings.level === l ? 'on' : ''}`} onClick={() => update({ level: l })}>Lv{l} · {levelToScale(l).toFixed(2)}×</button>)}</div>
        </div>

        <div className="card">
          <h2>Tâm trạng <span className="muted small">setMood()</span></h2>
          <div className="row wrap">{MOODS.map(m => <button key={m} className={`chip ${settings.mood === m ? 'on' : ''}`} onClick={() => update({ mood: m })}>{MOOD_LABEL[m]}</button>)}</div>
        </div>

        <div className="card">
          <h2>Hoạt động <span className="muted small">setActivity()</span></h2>
          <div className="row wrap">{ACTIVITIES.map(a => <button key={a} className={`chip ${settings.activity === a ? 'on' : ''}`} onClick={() => update({ activity: a })}>{ACTIVITY_LABEL[a]}</button>)}</div>
          <h3>Clip một lần <span className="muted small">play()</span></h3>
          <div className="row wrap">{ONE_SHOT_CLIPS.map(c => <button key={c} className="chip" onClick={() => ctrl.current?.play(c)}>{c}</button>)}</div>
        </div>

        <div className="card">
          <h2>Sự kiện LifeQuest <span className="muted small">handleEvent()</span></h2>
          <div className="event-list">
            {foxEventRegistry.list().map(ev => (
              <button key={ev.name} className="event-btn" onClick={() => publish(ev.name as FoxEventName, (ev.name === 'LEVEL_UP' ? { level: settings.level + 1 } : undefined) as never)} title={ev.note}>
                <span>{ev.name}</span><span className={`cov ${ev.coverage}`}>{ev.coverage}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Tuỳ chọn</h2>
          <label className="toggle"><input type="checkbox" checked={settings.interaction} onChange={e => update({ interaction: e.target.checked })} /> Tương tác (raycast)</label>
          <label className="toggle"><input type="checkbox" checked={settings.lookAt} onChange={e => update({ lookAt: e.target.checked })} /> Nhìn theo con trỏ</label>
          <label className="toggle"><input type="checkbox" checked={settings.idleVariation} onChange={e => update({ idleVariation: e.target.checked })} /> Biến tấu idle</label>
          <label className="toggle"><input type="checkbox" checked={settings.showProxies} onChange={e => update({ showProxies: e.target.checked })} /> Hiện vùng chạm</label>
          <div className="row">
            <span className="small">Giảm chuyển động</span>
            {(['auto', 'on', 'off'] as ReducedMotionSetting[]).map(v => <button key={v} className={`chip ${settings.reducedMotion === v ? 'on' : ''}`} onClick={() => update({ reducedMotion: v })}>{v}</button>)}
            <span className="muted small">→ {effectiveReducedMotion ? 'bật' : 'tắt'}</span>
          </div>
          <div className="row">
            <button className="btn ghost small" onClick={() => ctrl.current?.pause()}>pause()</button>
            <button className="btn ghost small" onClick={() => ctrl.current?.resume()}>resume()</button>
          </div>
        </div>

        <div className="card perf">
          <h2>Runtime</h2>
          <dl>
            <dt>FPS</dt><dd>{String(stats?.fps ?? '–')}</dd>
            <dt>update / render</dt><dd>{String(stats?.updateMs ?? '–')} / {String(stats?.renderMs ?? '–')} ms</dd>
            <dt>Draw calls · tris</dt><dd>{String(stats?.calls ?? '–')} · {Number(stats?.triangles ?? 0).toLocaleString()}</dd>
            <dt>GPU geometries · textures</dt><dd>{String(stats?.geometries ?? '–')} · {String(stats?.textures ?? '–')}</dd>
            <dt>GLB</dt><dd>{state ? `${((ctrl.current?.assetInfo.bytes ?? 0) / 1e6).toFixed(2)} MB · ${ctrl.current?.assetInfo.loadMs.toFixed(0)} ms${ctrl.current?.assetInfo.fromCache ? ' (cache)' : ''}` : '–'}</dd>
            <dt>Raycast</dt><dd>{stats ? `${Number(stats.pickMsAvg).toFixed(3)} ms tb · ${Number(stats.pickMsMax).toFixed(2)} max · ${String(stats.picks)} lần` : '–'}</dd>
            <dt>JS heap</dt><dd>{heap ? `${(heap / 1048576).toFixed(1)} MB` : 'không đo được'}</dd>
            <dt>Trạng thái</dt><dd>{state ? `${state.activity} · ${state.oneShot ?? '—'} · look ${(state.lookWeight * 100).toFixed(0)}% · hover ${state.hover}` : '–'}</dd>
          </dl>
        </div>
      </aside>
      <EventToasts />
    </div>
  );
}
