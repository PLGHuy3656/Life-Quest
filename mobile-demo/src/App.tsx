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
import { Smartphone, Maximize2, Minimize2, Wifi, Battery, Layers } from 'lucide-react'

function MobileAppContent() {
  const { tasks } = useStore()
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isFigmaOpen, setIsFigmaOpen] = useState(false)
  const [isFramed, setIsFramed] = useState(true)

  const pendingTasksCount = tasks.filter((t) => !t.completed).length

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0E1720',
      padding: isFramed ? '16px 8px' : 0
    }}>
      {/* Top Preview Controls for Desktop Testing */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 14,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        padding: '5px 12px',
        borderRadius: 20,
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 600
      }}>
        <button
          onClick={() => setIsFigmaOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #0ACF83 0%, #A259FF 100%)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 800
          }}
        >
          <Layers size={12} />
          <span>Figma Design</span>
        </button>

        <button
          onClick={() => setIsFramed(!isFramed)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11
          }}
        >
          {isFramed ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          <span>{isFramed ? 'Toàn màn hình' : 'Khung điện thoại'}</span>
        </button>
      </div>

      {/* Main Phone Viewport */}
      <div
        className="phone-viewport"
        style={{
          maxWidth: isFramed ? 430 : '100%',
          height: isFramed ? '890px' : '100vh',
          maxHeight: isFramed ? '92vh' : '100vh',
          borderRadius: isFramed ? 44 : 0,
          border: isFramed ? '10px solid #202933' : 'none'
        }}
      >
        {/* Dynamic Island / Notch */}
        <div style={{
          height: 36,
          background: 'var(--lq-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 22px',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--lq-ink)',
          flexShrink: 0
        }}>
          <span>9:41</span>
          <div style={{
            width: 84,
            height: 18,
            background: '#16324A',
            borderRadius: 9
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Wifi size={12} />
            <Battery size={14} />
          </div>
        </div>

        {/* Top Bar Header with Figma Link Button */}
        <TopBar
          onNavigateTab={setCurrentTab}
          onOpenFigma={() => setIsFigmaOpen(true)}
        />

        {/* Scrollable Main Screen */}
        <div className="phone-content">
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

          {currentTab === 'wardrobe' && <WardrobeScreen />}

          {currentTab === 'social' && <SocialScreen />}

          {currentTab === 'profile' && <ProfileScreen />}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={pendingTasksCount}
        />

        {/* Fox Companion Drawer */}
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
