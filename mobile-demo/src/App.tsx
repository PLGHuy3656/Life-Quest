import React, { useState } from 'react'
import { StoreProvider, useStore } from './store/questStore'
import { TopBar } from './components/shell/TopBar'
import { BottomNav } from './components/shell/BottomNav'
import { FoxCompanionDrawer } from './components/shell/FoxCompanionDrawer'
import { QuickCreateModal } from './components/shell/QuickCreateModal'
import { FigmaLinkModal } from './components/shell/FigmaLinkModal'
import { DashboardScreen } from './screens/DashboardScreen'
import { WorkScreen } from './screens/WorkScreen'
import { CalendarScreen } from './screens/CalendarScreen'
import { FocusScreen } from './screens/FocusScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'
import { SocialScreen } from './screens/SocialScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { TabId } from './types'
import { Flame, Award, Timer, Maximize2, Minimize2 } from 'lucide-react'

function MobileAppContent() {
  const { tasks, toggleFoxDrawer, player } = useStore()
  const [currentTab, setCurrentTab] = useState<TabId>('wardrobe') // Default to Wardrobe so user sees it right away!
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isFigmaOpen, setIsFigmaOpen] = useState(false)
  const [isFramed, setIsFramed] = useState(false) // Default to full responsive view so it doesn't look like a weird black box

  const pendingTasksCount = tasks.filter((t) => !t.completed).length

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'var(--lq-bg)',
      position: 'relative'
    }}>
      {/* Viewport container */}
      <div
        style={{
          width: '100%',
          maxWidth: isFramed ? 430 : 960,
          minHeight: '100vh',
          background: 'var(--lq-bg)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isFramed ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
          borderRadius: isFramed ? 36 : 0,
          border: isFramed ? '8px solid #28333E' : 'none',
          margin: isFramed ? '20px auto' : '0 auto',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Top Header - Exact match to Desktop Screenshot */}
        <TopBar
          currentTab={currentTab}
          onNavigateTab={setCurrentTab}
          onOpenFigma={() => setIsFigmaOpen(true)}
        />

        {/* Quick Side Rail Floating Widget (Matches Desktop screenshot's left rail!) */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: 10,
          transform: 'translateY(-50%)',
          zIndex: 45,
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '8px 5px',
          boxShadow: '0 4px 16px rgba(22, 50, 74, 0.1)',
          border: '1px solid rgba(22, 50, 74, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          {/* Fox Paw with orange badge 3 (from screenshot) */}
          <button
            onClick={toggleFoxDrawer}
            style={{
              position: 'relative',
              width: 32,
              height: 32,
              borderRadius: 12,
              background: '#F26B3A',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(242, 107, 58, 0.35)'
            }}
            title="Mở Bé Cáo Kitsu"
          >
            🐾
            <span style={{
              position: 'absolute',
              top: -3,
              right: -3,
              background: '#FFFFFF',
              color: '#F26B3A',
              fontSize: 9,
              fontWeight: 800,
              width: 13,
              height: 13,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>

          {/* Streak Flame */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 10,
            fontWeight: 800,
            color: '#F26B3A'
          }}>
            <Flame size={15} />
            <span style={{ fontSize: 9 }}>{player.streak}</span>
          </div>

          {/* Timer Mode */}
          <button
            onClick={() => setCurrentTab('focus')}
            style={{ background: 'transparent', color: '#768796', padding: 2 }}
            title="Tập trung Pomodoro"
          >
            <Timer size={15} />
          </button>

          {/* Achievements Medal */}
          <button
            onClick={() => setCurrentTab('profile')}
            style={{ background: 'transparent', color: '#768796', padding: 2 }}
            title="Hồ sơ & Thành tựu"
          >
            <Award size={15} />
          </button>

          {/* Toggle Phone frame mode */}
          <button
            onClick={() => setIsFramed(!isFramed)}
            style={{ background: 'transparent', color: '#768796', padding: 2 }}
            title={isFramed ? 'Toàn màn hình' : 'Khung điện thoại'}
          >
            {isFramed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
        </div>

        {/* Scrollable Screen Content */}
        <main style={{ flex: 1, paddingLeft: 42 }}>
          {currentTab === 'wardrobe' && <WardrobeScreen />}
          {currentTab === 'dashboard' && (
            <DashboardScreen
              onNavigateTab={setCurrentTab}
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )}
          {currentTab === 'work' && (
            <WorkScreen
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )}
          {currentTab === 'calendar' && <CalendarScreen />}
          {currentTab === 'focus' && <FocusScreen />}
          {currentTab === 'social' && <SocialScreen />}
          {currentTab === 'profile' && <ProfileScreen />}
        </main>

        {/* Bottom Nav */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Slide-over Fox Drawer */}
        <FoxCompanionDrawer />

        {/* Quick Create Sheet */}
        <QuickCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        {/* Figma Design Link Modal */}
        <FigmaLinkModal
          isOpen={isFigmaOpen}
          onClose={() => setIsFigmaOpen(false)}
        />
      </div>
    </div>
  )
}

export function App() {
  return (
    <StoreProvider>
      <MobileAppContent />
    </StoreProvider>
  )
}

export default App
