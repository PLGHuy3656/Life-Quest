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

      {/* 2. Fox-Mascot Game Stats Row (XP, Streak, Coins) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 }}>
        {/* Stat 1: XP (Fox Star Crest) */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(165deg, #E8FAF4 0%, #FFFFFF 65%)',
            borderRadius: 20,
            padding: '10px 10px 11px',
            border: '1.5px solid #BFE9DA',
            boxShadow: '0 3.5px 0 #BCE5D6, 0 8px 18px rgba(22, 140, 120, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 5
          }}
        >
          {/* Subtle Fox Paw Watermark */}
          <svg
            width="38"
            height="38"
            viewBox="0 0 36 36"
            fill="none"
            style={{ position: 'absolute', right: -6, bottom: -6, opacity: 0.09, pointerEvents: 'none' }}
          >
            <circle cx="18" cy="22" r="7" fill="#168C78" />
            <circle cx="10" cy="14" r="3.2" fill="#168C78" />
            <circle cx="18" cy="11" r="3.4" fill="#168C78" />
            <circle cx="26" cy="14" r="3.2" fill="#168C78" />
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Fox Star XP Badge */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 9,
                background: 'linear-gradient(145deg, #27B89A 0%, #168C78 100%)',
                boxShadow: '0 2px 0 #0F6657, inset 0 1px 1px rgba(255,255,255,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.5L14.9 8.6L21.5 9.5L16.7 14.1L17.9 20.7L12 17.5L6.1 20.7L7.3 14.1L2.5 9.5L9.1 8.6L12 2.5Z"
                  fill="#FFF4C2"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0F6B5B', letterSpacing: '0.03em' }}>
              XP
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <b style={{ fontSize: 17, fontWeight: 900, color: '#16324A', lineHeight: 1 }}>340</b>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64817B' }}>/500</span>
          </div>

          {/* Glossy Gamified XP Bar */}
          <div
            style={{
              height: 7,
              borderRadius: 99,
              background: '#DDF2EB',
              overflow: 'hidden',
              border: '1px solid rgba(22, 140, 120, 0.14)',
              position: 'relative'
            }}
          >
            <div
              style={{
                height: '100%',
                width: '68%',
                background: 'linear-gradient(90deg, #168C78 0%, #2EC4A6 70%, #F6C85F 100%)',
                borderRadius: 99,
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)'
              }}
            />
          </div>
        </div>

        {/* Stat 2: Chuỗi ngày (Fox-Eared Flame Badge) */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(165deg, #FFEEE2 0%, #FFFFFF 65%)',
            borderRadius: 20,
            padding: '10px 10px 11px',
            border: '1.5px solid #FAD0B6',
            boxShadow: '0 3.5px 0 #F4BFA0, 0 8px 18px rgba(242, 107, 58, 0.13)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 5
          }}
        >
          {/* Subtle Fox Silhouette Watermark */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            style={{ position: 'absolute', right: -6, bottom: -7, opacity: 0.09, pointerEvents: 'none' }}
          >
            <path d="M8 10L16 17H24L32 10L34 25C34 31 27 35 20 35C13 35 6 31 6 25L8 10Z" fill="#F26B3A" />
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Fox Flame Emblem */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 9,
                background: 'linear-gradient(145deg, #FF9357 0%, #F26B3A 100%)',
                boxShadow: '0 2px 0 #BD431A, inset 0 1px 1px rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12.5 2.5C12.5 2.5 17 6.8 17 12.2C17 15.6 14.8 18.5 12 18.5C9.2 18.5 7 15.6 7 12.2C7 9.8 8.3 7.7 9.6 6.4C9.6 8 10.6 8.8 10.6 8.8C10.6 8.8 11.4 5.5 12.5 2.5Z"
                  fill="#FFF4E0"
                />
                <path
                  d="M12 11C12 11 14 12.8 14 14.8C14 16.3 13.1 17.4 12 17.4C10.9 17.4 10 16.3 10 14.8C10 12.8 12 11 12 11Z"
                  fill="#F6C85F"
                />
              </svg>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#C4471E', whiteSpace: 'nowrap' }}>
              Chuỗi ngày
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <b style={{ fontSize: 19, fontWeight: 900, color: '#E85626', lineHeight: 1 }}>12</b>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#B56B50' }}>ngày</span>
          </div>

          {/* 5-Day Momentum Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
            {[1, 2, 3, 4, 5].map((d) => (
              <span
                key={d}
                style={{
                  flex: 1,
                  height: 5.5,
                  borderRadius: 99,
                  background: d <= 4 ? 'linear-gradient(90deg, #F26B3A, #FF9955)' : '#F9DCC9',
                  boxShadow: d <= 4 ? '0 1px 3px rgba(242, 107, 58, 0.35)' : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Stat 3: Xu (Fox-Paw Gold Coin) */}
        <div
          onClick={onOpenWardrobe}
          title="Dùng Xu trong Tủ đồ Fox"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(165deg, #FFF7DB 0%, #FFFFFF 65%)',
            borderRadius: 20,
            padding: '10px 10px 11px',
            border: '1.5px solid #F4DA8E',
            boxShadow: '0 3.5px 0 #E9C86E, 0 8px 18px rgba(214, 158, 22, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 5,
            cursor: 'pointer'
          }}
        >
          {/* Subtle Coin Shine Watermark */}
          <svg
            width="38"
            height="38"
            viewBox="0 0 36 36"
            fill="none"
            style={{ position: 'absolute', right: -6, bottom: -6, opacity: 0.12, pointerEvents: 'none' }}
          >
            <circle cx="18" cy="18" r="14" stroke="#D99B16" strokeWidth="3" />
            <circle cx="18" cy="18" r="8" fill="#F6C85F" />
          </svg>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Fox-Paw Gold Coin Emblem */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #FFE07A 0%, #F0B429 100%)',
                boxShadow: '0 2px 0 #C4880D, inset 0 1px 2px rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="14.5" r="4.2" fill="#8A5A00" />
                <circle cx="7" cy="9.2" r="2" fill="#8A5A00" />
                <circle cx="12" cy="7.2" r="2.1" fill="#8A5A00" />
                <circle cx="17" cy="9.2" r="2" fill="#8A5A00" />
              </svg>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#996A00', letterSpacing: '0.02em' }}>
              Xu Fox
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <b style={{ fontSize: 18, fontWeight: 900, color: '#7A5400', lineHeight: 1 }}>1.280</b>
          </div>

          {/* Interactive Wardrobe Shortcut Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9.5,
              fontWeight: 800,
              color: '#8C6000',
              background: 'rgba(246, 200, 95, 0.34)',
              borderRadius: 99,
              padding: '2px 6px',
              width: 'fit-content'
            }}
          >
            Tủ đồ Fox →
          </div>
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
