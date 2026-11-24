import React from 'react'
import { IconFlame, IconSword, IconShield, IconTrophy, IconSparkles, IconTarget } from './Icons'

export const CharacterTab = ({ stats, goals }) => {
  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length
  const activeCount = goals.filter((g) => g.status === 'ACTIVE').length
  const pausedCount = goals.filter((g) => g.status === 'PAUSE').length

  const achievements = [
    {
      id: 'first-blood',
      icon: '⚔️',
      name: 'Khởi Đầu Anh Hùng',
      desc: 'Tạo nhiệm vụ đầu tiên trong Life-Quest',
      unlocked: goals.length > 0
    },
    {
      id: 'streak-fire',
      icon: '🔥',
      name: 'Ngọn Lửa Kiên Trì',
      desc: 'Duy trì chuỗi kỷ luật 5 ngày liên tiếp',
      unlocked: stats.streak >= 5
    },
    {
      id: 'master-finisher',
      icon: '🏆',
      name: 'Chiến Binh Đắc Thắng',
      desc: 'Hoàn thành ít nhất 3 mục tiêu lớn',
      unlocked: completedCount >= 3
    },
    {
      id: 'discipline-god',
      icon: '👑',
      name: 'Chúa Tể Kỷ Luật',
      desc: 'Đạt cấp độ 5 và mở khóa danh hiệu',
      unlocked: stats.level >= 5
    }
  ]

  return (
    <div className="tab-pane character-tab">
      {/* Hero Big Profile */}
      <div className="character-hero-card">
        <div className="character-avatar-large">
          <img
            src="https://api.dicebear.com/7.x/bottts/svg?seed=LifeQuestHero&backgroundColor=6366f1"
            alt="Character"
            className="avatar-large-img"
          />
          <div className="character-level-ring">Lv.{stats.level}</div>
        </div>

        <h2 className="character-hero-name">{stats.title || 'Chiến Binh Kỷ Luật'}</h2>
        <p className="character-hero-sub">Hiệp sĩ chinh phục mục tiêu cuộc đời</p>

        {/* Stats Grid */}
        <div className="character-stats-grid">
          <div className="stat-card">
            <span className="stat-card-val text-emerald-400">{completedCount}</span>
            <span className="stat-card-label">Đã hoàn thành</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-val text-cyan-400">{activeCount}</span>
            <span className="stat-card-label">Đang làm</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-val text-amber-400">{stats.streak}🔥</span>
            <span className="stat-card-label">Chuỗi ngày</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-val text-yellow-400">{stats.coins}🪙</span>
            <span className="stat-card-label">Kho vàng</span>
          </div>
        </div>
      </div>

      {/* RPG Attribute Radar/Bars */}
      <div className="character-section">
        <h3 className="section-title">
          <IconSword className="w-4 h-4 text-indigo-400" />
          <span>Chỉ Số Kỹ Năng Nhân Vật</span>
        </h3>

        <div className="attribute-list">
          <div className="attribute-row">
            <div className="attribute-meta">
              <span>Sức Mạnh Kỷ Luật</span>
              <span className="font-bold text-indigo-400">{70 + stats.level * 5}/100</span>
            </div>
            <div className="attribute-bar-bg">
              <div className="attribute-bar-fill fill-indigo" style={{ width: `${Math.min(100, 70 + stats.level * 5)}%` }} />
            </div>
          </div>

          <div className="attribute-row">
            <div className="attribute-meta">
              <span>Độ Bền Bỉ (Perseverance)</span>
              <span className="font-bold text-emerald-400">{60 + stats.streak * 4}/100</span>
            </div>
            <div className="attribute-bar-bg">
              <div className="attribute-bar-fill fill-emerald" style={{ width: `${Math.min(100, 60 + stats.streak * 4)}%` }} />
            </div>
          </div>

          <div className="attribute-row">
            <div className="attribute-meta">
              <span>Tốc Độ Hoàn Thành (Agility)</span>
              <span className="font-bold text-cyan-400">{55 + completedCount * 8}/100</span>
            </div>
            <div className="attribute-bar-bg">
              <div className="attribute-bar-fill fill-cyan" style={{ width: `${Math.min(100, 55 + completedCount * 8)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Achievements / Danh Hiệu */}
      <div className="character-section">
        <h3 className="section-title">
          <IconTrophy className="w-4 h-4 text-amber-400" />
          <span>Danh Hiệu &amp; Huy Hiệu</span>
        </h3>

        <div className="achievements-list">
          {achievements.map((ach) => (
            <div key={ach.id} className={`achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">{ach.icon}</div>
              <div className="achievement-text">
                <div className="achievement-name-row">
                  <span className="achievement-name">{ach.name}</span>
                  {ach.unlocked ? (
                    <span className="badge-ach-unlocked">Đã mở</span>
                  ) : (
                    <span className="badge-ach-locked">Chưa đạt</span>
                  )}
                </div>
                <p className="achievement-desc">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
