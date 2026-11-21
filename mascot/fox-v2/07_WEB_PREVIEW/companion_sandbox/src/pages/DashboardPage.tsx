import { useState } from 'react';
import { CompanionWidget, DashboardMiniCard } from '../components/CompanionCards';
import { useCompanion } from '../components/CompanionContext';
import { EventToasts } from '../components/EventToasts';

// Simplified LifeQuest dashboard: the fox lives in a dashboard card (Mini) and in the floating
// Companion Widget. The task / habit / quest buttons only publish business events.

export function DashboardPage() {
  const { publish, settings } = useCompanion();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [widget, setWidget] = useState(true);
  const mark = (k: string) => setDone(d => ({ ...d, [k]: true }));
  return (
    <div className="page dashboard">
      <div className="dash-grid">
        <div className="dash-main">
        <section className="hero card">
          <div>
            <div className="eyebrow">Thứ Ba, 17 tháng 11</div>
            <h1>Chào buổi chiều, Huy!</h1>
            <p className="muted">Hôm nay bạn muốn làm gì? Hoàn thành một việc để cáo vui lên.</p>
            <div className="chips"><span className="chip on">Hôm nay</span><span className="chip">Ngày mai</span><span className="chip">Tuần này</span></div>
          </div>
          <div className="stats-row">
            <div className="stat"><span className="k">🔥</span><b>12</b><span className="muted small">ngày chuỗi</span></div>
            <div className="stat"><span className="k">🪙</span><b>320</b><span className="muted small">coin</span></div>
            <div className="stat"><span className="k">⭐</span><b>Lv {settings.level}</b><span className="muted small">620 / 1000 XP</span></div>
          </div>
        </section>

        <section className="card pinned">
          <div className="card-head"><h2>Bảng ghim</h2><span className="muted small">Những việc bạn muốn theo dõi nhanh.</span></div>
          <div className="pin-grid">
            <article className={`pin task ${done.task ? 'done' : ''}`}>
              <span className="badge task">TASK</span>
              <h3>Hoàn thành đồ án UI</h3>
              <p className="muted small">Công việc · 16:00 · +50 XP</p>
              <button className="btn" disabled={done.task} onClick={() => { mark('task'); publish('TASK_COMPLETED', { taskId: 'task-1', xp: 50 }); }}>{done.task ? '✓ Đã xong' : 'Hoàn thành'}</button>
            </article>
            <article className={`pin habit ${done.habit ? 'done' : ''}`}>
              <span className="badge habit">HABIT</span>
              <h3>Đọc sách mỗi tối</h3>
              <p className="muted small">🔥 12 ngày · 21:00</p>
              <button className="btn mint" disabled={done.habit} onClick={() => { mark('habit'); publish('HABIT_CHECKED_IN', { habitId: 'habit-1', streak: 13 }); }}>{done.habit ? '✓ Đã check-in' : 'Check-in'}</button>
            </article>
            <article className={`pin quest ${done.quest ? 'done' : ''}`}>
              <span className="badge quest">QUEST</span>
              <h3>Chinh phục Núi Bình Minh</h3>
              <div className="progress"><i style={{ width: done.quest ? '100%' : '90%' }} /></div>
              <p className="muted small">{done.quest ? '10 / 10 chặng' : '9 / 10 chặng'} · +200 XP · +80 coin</p>
              <button className="btn orange" disabled={done.quest} onClick={() => { mark('quest'); publish('QUEST_COMPLETED', { questId: 'quest-1', xp: 200 }); }}>{done.quest ? '✓ Hoàn thành' : 'Hoàn thành Quest'}</button>
            </article>
          </div>
        </section>

        <section className="card events-demo">
          <div className="card-head"><h2>Sự kiện khác</h2><span className="muted small">Mỗi nút chỉ gửi một sự kiện nghiệp vụ.</span></div>
          <div className="row wrap">
            <button className="btn ghost" onClick={() => publish('LEVEL_UP', { level: settings.level + 1 })}>⭐ Lên cấp</button>
            <button className="btn ghost" onClick={() => publish('STREAK_LOST', { previousDays: 12 })}>💧 Mất chuỗi</button>
            <button className="btn ghost" onClick={() => publish('CHALLENGE_WON')}>🏆 Thắng thách đấu</button>
            <button className="btn ghost" onClick={() => publish('QUEST_DEADLINE_URGENT', { hoursLeft: 3 })}>⏰ Quest sắp hết hạn</button>
          </div>
          <button className="link small" onClick={() => { setDone({}); }}>Đặt lại bảng ghim</button>
        </section>
        </div>
        <div className="dash-side">
          <DashboardMiniCard />
          {widget ? <CompanionWidget onClose={() => setWidget(false)} /> : <button className="widget-recall" onClick={() => setWidget(true)} aria-label="Gọi cáo lại">🦊 Mở widget bạn đồng hành</button>}
        </div>
      </div>
      <EventToasts />
    </div>
  );
}
