import React, { useState } from 'react'
import { StoreProvider } from './store/questStore'
import { TopBar } from './components/shell/TopBar'
import { BottomNav } from './components/shell/BottomNav'
import { FoxCompanionDrawer } from './components/shell/FoxCompanionDrawer'

// All 18 Screens from LifeQuest Mobile UI Specification
import { LoadingScreen } from './screens/LoadingScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { WorkScreen } from './screens/WorkScreen'
import { TaskDetailScreen } from './screens/TaskDetailScreen'
import { FocusScreen } from './screens/FocusScreen'
import { HabitsScreen } from './screens/HabitsScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { QuestDetailScreen } from './screens/QuestDetailScreen'
import { CreateSheetModal } from './screens/CreateSheetModal'
import { CalendarScreen } from './screens/CalendarScreen'
import { MessagesScreen } from './screens/MessagesScreen'
import { ChatScreen } from './screens/ChatScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { SettingsScreen } from './screens/SettingsScreen'

import { ScreenId, TabId } from './types'
import { Smartphone, Monitor, Layers } from 'lucide-react'

type FrameMode = 'iphone' | 'max' | 'fluid'

const ALL_SCREENS: { id: ScreenId; label: string; group: string }[] = [
  { id: '01_loading', label: '01 · Loading', group: 'Onboarding' },
  { id: '02_welcome', label: '02 · Welcome', group: 'Onboarding' },
  { id: '03_login', label: '03 · Login', group: 'Onboarding' },
  { id: '04_register', label: '04 · Khảo sát Đăng ký', group: 'Onboarding' },
  { id: '05_dashboard', label: '05 · Trang chủ', group: 'Chính' },
  { id: '06_tasks', label: '06 · Nhiệm vụ (Tasks)', group: 'Công việc' },
  { id: '07_task_detail', label: '07 · Chi tiết Task', group: 'Công việc' },
  { id: '08_focus', label: '08 · Tập trung (Focus)', group: 'Công việc' },
  { id: '09_habits', label: '09 · Thói quen (Habits)', group: 'Công việc' },
  { id: '10_quests', label: '10 · Đại nhiệm vụ (Quests)', group: 'Công việc' },
  { id: '11_quest_detail', label: '11 · Chi tiết Quest', group: 'Công việc' },
  { id: '12_create_sheet', label: '12 · Tạo mới (Sheet)', group: 'Chính' },
  { id: '13_calendar', label: '13 · Lịch trình', group: 'Chính' },
  { id: '14_messages', label: '14 · Tin nhắn', group: 'Xã hội' },
  { id: '15_chat', label: '15 · Trò chuyện', group: 'Xã hội' },
  { id: '16_wardrobe', label: '16 · Tủ đồ Fox', group: 'Mascot' },
  { id: '17_profile', label: '17 · Hồ sơ', group: 'Cá nhân' },
  { id: '18_settings', label: '18 · Cài đặt', group: 'Cá nhân' }
]

function MobileAppContent() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('05_dashboard')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [frameMode, setFrameMode] = useState<FrameMode>('iphone')
  const [activeChatContact, setActiveChatContact] = useState('Hà My')

  // Map ScreenId to BottomNav active Tab
  const getActiveTab = (): TabId => {
    switch (currentScreen) {
      case '05_dashboard':
        return 'dashboard'
      case '14_messages':
      case '15_chat':
        return 'messages'
      case '13_calendar':
        return 'calendar'
      case '06_tasks':
      case '07_task_detail':
      case '09_habits':
      case '10_quests':
      case '11_quest_detail':
        return 'work'
      case '16_wardrobe':
        return 'wardrobe'
      case '17_profile':
      case '18_settings':
        return 'profile'
      case '08_focus':
        return 'focus'
      default:
        return 'dashboard'
    }
  }

  // Handle BottomNav tab navigation
  const handleSelectTab = (tab: TabId) => {
    switch (tab) {
      case 'dashboard':
        setCurrentScreen('05_dashboard')
        break
      case 'messages':
        setCurrentScreen('14_messages')
        break
      case 'calendar':
        setCurrentScreen('13_calendar')
        break
      case 'work':
      case 'tasks':
        setCurrentScreen('06_tasks')
        break
      case 'wardrobe':
        setCurrentScreen('16_wardrobe')
        break
      case 'profile':
        setCurrentScreen('17_profile')
        break
      case 'focus':
        setCurrentScreen('08_focus')
        break
      default:
        setCurrentScreen('05_dashboard')
    }
  }

  // Calculate container dimensions
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
      margin: '8px auto 16px',
      position: 'relative'
    }
  }

  // Check if screen uses standard shell header & bottom nav
  const isFullStandaloneScreen =
    currentScreen === '01_loading' ||
    currentScreen === '02_welcome' ||
    currentScreen === '03_login' ||
    currentScreen === '04_register'

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
      {/* TOP STUDIO TOOLBAR (18 Screens Switcher & Device Controls)       */}
      {/* ================================================================ */}
      <div style={{
        width: '100%',
        maxWidth: 900,
        padding: '10px 16px',
        margin: '6px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        color: '#E2E8F0',
        zIndex: 50
      }}>
        {/* Left: App Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🦊</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#FFFFFF' }}>
              LifeQuest Mobile UI
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              18/18 màn hình hoàn chỉnh · Chuẩn iOS/Android
            </div>
          </div>
        </div>

        {/* Center: 18 Screens Quick Jump Dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '4px 8px',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Layers size={14} color="#F26B3A" />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#CBD5E1' }}>Màn hình:</span>
          <select
            value={currentScreen}
            onChange={(e) => setCurrentScreen(e.target.value as ScreenId)}
            style={{
              background: '#1E293B',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 14,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {ALL_SCREENS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.group})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Device Frame Switcher & Figma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '2px 4px',
            borderRadius: 18,
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              onClick={() => setFrameMode('iphone')}
              style={{
                border: 'none',
                background: frameMode === 'iphone' ? '#F26B3A' : 'transparent',
                color: '#FFFFFF',
                borderRadius: 14,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="iPhone 16 Pro (395px)"
            >
              <Smartphone size={13} />
            </button>

            <button
              onClick={() => setFrameMode('max')}
              style={{
                border: 'none',
                background: frameMode === 'max' ? '#F26B3A' : 'transparent',
                color: '#FFFFFF',
                borderRadius: 14,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="iPhone Pro Max (430px)"
            >
              <Smartphone size={15} />
            </button>

            <button
              onClick={() => setFrameMode('fluid')}
              style={{
                border: 'none',
                background: frameMode === 'fluid' ? '#F26B3A' : 'transparent',
                color: '#FFFFFF',
                borderRadius: 14,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Toàn màn hình Mobile"
            >
              <Monitor size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* THE SMARTPHONE DEVICE CONTAINER                                  */}
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
        {/* Top App Header (Shown on main screens) */}
        {!isFullStandaloneScreen && (
          <TopBar
            currentTab={getActiveTab()}
            onNavigateTab={handleSelectTab}
          />
        )}

        {/* Scrollable Screen Content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: isFullStandaloneScreen ? 0 : 'calc(var(--bnav-h) + 16px)',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }}
        >
          {/* 01. Loading */}
          {currentScreen === '01_loading' && (
            <LoadingScreen onFinish={() => setCurrentScreen('02_welcome')} />
          )}

          {/* 02. Welcome */}
          {currentScreen === '02_welcome' && (
            <WelcomeScreen
              onStart={() => setCurrentScreen('04_register')}
              onLogin={() => setCurrentScreen('03_login')}
            />
          )}

          {/* 03. Login */}
          {currentScreen === '03_login' && (
            <LoginScreen
              onLoginSuccess={() => setCurrentScreen('05_dashboard')}
              onGoToRegister={() => setCurrentScreen('04_register')}
              onClose={() => setCurrentScreen('02_welcome')}
            />
          )}

          {/* 04. Register Survey */}
          {currentScreen === '04_register' && (
            <RegisterScreen
              onComplete={() => setCurrentScreen('05_dashboard')}
              onBack={() => setCurrentScreen('02_welcome')}
            />
          )}

          {/* 05. Dashboard */}
          {currentScreen === '05_dashboard' && (
            <DashboardScreen
              onNavigateTab={handleSelectTab}
              onOpenTaskDetail={() => setCurrentScreen('07_task_detail')}
              onOpenFocus={() => setCurrentScreen('08_focus')}
              onOpenWardrobe={() => setCurrentScreen('16_wardrobe')}
            />
          )}

          {/* 06. Tasks (Work) */}
          {currentScreen === '06_tasks' && (
            <WorkScreen
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )}

          {/* 07. Task Detail */}
          {currentScreen === '07_task_detail' && (
            <TaskDetailScreen
              onBack={() => setCurrentScreen('06_tasks')}
              onStartFocus={() => setCurrentScreen('08_focus')}
            />
          )}

          {/* 08. Focus */}
          {currentScreen === '08_focus' && (
            <FocusScreen
              onClose={() => setCurrentScreen('05_dashboard')}
            />
          )}

          {/* 09. Habits */}
          {currentScreen === '09_habits' && (
            <HabitsScreen
              onNavigateTab={(tab) => {
                if (tab === 'tasks') setCurrentScreen('06_tasks')
                else if (tab === 'quests') setCurrentScreen('10_quests')
              }}
            />
          )}

          {/* 10. Quests */}
          {currentScreen === '10_quests' && (
            <QuestsScreen
              onNavigateTab={(tab) => {
                if (tab === 'tasks') setCurrentScreen('06_tasks')
                else if (tab === 'habits') setCurrentScreen('09_habits')
              }}
              onSelectQuest={() => setCurrentScreen('11_quest_detail')}
            />
          )}

          {/* 11. Quest Detail */}
          {currentScreen === '11_quest_detail' && (
            <QuestDetailScreen
              onBack={() => setCurrentScreen('10_quests')}
            />
          )}

          {/* 12. Create Sheet Standalone Preview */}
          {currentScreen === '12_create_sheet' && (
            <div style={{ position: 'relative', height: '100%', minHeight: 600 }}>
              <DashboardScreen
                onNavigateTab={handleSelectTab}
                onOpenTaskDetail={() => setCurrentScreen('07_task_detail')}
                onOpenFocus={() => setCurrentScreen('08_focus')}
                onOpenWardrobe={() => setCurrentScreen('16_wardrobe')}
              />
              <CreateSheetModal
                isOpen={true}
                onClose={() => setCurrentScreen('05_dashboard')}
              />
            </div>
          )}

          {/* 13. Calendar */}
          {currentScreen === '13_calendar' && <CalendarScreen />}

          {/* 14. Messages */}
          {currentScreen === '14_messages' && (
            <MessagesScreen
              onOpenChat={(contact) => {
                setActiveChatContact(contact)
                setCurrentScreen('15_chat')
              }}
            />
          )}

          {/* 15. Chat */}
          {currentScreen === '15_chat' && (
            <ChatScreen
              contactName={activeChatContact}
              onBack={() => setCurrentScreen('14_messages')}
            />
          )}

          {/* 16. Wardrobe */}
          {currentScreen === '16_wardrobe' && <WardrobeScreen />}

          {/* 17. Profile */}
          {currentScreen === '17_profile' && (
            <ProfileScreen
              onOpenSettings={() => setCurrentScreen('18_settings')}
              onOpenWardrobe={() => setCurrentScreen('16_wardrobe')}
            />
          )}

          {/* 18. Settings */}
          {currentScreen === '18_settings' && (
            <SettingsScreen
              onBack={() => setCurrentScreen('17_profile')}
              onLogout={() => setCurrentScreen('02_welcome')}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        {!isFullStandaloneScreen && (
          <BottomNav
            currentTab={getActiveTab()}
            onSelectTab={handleSelectTab}
            onOpenCreate={() => setIsCreateOpen(true)}
            pendingTasksCount={2}
            unreadMessagesCount={3}
          />
        )}

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

        {/* Dynamic Create Sheet Modal */}
        <CreateSheetModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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
