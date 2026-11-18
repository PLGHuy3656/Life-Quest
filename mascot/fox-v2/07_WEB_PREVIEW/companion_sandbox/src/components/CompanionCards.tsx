import { useRef, useState } from 'react';
import { levelToScale, type FoxController, type FoxControllerEvent, type FoxMood } from '../mascot';
import { useCompanion } from './CompanionContext';
import { FoxCanvas } from './FoxCanvas';

export const MOOD_LABEL: Record<FoxMood, string> = {
  neutral: 'Bình thường', happy: 'Vui vẻ', proud: 'Tự hào', sad: 'Buồn', surprised: 'Bất ngờ', sleepy: 'Buồn ngủ', smile: 'Mỉm cười', excited: 'Hào hứng',
};

function useFoxStatus() {
  const [mood, setMood] = useState<FoxMood | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const onEvent = (e: FoxControllerEvent) => {
    if (e.type === 'mood') setMood(e.mood);
    if (e.type === 'hover') setHint(e.target === 'head' ? 'Vuốt đầu' : e.target === 'tail' ? 'Chạm đuôi' : null);
    if (e.type === 'tap') setHint(null);
  };
  return { mood, hint, onEvent };
}

/** Dashboard Mini — 200 × 200 px companion inside a LifeQuest dashboard card. */
export function DashboardMiniCard() {
  const { settings } = useCompanion();
  const st = useFoxStatus();
  const xp = 620, xpMax = 1000;
  return (
    <section className="card mini-card" aria-label="Bạn đồng hành">
      <div className="mini-stage">
        <FoxCanvas presentation="mini" label="Cáo LifeQuest (thu nhỏ)" onEvent={st.onEvent} style={{ width: 200, height: 200 }} />
        {st.hint && <span className="hover-hint">{st.hint}</span>}
      </div>
      <div className="mini-info">
        <div className="eyebrow">Bạn đồng hành</div>
        <div className="mini-title">Cáo <span className="lv">Lv {settings.level}</span></div>
        <div className="mood-chip">{MOOD_LABEL[st.mood ?? settings.mood]}</div>
        <div className="xp"><div className="xp-bar"><i style={{ width: `${(xp / xpMax) * 100}%` }} /></div><span>{xp} / {xpMax} XP</span></div>
        <div className="muted small">Kích thước {levelToScale(settings.level).toFixed(2)}×</div>
      </div>
    </section>
  );
}

/** Companion Widget — 360 × 440 px floating companion. */
export function CompanionWidget({ onClose }: { onClose?(): void }) {
  const { settings } = useCompanion();
  const st = useFoxStatus();
  const [min, setMin] = useState(false);
  const ctrl = useRef<FoxController | null>(null);
  return (
    <aside className={`widget ${min ? 'min' : ''}`} aria-label="Widget bạn đồng hành">
      <header className="widget-head">
        <div><div className="eyebrow">Bạn đồng hành</div><strong>Cáo · Lv {settings.level}</strong></div>
        <div className="widget-tools">
          <span className="mood-chip">{MOOD_LABEL[st.mood ?? settings.mood]}</span>
          <button className="icon-btn" aria-label={min ? 'Mở rộng' : 'Thu gọn'} onClick={() => setMin(m => !m)}>{min ? '▴' : '▾'}</button>
          {onClose && <button className="icon-btn" aria-label="Đóng widget" onClick={onClose}>×</button>}
        </div>
      </header>
      {!min && (
        <FoxCanvas presentation="widget" label="Cáo LifeQuest (widget)" onEvent={st.onEvent} onController={c => { ctrl.current = c; }} className="widget-canvas" style={{ width: 360, height: 440 }}>
          {st.hint && <span className="hover-hint">{st.hint}</span>}
          <footer className="widget-foot">
            <button className="btn ghost small" onClick={() => ctrl.current?.play('wave')}>👋 Vẫy tay</button>
            <span className="muted small">Vuốt đầu · chạm đuôi</span>
          </footer>
        </FoxCanvas>
      )}
    </aside>
  );
}
