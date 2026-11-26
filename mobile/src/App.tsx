import React, { useState } from 'react'
import { StoreProvider, useStore } from './store/questStore'
import { TopBar } from './components/TopBar'
import { BottomNav, TabType } from './components/BottomNav'
import { HomeScreen } from './screens/HomeScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { FocusScreen } from './screens/FocusScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { NewQuestModal } from './components/NewQuestModal'
import { Smartphone, Maximize2, Minimize2, Wifi, Battery } from 'lucide-react'

function MobileApp() {
  const { quests, addQuest } = useStore()
  const [currentTab, setCurrentTab] = useState<TabType>('home')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isFramed, setIsFramed] = useState<boolean>(true)

  const activeQuestsCount = quests.filter((q) => !q.completed).length

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A232C',
      padding: isFramed ? '20px 10px' : 0
    }}>
      {/* Desktop Preview Bar */}
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
        padding: '6px 12px',
        borderRadius: 20,
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 600
      }}>
        <Smartphone size={14} color="#F26B3A" />
        <span style={{ opacity: 0.9 }}>LifeQuest Mobile Preview</span>
        <button
          onClick={() => setIsFramed(!isFramed)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            padding: '4px 8px',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            marginLeft: 4
          }}
        >
          {isFramed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          <span>{isFramed ? 'Toàn màn hình' : 'Khung điện thoại'}</span>
        </button>
      </div>

      {/* Main Mobile App Shell */}
      <div
        className="mobile-app-wrapper"
        style={{
          maxWidth: isFramed ? 430 : '100%',
          height: isFramed ? '890px' : '100vh',
          maxHeight: isFramed ? '92vh' : '100vh',
          borderRadius: isFramed ? 44 : 0,
          border: isFramed ? '10px solid #28333E' : 'none'
        }}
      >
        {/* Simulated Phone Status Bar (Notch / Dynamic Island) */}
        <div style={{
          height: 38,
          background: 'rgba(255, 255, 255, 0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--ink)',
          flexShrink: 0
        }}>
          <span>9:41</span>
          
          {/* Dynamic Island Pill */}
          <div style={{
            width: 90,
            height: 18,
            background: '#16324A',
            borderRadius: 10
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={13} />
            <Battery size={15} />
          </div>
        </div>

        {/* Sticky Mobile Top Header */}
        <TopBar onOpenProfile={() => setCurrentTab('profile')} />

        {/* Scrollable Screen Content */}
        <div className="screen-scroll-area">
          {currentTab === 'home' && (
            <HomeScreen
              onNavigateTab={setCurrentTab}
              onOpenNewQuest={() => setIsModalOpen(true)}
            />
          )}

          {currentTab === 'quests' && (
            <QuestsScreen
              onOpenNewQuest={() => setIsModalOpen(true)}
            />
          )}

          {currentTab === 'focus' && <FocusScreen />}

          {currentTab === 'wardrobe' && <WardrobeScreen />}

          {currentTab === 'profile' && <ProfileScreen />}
        </div>

        {/* Floating / Glass Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeQuestCount={activeQuestsCount}
        />

        {/* New Quest Bottom Sheet Modal */}
        <NewQuestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={addQuest}
        />
      </div>
    </div>
  )
}

export function App() {
  return (
    <StoreProvider>
      <MobileApp />
    </StoreProvider>
  )
}

export default App
