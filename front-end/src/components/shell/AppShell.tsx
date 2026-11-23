import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  CheckSquare,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  ZapOff
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { FloatingMascotDock } from '@/features/mascot/FloatingMascotDock'
import { authApi } from '@/services/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { DesktopHeader } from './DesktopHeader'
import styles from './AppShell.module.css'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Trang chủ',
  '/work': 'Công việc & Mục tiêu',
  '/calendar': 'Lịch hành trình',
  '/messages': 'Tin nhắn & Nhóm',
  '/wardrobe': 'Tủ đồ Fox V2',
  '/settings': 'Cài đặt'
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const toggleReducedMotion = useUiStore((s) => s.toggleReducedMotion)
  const openSheet = useUiStore((s) => s.openSheet)
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearSession = useAuthStore((s) => s.clearSession)

  const currentTitle = ROUTE_TITLES[location.pathname] ?? 'LifeQuest'

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Always clear local in-memory session
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.mainWrap}>
        {/* Restored Claude Canvas Desktop Header (>= 1024px) */}
        <DesktopHeader onLogout={handleLogout} />

        {/* Existing Tablet/Mobile Header (< 1024px, unchanged) */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.mobileBrand}>
              <div className={styles.brandMark} aria-hidden="true">
                LQ
              </div>
              <span className={styles.brandName}>LifeQuest</span>
            </div>

            <div className={styles.headerContext}>
              <span className={styles.headerTitle}>{currentTitle}</span>
              <span className={styles.headerSub}>FE-03 • Fox V2 Mascot &amp; Workflows</span>
            </div>

            <div className={styles.headerActions}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openSheet('search')}
                aria-label="Tìm kiếm nhiệm vụ"
              >
                <Search size={18} />
              </Button>
              <Button
                variant={reducedMotion ? 'primary' : 'ghost'}
                size="icon"
                onClick={toggleReducedMotion}
                aria-label={reducedMotion ? 'Tắt chế độ giảm chuyển động' : 'Bật chế độ giảm chuyển động'}
                aria-pressed={reducedMotion}
                title="Giảm chuyển động (lq-rm)"
              >
                <ZapOff size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openSheet('notifications')}
                aria-label="Thông báo"
              >
                <Bell size={18} />
              </Button>
              {isAuthenticated ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Đăng xuất">
                  <LogOut size={15} />
                  <span>Đăng xuất</span>
                </Button>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    <LogIn size={15} />
                    <span>Đăng nhập</span>
                  </Button>
                </Link>
              )}
              <Button
                variant="subtle"
                size="sm"
                onClick={() => openSheet('api-status')}
                aria-label="Mở bảng trạng thái API"
              >
                <Chip tone={isAuthenticated ? 'success' : 'reward'}>
                  {isAuthenticated ? 'LIVE' : 'HYBRID'}
                </Chip>
              </Button>
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>

      {/* Tablet Floating Pill Navigation (700px - 1023px) */}
      <nav className={styles.tabletPillNav} aria-label="Điều hướng máy tính bảng">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.pillLink} ${isActive ? styles.pillLinkActive : ''}`.trim()
          }
        >
          <Home size={16} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink
          to="/work"
          className={({ isActive }) =>
            `${styles.pillLink} ${isActive ? styles.pillLinkActive : ''}`.trim()
          }
        >
          <CheckSquare size={16} />
          <span>Công việc</span>
        </NavLink>
        <button
          type="button"
          className={styles.pillFab}
          onClick={() => openSheet('quick-create')}
        >
          <Plus size={16} />
          <span>Tạo mới</span>
        </button>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `${styles.pillLink} ${isActive ? styles.pillLinkActive : ''}`.trim()
          }
        >
          <Calendar size={16} />
          <span>Lịch</span>
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `${styles.pillLink} ${isActive ? styles.pillLinkActive : ''}`.trim()
          }
        >
          <MessageCircle size={16} />
          <span>Tin nhắn</span>
        </NavLink>
      </nav>

      {/* Mobile 5-slot Bottom Navigation (< 700px) */}
      <nav className={styles.mobileBottomNav} aria-label="Điều hướng di động">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.bnavItem} ${isActive ? styles.bnavItemActive : ''}`.trim()
          }
        >
          <Home size={20} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `${styles.bnavItem} ${isActive ? styles.bnavItemActive : ''}`.trim()
          }
        >
          <MessageCircle size={20} />
          <span>Tin nhắn</span>
        </NavLink>
        <button
          type="button"
          className={styles.bnavFab}
          onClick={() => openSheet('quick-create')}
          aria-label="Tạo nhiệm vụ mới"
        >
          <Plus size={22} />
        </button>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `${styles.bnavItem} ${isActive ? styles.bnavItemActive : ''}`.trim()
          }
        >
          <Calendar size={20} />
          <span>Lịch</span>
        </NavLink>
        <NavLink
          to="/work"
          className={({ isActive }) =>
            `${styles.bnavItem} ${isActive ? styles.bnavItemActive : ''}`.trim()
          }
        >
          <CheckSquare size={20} />
          <span>Công việc</span>
        </NavLink>
      </nav>

      <FloatingMascotDock />
    </div>
  )
}
