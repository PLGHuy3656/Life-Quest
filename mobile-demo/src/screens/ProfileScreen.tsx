import React from 'react'
import { useStore } from '../store/questStore'
import { Award, Zap, Shield, RotateCcw, Heart, Flame, Moon, Sun, Bell, Volume2, Globe } from 'lucide-react'

export const ProfileScreen: React.FC = () => {
  const { player, fox, resetToDefaults, toggleTheme } = useStore()

  const statsList = [
    { label: 'STR - Thể lực & Sức bền', val: player.stats.str, max: 30, color: '#E63946', desc: 'Từ rèn luyện thể chất, chạy bộ, thể thao' },
    { label: 'INT - Trí tuệ & Kỹ năng', val: player.stats.int, max: 30, color: '#3A86FF', desc: 'Từ học tập, ngoại ngữ, đọc sách, code' },
    { label: 'DIS - Kỷ luật & Thói quen', val: player.stats.dis, max: 30, color: '#168C78', desc: 'Từ duy trì chuỗi thói quen, dậy sớm' },
    { label: 'CHA - Xã hội & Hòa đồng', val: player.stats.cha, max: 30, color: '#F26B3A', desc: 'Từ hoạt động nhóm, giao tiếp xã hội' }
  ]

  const achievements = [
    { title: 'Ngọn Lửa Bất Diệt', desc: 'Chuỗi Streak trên 7 ngày', icon: '🔥', unlocked: player.streak >= 7 },
    { title: 'Hiệp Sĩ Tập Sự', desc: 'Đạt Cấp độ 4 trong game', icon: '👑', unlocked: player.level >= 4 },
    { title: 'Tri Kỷ Bé Cáo', desc: 'Độ thân thiết Kitsu trên 70', icon: '🦊', unlocked: fox.affection >= 70 }
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      {/* RPG Profile Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
        color: '#FFFFFF',
        textAlign: 'center',
        padding: '20px 16px',
        position: 'relative'
      }}>
        <div style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          background: 'linear-gradient(135deg, #F26B3A 0%, #F6C85F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          margin: '0 auto 10px',
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {player.avatar}
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 800 }}>{player.displayName}</h3>
        <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
          @{player.username} &bull; Hiệp Sĩ Cấp {player.level}
        </p>

        {/* 3 Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F6C85F' }}>{player.streak} 🔥</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Chuỗi Streak</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFD166' }}>{player.coins} 🪙</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Kho Vàng</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#4ADE80' }}>{player.totalXp} ⭐</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Tổng XP</div>
          </div>
        </div>
      </div>

      {/* RPG Stats Attributes */}
      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={16} color="var(--lq-accent)" />
          <span>Hệ Thống Chỉ Số Nhân Vật (RPG Stats)</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {statsList.map((st, i) => {
            const pct = Math.min(100, Math.round((st.val / st.max) * 100))
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 3 }}>
                  <span style={{ color: 'var(--lq-ink)' }}>{st.label}</span>
                  <span style={{ color: st.color, fontWeight: 800 }}>{st.val}/{st.max}</span>
                </div>
                <div style={{ height: 6, background: 'var(--lq-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: st.color,
                    borderRadius: 3,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
                  {st.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Badges / Achievements */}
      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} color="var(--lq-reward-ink)" />
          <span>Huy Hiệu Đã Mở Khóa</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {achievements.map((ach, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: ach.unlocked ? 'var(--lq-bg-elevated)' : 'var(--lq-surface-subtle)',
                opacity: ach.unlocked ? 1 : 0.5
              }}
            >
              <span style={{ fontSize: 22 }}>{ach.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--lq-ink)' }}>
                  {ach.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--lq-ink-muted)' }}>
                  {ach.desc}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: ach.unlocked ? 'var(--lq-success)' : 'var(--lq-ink-muted)' }}>
                {ach.unlocked ? '✓ Đã đạt' : 'Khóa'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Options */}
      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)', marginBottom: 10 }}>
          Cài Đặt Ứng Dụng
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 8px',
              borderRadius: 8,
              background: 'var(--lq-bg-elevated)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--lq-ink)' }}>
              {player.theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              <span>Chế độ giao diện (Theme)</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-accent)' }}>
              {player.theme === 'light' ? 'Sáng' : 'Tối'}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 8px',
            borderRadius: 8,
            background: 'var(--lq-bg-elevated)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--lq-ink)' }}>
              <Globe size={15} />
              <span>Ngôn ngữ hiển thị</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
              Tiếng Việt
            </span>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Button */}
      <div style={{ textAlign: 'center', padding: '6px 0 16px' }}>
        <button
          onClick={() => {
            if (window.confirm('Đặt lại toàn bộ dữ liệu demo về trạng thái ban đầu?')) {
              resetToDefaults()
            }
          }}
          style={{
            background: 'transparent',
            color: 'var(--lq-ink-muted)',
            fontSize: 11,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--lq-border)'
          }}
        >
          <RotateCcw size={13} />
          <span>Khôi phục dữ liệu ban đầu</span>
        </button>
      </div>
    </div>
  )
}
