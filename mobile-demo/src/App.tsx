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
import { Smartphone, Monitor, Palette, Sparkles } from 'lucide-react'

type FrameMode = 'iphone' | 'max' | 'fluid'

function MobileAppContent() {
  const { tasks } = useStore()
  const [currentTab, setCurrentTab] = useState<TabId>('wardrobe') // Default to Wardrobe so user sees it right away!
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isFigmaOpen, setIsFigmaOpen] = useState(false)
  const [frameMode, setFrameMode] = useState<FrameMode>('iphone') // Default to iPhone frame so it clearly looks like a mobile phone!

  const pendingTasksCount = tasks.filter((t) => !t.completed).length

  // Calculate container dimensions based on frameMode
  const getContainerStyles = (): React.CSSProperties => {
    if (frameMode === 'fluid') {
      return {
        width: '100%',
        maxWidth: 480,
        minHeight: '100vh',
        height: '100vh',
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        margin: '0 auto'
      }
    }

    const width = frameMode === 'iphone' ? 395 : 430
    const height = frameMode === 'iphone' ? 844 : 920

    return {
      width,
      maxWidth: '96vw',
      height,
      maxHeight: '94vh',
      borderRadius: 48,
      border: '10px solid #1A232E',
      boxShadow: '0 25px 65px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      margin: '12px auto 20px',
      position: 'relative'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#0F1722',
      position: 'relative',
      paddingBottom: 24,
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* ================================================================ */}
      {/* 1. TOP STUDIO CONTROL BAR (For Desktop Testing & Previewing)    */}
      {/* ================================================================ */}
      <div style={{
        width: '100%',
        maxWidth: 720,
        padding: '10px 16px',
        margin: '8px 0 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        color: '#E2E8F0',
        zIndex: 50
      }}>
        {/* Left: Title Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🦊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              LifeQuest Mobile App
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              Giao diện chuẩn Smartphone iOS / Android
            </div>
          </div>
        </div>

        {/* Center: Device Frame Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '3px 4px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <button
            onClick={() => setFrameMode('iphone')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: frameMode === 'iphone' ? '#F26B3A' : 'transparent',
              color: '#FFFFFF',
              borderRadius: 16,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Khung iPhone 16 Pro (395px)"
          >
            <Smartphone size={13} />
            <span>iPhone</span>
          </button>

          <button
            onClick={() => setFrameMode('max')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: frameMode === 'max' ? '#F26B3A' : 'transparent',
              color: '#FFFFFF',
              borderRadius: 16,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Khung iPhone Pro Max (430px)"
          >
            <Smartphone size={15} />
            <span>Pro Max</span>
          </button>

          <button
            onClick={() => setFrameMode('fluid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: frameMode === 'fluid' ? '#F26B3A' : 'transparent',
              color: '#FFFFFF',
              borderRadius: 16,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Toàn màn hình Mobile (100% Mobile)"
          >
            <Monitor size={13} />
            <span>Toàn màn hình</span>
          </button>
        </div>

        {/* Right: Figma Spec Link */}
        <button
          onClick={() => setIsFigmaOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: 'none',
            background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.25) 0%, rgba(10, 207, 131, 0.2) 100%)',
            color: '#D8B4FE',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: 'rgba(162, 89, 255, 0.4)',
            borderRadius: 16,
            padding: '5px 12px',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <Palette size={13} />
          <span>Figma Spec</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* 2. THE SMARTPHONE DEVICE VIEWPORT CONTAINER                       */}
      {/* ================================================================ */}
      <div
        style={{
          ...getContainerStyles(),
          background: 'var(--lq-bg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Mobile Status Bar & Top App Header */}
        <TopBar
          currentTab={currentTab}
          onNavigateTab={setCurrentTab}
          onOpenFigma={() => setIsFigmaOpen(true)}
        />

        {/* Scrollable Mobile Screen Content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: 'calc(var(--bnav-h) + 24px)',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }}
        >
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

        {/* Bottom Mobile Tab Bar */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingTasksCount={pendingTasksCount}
        />

        {/* iOS Bottom Home Indicator Bar */}
        <div style={{
          position: 'absolute',
          bottom: 5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 128,
          height: 4,
          background: '#16324A',
          borderRadius: 3,
          opacity: 0.35,
          pointerEvents: 'none',
          zIndex: 60
        }} />

        {/* Slide-over Fox Companion Drawer */}
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
