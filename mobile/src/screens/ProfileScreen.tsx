import React from 'react'
import { useStore } from '../store/questStore'
import { Award, Flame, Zap, Shield, RotateCcw, Heart, CheckCircle2, ChevronRight, User } from 'lucide-react'

export const ProfileScreen: React.FC = () => {
  const { player, fox, resetToDefaults } = useStore()

  const stats = [
    { key: 'str', label: 'STR - Thể lực & Sức bền', val: player.stats.str, max: 30, color: '#E63946', desc: 'Từ nhiệm vụ chạy bộ, gym, vận động' },
    { key: 'int', label: 'INT - Trí tuệ & Kỹ năng', val: player.stats.int, max: 30, color: '#3A86FF', desc: 'Từ việc học ngoại ngữ, đọc sách, code' },
    { key: 'dis', label: 'DIS - Kỷ luật & Thói quen', val: player.stats.dis, max: 30, color: '#168C78', desc: 'Từ Pomodoro, dậy sớm, uống nước' },
    { key: 'cha', label: 'CHA - Xã hội & Kết nối', val: player.stats.cha, max: 30, color: '#F26B3A', desc: 'Từ giao tiếp, làm việc nhóm, giúp đỡ bạn bè' }
  ]

  const achievements = [
    { title: 'Ngọn Lửa Bất Diệt', desc: 'Giữ chuỗi Streak 7 ngày liên tiếp', icon: '🔥', unlocked: player.streak >= 7 },
    { title: 'Thợ Săn Nhiệm Vụ', desc: 'Hoàn thành trên 25 nhiệm vụ đời thực', icon: '⚔️', unlocked: player.completedQuestsCount >= 25 },
    { title: 'Tri Kỷ Muông Thú', desc: 'Đạt độ thân mật trên 50 với cáo Kitsu', icon: '🦊', unlocked: fox.affection >= 50 },
    { title: 'Đại Hiệp Sĩ Cấp 5', desc: 'Nâng cấp nhân vật lên Cấp 5', icon: '👑', unlocked: player.level >= 5 }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' }}>
      {/* RPG Profile Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
        color: '#FFFFFF',
        padding: '20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Avatar */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          background: 'linear-gradient(135deg, #F26B3A 0%, #F6C85F 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          margin: '0 auto 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          border: '3px solid #FFFFFF'
        }}>
          {player.avatar}
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{player.displayName}</h3>
        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>@{player.username} &bull; Hiệp sĩ Tập sự</p>

        {/* Level badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '6px 14px',
          borderRadius: 20,
          marginTop: 12,
          fontSize: 13,
          fontWeight: 700
        }}>
          <Shield size={16} color="#F6C85F" />
          <span>Cấp độ {player.level} ({player.totalXp} Tổng XP)</span>
        </div>

        {/* Mini stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F6C85F' }}>{player.streak} 🔥</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Streak ngày</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD166' }}>{player.coins} 🪙</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Kho Vàng</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4ADE80' }}>{player.completedQuestsCount} 🎯</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Đã xong</div>
          </div>
        </div>
      </div>

      {/* RPG Attribute Stat Bars */}
      <div className="card">
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={16} color="var(--accent)" />
          <span>Chỉ Số Kỹ Năng Nhân Vật</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stats.map((st) => {
            const percent = Math.min(100, Math.round((st.val / st.max) * 100))
            return (
              <div key={st.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink)' }}>{st.label}</span>
                  <span style={{ color: st.color, fontWeight: 800 }}>{st.val}/{st.max}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: st.color,
                    borderRadius: 3,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-secondary)', marginTop: 2 }}>
                  {st.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievements / Badges */}
      <div className="card">
        <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} color="var(--gold-text)" />
          <span>Huy Hiệu & Danh Hiệu Đã Mở Khóa</span>
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: ach.unlocked ? 'var(--bg-elevated)' : 'var(--bg-subtle)',
                opacity: ach.unlocked ? 1 : 0.5,
                border: ach.unlocked ? '1px solid var(--border)' : '1px dashed var(--border)'
              }}
            >
              <div style={{ fontSize: 24 }}>{ach.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  {ach.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
                  {ach.desc}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ach.unlocked ? 'var(--success)' : 'var(--ink-muted)' }}>
                {ach.unlocked ? '✓ Đạt' : 'Khóa'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Reset Button */}
      <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn đặt lại dữ liệu mẫu về ban đầu không?')) {
              resetToDefaults()
            }
          }}
          style={{
            background: 'transparent',
            color: 'var(--ink-muted)',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}
        >
          <RotateCcw size={14} />
          <span>Khôi phục dữ liệu ban đầu</span>
        </button>
      </div>
    </div>
  )
}
