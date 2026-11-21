import { useEffect, useState } from 'react';
import { useCompanion } from './CompanionContext';

const COVERAGE_LABEL = { native: 'clip có sẵn', partial: 'clip + fallback', fallback: 'fallback (chưa có clip)' } as const;

/** Small, non-blocking log of the last business events and how the fox handled them. */
export function EventToasts() {
  const { log } = useCompanion();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const recent = log.filter(e => now - e.at < 6000).slice(0, 3);
  return (
    <div className="toasts" aria-live="polite">
      {recent.map(e => {
        const r = e.results[0]?.result;
        return (
          <div key={e.id} className={`toast ${r?.coverage ?? ''}`}>
            <b>{e.name}</b>
            <span>{r ? (r.result === 'coalesced' ? 'gộp (trong thời gian chờ)' : r.result === 'unknown' ? 'chưa đăng ký' : COVERAGE_LABEL[r.coverage!]) : 'không có cáo nào đang hiển thị'}</span>
          </div>
        );
      })}
    </div>
  );
}
