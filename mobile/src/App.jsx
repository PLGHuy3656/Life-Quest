import React, { useState, useEffect, useMemo } from 'react'
import './App.css'
import { Header } from './components/Header'
import { QuestCard } from './components/QuestCard'
import { CreateGoalModal } from './components/CreateGoalModal'
import { GoalDetailModal } from './components/GoalDetailModal'
import { CharacterTab } from './components/CharacterTab'
import { SettingsTab } from './components/SettingsTab'
import { BottomNav } from './components/BottomNav'
import { IconSearch, IconSparkles, IconRefresh, IconTarget } from './components/Icons'
import {
  getApiConfig,
  getUserStats,
  saveUserStats,
  fetchGoals,
  createGoalApi,
  pauseGoalApi,
  archiveGoalApi,
  updateGoalApi,
  completeGoalLocal,
  pingBackend
} from './services/api'

export default function App() {
  const [config, setConfig] = useState(getApiConfig())
  const [stats, setStats] = useState(getUserStats())
  const [goals, setGoals] = useState([])
  const [activeTab, setActiveTab] = useState('quests')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isBackendData, setIsBackendData] = useState(false)

  // Modals & Popups
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [toast, setToast] = useState(null)
  const [levelUpAnimation, setLevelUpAnimation] = useState(false)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // Load Goals on start or config change
  const loadGoals = async () => {
    setIsLoading(true)
    try {
      const isLive = await pingBackend()
      setIsConnected(isLive)

      const result = await fetchGoals(config.userId)
      setGoals(result.data || [])
      setIsBackendData(result.isBackend)

      if (result.error) {
        showToast(`Không thể nối Backend API: ${result.error}. Đang dùng chế độ Demo.`, 'warning')
      }
    } catch (err) {
      showToast('Lỗi khi tải danh sách: ' + err.message, 'danger')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
  }, [config.userId, config.useMockOnly])

  // Filtered goals list
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchFilter = filterStatus === 'ALL' || goal.status === filterStatus
      const matchSearch =
        searchQuery === '' ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (goal.description && goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchFilter && matchSearch
    })
  }, [goals, filterStatus, searchQuery])

  // Reward EXP & Coins
  const awardExperience = (expGained = 150, coinsGained = 50) => {
    setStats((prev) => {
      let newExp = prev.exp + expGained
      let newLevel = prev.level
      let newMaxExp = prev.maxExp
      let newCoins = prev.coins + coinsGained
      let leveledUp = false

      if (newExp >= newMaxExp) {
        newLevel += 1
        newExp = newExp - newMaxExp
        newMaxExp = Math.round(newMaxExp * 1.4)
        newCoins += 100
        leveledUp = true
      }

      const updated = {
        ...prev,
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        coins: newCoins
      }
      saveUserStats(updated)

      if (leveledUp) {
        setLevelUpAnimation(true)
        setTimeout(() => setLevelUpAnimation(false), 3000)
        showToast(`🎉 CHÚC MỪNG! BẠN ĐÃ ĐẠT CẤP ĐỘ ${newLevel}! (+100 🪙)`, 'success')
      } else {
        showToast(`⚔️ Hoàn thành nhiệm vụ! +${expGained} XP, +${coinsGained} 🪙`, 'success')
      }

      return updated
    })
  }

  // Goal Actions
  const handleCreateGoal = async (goalData) => {
    const res = await createGoalApi(goalData)
    if (res.data) {
      setGoals((prev) => [res.data, ...prev])
      showToast('✨ Đã nhận nhiệm vụ mới thành công!', 'success')
    }
  }

  const handleCompleteGoal = async (goal) => {
    completeGoalLocal(goal.id, config.userId)
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: 'COMPLETED', updatedAt: new Date().toISOString() } : g))
    )
    awardExperience(150, 50)
  }

  const handlePauseGoal = async (goal) => {
    await pauseGoalApi(goal.id, config.userId)
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: 'PAUSE', updatedAt: new Date().toISOString() } : g))
    )
    showToast('⏸️ Đã tạm dừng nhiệm vụ.', 'info')
  }

  const handleResumeGoal = async (goal) => {
    await updateGoalApi(goal.id, config.userId, { title: goal.title })
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: 'ACTIVE', updatedAt: new Date().toISOString() } : g))
    )
    showToast('⚔️ Đã tiếp tục thực hiện!', 'success')
  }

  const handleArchiveGoal = async (goal) => {
    await archiveGoalApi(goal.id, config.userId)
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, status: 'ARCHIVED', updatedAt: new Date().toISOString() } : g))
    )
    showToast('📦 Đã lưu trữ nhiệm vụ.', 'info')
  }

  const handleUpdateGoal = async (goalId, updateData) => {
    await updateGoalApi(goalId, config.userId, updateData)
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updateData, updatedAt: new Date().toISOString() } : g))
    )
    showToast('Đã lưu thay đổi nhiệm vụ.', 'success')
  }

  return (
    <div className="mobile-app-wrapper">
      {/* Level Up Celebration Banner */}
      {levelUpAnimation && (
        <div className="level-up-banner">
          <div className="level-up-content">
            <span className="level-up-badge">LEVEL UP!</span>
            <h3>Cấp Độ Mới: Lv.{stats.level}</h3>
            <p>Sức mạnh kỷ luật của bạn đã được nâng cấp!</p>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`app-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Mobile Screen Container */}
      <div className="mobile-phone-container">
        {/* Top Header */}
        <Header
          stats={stats}
          isConnected={isConnected}
          isBackendData={isBackendData}
          onOpenProfile={() => setActiveTab('character')}
        />

        {/* Tab 1: Quests Screen */}
        {activeTab === 'quests' && (
          <main className="tab-pane quests-tab">
            {/* Search and Filter Row */}
            <div className="search-filter-box">
              <div className="search-input-wrap">
                <IconSearch className="w-4 h-4 search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm nhiệm vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="filter-chips-row">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'ACTIVE', label: '⚔️ Đang làm' },
                  { key: 'PAUSE', label: '⏸️ Tạm dừng' },
                  { key: 'COMPLETED', label: '✨ Hoàn thành' },
                  { key: 'ARCHIVED', label: '📦 Lưu trữ' }
                ].map((chip) => (
                  <button
                    key={chip.key}
                    className={`filter-chip ${filterStatus === chip.key ? 'active' : ''}`}
                    onClick={() => setFilterStatus(chip.key)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quests List */}
            <div className="quests-content">
              {isLoading ? (
                <div className="loading-state">
                  <IconRefresh className="w-8 h-8 animate-spin text-indigo-400" />
                  <p>Đang tải nhiệm vụ Life-Quest...</p>
                </div>
              ) : filteredGoals.length > 0 ? (
                <div className="quests-list">
                  {filteredGoals.map((goal) => (
                    <QuestCard
                      key={goal.id}
                      goal={goal}
                      onComplete={handleCompleteGoal}
                      onPause={handlePauseGoal}
                      onResume={handleResumeGoal}
                      onArchive={handleArchiveGoal}
                      onClick={(g) => setSelectedGoal(g)}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🎯</div>
                  <h3>Chưa có nhiệm vụ nào</h3>
                  <p>
                    {searchQuery
                      ? 'Không tìm thấy nhiệm vụ phù hợp với từ khóa.'
                      : 'Hãy tạo nhiệm vụ mới để bắt đầu cuộc hành trình rèn luyện bản thân!'}
                  </p>
                  <button
                    className="action-btn btn-complete mt-4"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    + Nhận Nhiệm Vụ Đầu Tiên
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* Tab 2: Character Profile */}
        {activeTab === 'character' && (
          <CharacterTab stats={stats} goals={goals} />
        )}

        {/* Tab 3: Settings & API Config */}
        {activeTab === 'settings' && (
          <SettingsTab
            onConfigChange={(newCfg) => setConfig(newCfg)}
            onRefreshData={loadGoals}
          />
        )}

        {/* Bottom Mobile Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenCreateModal={() => setIsCreateOpen(true)}
        />
      </div>

      {/* Create Quest Modal */}
      <CreateGoalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateGoal}
        userId={config.userId}
      />

      {/* Goal Detail & Edit Modal */}
      <GoalDetailModal
        goal={selectedGoal}
        isOpen={Boolean(selectedGoal)}
        onClose={() => setSelectedGoal(null)}
        onUpdate={handleUpdateGoal}
        onArchive={handleArchiveGoal}
        onPause={handlePauseGoal}
        onResume={handleResumeGoal}
        onComplete={handleCompleteGoal}
      />
    </div>
  )
}
