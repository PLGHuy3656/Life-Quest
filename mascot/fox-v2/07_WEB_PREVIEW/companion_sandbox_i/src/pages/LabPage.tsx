import { useEffect, useState } from 'react';
import { FoxCanvas } from '../components/FoxCanvas';
import { foxAssetCacheState, purgeFoxAssetCache } from '../mascot';

// Runtime lab: mount / unmount stress, offscreen render-loop check, cache state.
// Used by the automated tests (window.__foxLab) and visible for manual QA.

declare global { interface Window { __foxLab?: Record<string, unknown> } }

export function LabPage() {
  const [mounted, setMounted] = useState(true);
  const [cycles, setCycles] = useState(0);
  const [cache, setCache] = useState(foxAssetCacheState());
  useEffect(() => { const t = setInterval(() => setCache(foxAssetCacheState()), 500); return () => clearInterval(t); }, []);
  useEffect(() => {
    window.__foxLab = {
      setMounted: (v: boolean) => { setMounted(v); if (!v) setCycles(c => c + 1); },
      purge: () => purgeFoxAssetCache(),
      cache: () => foxAssetCacheState(),
    };
  }, []);
  return (
    <div className="page lab">
      <section className="card">
        <h2>Gắn / gỡ lặp lại</h2>
        <p className="muted small">Mỗi lần gỡ: controller.dispose() + R3F huỷ WebGL context. GLB dùng chung được giữ 5 s rồi giải phóng.</p>
        <div className="row">
          <button className="btn" onClick={() => setMounted(m => { if (m) setCycles(c => c + 1); return !m; })}>{mounted ? 'Gỡ cáo' : 'Gắn cáo'}</button>
          <button className="btn ghost" onClick={() => purgeFoxAssetCache()}>Giải phóng cache</button>
          <span className="muted small">Đã gỡ {cycles} lần</span>
        </div>
        <div className="lab-slot">{mounted && <FoxCanvas presentation="widget" label="Cáo (lab)" style={{ width: 360, height: 300 }} />}</div>
        <pre className="small">{JSON.stringify(cache, null, 1)}</pre>
      </section>
      <section className="card">
        <h2>Ngoài màn hình</h2>
        <p className="muted small">Cáo bên dưới nằm ngoài khung nhìn: vòng lặp render dừng hẳn (frameloop "never") cho tới khi cuộn tới.</p>
        <div className="spacer" />
        <div id="offscreen-fox"><FoxCanvas presentation="mini" label="Cáo ngoài màn hình" style={{ width: 200, height: 200 }} /></div>
      </section>
    </div>
  );
}
