import React from 'react'
import { IconTarget, IconTrophy, IconSettings, IconPlus } from './Icons'

export const BottomNav = ({ activeTab, onSelectTab, onOpenCreateModal }) => {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {/* Tab Quests */}
        <button
          className={`nav-tab-btn ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => onSelectTab('quests')}
        >
          <IconTarget className="w-5 h-5 nav-icon" />
          <span className="nav-label">Nhiệm Vụ</span>
          {activeTab === 'quests' && <span className="nav-active-indicator" />}
        </button>

        {/* Floating Add Center Button */}
        <button
          className="nav-fab-btn"
          onClick={onOpenCreateModal}
          title="Tạo nhiệm vụ mới"
        >
          <IconPlus className="w-6 h-6 text-white" />
        </button>

        {/* Tab Character */}
        <button
          className={`nav-tab-btn ${activeTab === 'character' ? 'active' : ''}`}
          onClick={() => onSelectTab('character')}
        >
          <IconTrophy className="w-5 h-5 nav-icon" />
          <span className="nav-label">Nhân Vật</span>
          {activeTab === 'character' && <span className="nav-active-indicator" />}
        </button>

        {/* Tab Settings */}
        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <IconSettings className="w-5 h-5 nav-icon" />
          <span className="nav-label">Cài Đặt</span>
          {activeTab === 'settings' && <span className="nav-active-indicator" />}
        </button>
      </div>
    </nav>
  )
}
