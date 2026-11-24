import React from 'react'
import { IconFlame, IconSparkles } from './Icons'

export const Header = ({ stats, isConnected, isBackendData, onOpenProfile }) => {
  const expPercentage = Math.min(100, Math.round((stats.exp / stats.maxExp) * 100))

  return (
    <header className="mobile-header">
      {/* Top Status Indicators */}
      <div className="header-top-row">
        <div className="connection-pill" title={isConnected ? 'Đang kết nối Backend API' : 'Chế độ Demo / Offline'}>
          <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
          <span className="status-text">
            {isConnected ? 'Backend Live' : 'Demo Mode'}
          </span>
        </div>

        <div className="header-badges">
          <div className="stat-pill streak-pill" title="Chuỗi ngày kỷ luật liên tiếp">
            <IconFlame className="w-4 h-4 text-amber-400" />
            <span className="pill-value">{stats.streak} ngày</span>
          </div>

          <div className="stat-pill coins-pill" title="Vàng kiếm được từ nhiệm vụ">
            <span className="coin-icon">🪙</span>
            <span className="pill-value">{stats.coins}</span>
          </div>
        </div>
      </div>

      {/* Hero Character Card Banner */}
      <div className="hero-profile-card" onClick={onOpenProfile}>
        <div className="hero-avatar-box">
          <div className="avatar-frame">
            <img 
              src="https://api.dicebear.com/7.x/bottts/svg?seed=LifeQuestHero&backgroundColor=6366f1" 
              alt="Hero Avatar"
              className="hero-avatar"
            />
            <div className="level-badge">Lv.{stats.level}</div>
          </div>
        </div>

        <div className="hero-info">
          <div className="hero-name-row">
            <span className="hero-title">{stats.title || 'Hiệp Sĩ Tân Binh'}</span>
            <span className="hero-sub">{stats.exp}/{stats.maxExp} XP</span>
          </div>

          {/* XP Progress Bar */}
          <div className="xp-bar-container">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${expPercentage}%` }}
            />
          </div>

          <div className="xp-hint">
            <IconSparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>+{stats.maxExp - stats.exp} XP để lên Level {stats.level + 1}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
