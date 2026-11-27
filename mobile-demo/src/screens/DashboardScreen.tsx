import React from 'react'
import { TabId } from '../types'
import { Check, Flame } from 'lucide-react'

interface DashboardScreenProps {
  onNavigateTab: (tab: TabId) => void
  onOpenTaskDetail: () => void
  onOpenFocus: () => void
  onOpenWardrobe: () => void
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateTab,
  onOpenTaskDetail,
  onOpenFocus,
  onOpenWardrobe
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '8px 16px 80px',
      gap: 14
    }}>
      {/* 1. Hero Mascot Welcome Card (Matches 05_dashboard.html) */}
      <div style={{
        background: 'linear-gradient(160deg, #FFE9D6, #FFF6EC)',
        borderRadius: 22,
        padding: '14px 16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
              Chào buổi tối, Minh Anh
            </span>

            {/* Mascot Speech Bubble */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '10px 14px',
              boxShadow: 'var(--shadow-f)',
              fontWeight: 700,
              fontSize: 13,
              border: '1px solid var(--lq-border)',
              color: 'var(--lq-ink)',
              lineHeight: 1.35
            }}>
              Còn 2 nhiệm vụ nữa là giữ được chuỗi 12 ngày rồi!
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 99,
                background: 'var(--lq-reward-soft)',
                color: 'var(--lq-reward-ink)'
              }}>
                Cấp 7
              </span>

              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 99,
                background: 'var(--lq-accent-soft)',
                color: 'var(--lq-accent)'
              }}>
                12 ngày liên tiếp
              </span>
            </div>
          </div>

          {/* Fox Hero Animated Mascot */}
          <div
            onClick={onOpenWardrobe}
            style={{ cursor: 'pointer', flexShrink: 0 }}
            title="Bấm để xem Tủ đồ của Fox"
          >
            <img
              src="/assets/fox/fox-hero-anim.webp"
              alt="Fox Hero"
              style={{ width: 125, height: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/assets/fox/fox-hero.png'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Stats Row (Matches 05_dashboard.html) */}
      <div style={{ display: 'flex', gap: 10 }}>
        {/* Stat XP */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '10px 12px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>XP</span>
          <b style={{ fontSize: 18, color: 'var(--lq-ink)' }}>340/500</b>
          <div style={{
            height: 6,
            borderRadius: 99,
            background: 'var(--lq-surface-subtle)',
            overflow: 'hidden',
            marginTop: 2
          }}>
            <div style={{ height: '100%', width: '68%', background: 'var(--lq-reward)', borderRadius: 99 }} />
          </div>
        </div>

        {/* Stat Streak */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '10px 12px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>Chuỗi ngày</span>
          <b style={{ fontSize: 18, color: 'var(--lq-accent)' }}>12</b>
        </div>

        {/* Stat Coins */}
        <div style={{
          flex: 1,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '10px 12px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>Xu</span>
          <b style={{ fontSize: 18, color: 'var(--lq-ink)' }}>1.280</b>
        </div>
      </div>

      {/* 3. Today's Tasks Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Nhiệm vụ hôm nay
        </div>
        <span
          onClick={() => onNavigateTab('work')}
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-accent)', cursor: 'pointer' }}
        >
          Xem tất cả
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Task 1 -> Opens Task Detail */}
        <div
          onClick={onOpenTaskDetail}
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '12px 14px',
            border: '1px solid var(--lq-border)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--lq-border)',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink)' }}>Ôn Chương 3 – Giải tích</b>
            <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              19:00 · Học tập
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-danger-soft)',
            color: 'var(--lq-danger)'
          }}>
            Cao
          </span>

          <span
            onClick={(e) => {
              e.stopPropagation()
              onOpenFocus()
            }}
            title="Bắt đầu phiên Focus"
            style={{
              padding: '4px 8px',
              borderRadius: 12,
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⏱️ Focus
          </span>
        </div>

        {/* Task 2 */}
        <div
          onClick={onOpenTaskDetail}
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            padding: '12px 14px',
            border: '1px solid var(--lq-border)',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--lq-border)',
            flexShrink: 0
          }} />

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink)' }}>Chạy bộ 20 phút</b>
            <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              20:30 · Sức khỏe
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-success-soft)',
            color: 'var(--lq-success)'
          }}>
            Habit
          </span>
        </div>

        {/* Task 3 (Completed) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '12px 14px',
          border: '1px solid var(--lq-border)',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: 0.75
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--lq-success)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Check size={14} strokeWidth={3} />
          </div>

          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5, color: 'var(--lq-ink-muted)', textDecoration: 'line-through' }}>
              Đọc 10 trang sách
            </b>
            <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
              Hoàn thành
            </div>
          </div>

          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--lq-reward-soft)',
            color: 'var(--lq-reward-ink)'
          }}>
            +20 XP
          </span>
        </div>
      </div>

      {/* 4. Goals & Milestones Card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        padding: '16px',
        border: '1px solid var(--lq-border)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Mục tiêu & Cột mốc
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>Thi cuối kỳ</span>
            <span style={{ color: 'var(--lq-ink-muted)' }}>72%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--lq-surface-subtle)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '72%', background: 'var(--lq-success)', borderRadius: 99 }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
            <span>Chạy 5K</span>
            <span style={{ color: 'var(--lq-ink-muted)' }}>40%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--lq-surface-subtle)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '40%', background: 'var(--lq-accent)', borderRadius: 99 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
export default DashboardScreen
