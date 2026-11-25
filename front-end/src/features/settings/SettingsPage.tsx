import { useEffect, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import { useOptionalCompanion } from '@/features/mascot/CompanionProvider'
import {
  useProfileQuery,
  useSettingsMutations,
  useUserSettingsQuery
} from '@/hooks/useSettingsData'
import { authApi } from '@/services/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useMessengerStore } from '@/stores/messengerStore'
import { useUiStore } from '@/stores/uiStore'
import type { PrivacyMode } from '@/types/domain'
import styles from './SettingsPage.module.css'

type SettingsSection = 'preferences' | 'profile' | 'notifications' | 'privacy'

const SOUND_EFFECTS_KEY = 'lq_sound_effects'

function readSoundEffects(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(SOUND_EFFECTS_KEY) !== '0'
  } catch {
    return true
  }
}

const SIDE_NAV_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: 'preferences', label: 'Cài đặt riêng' },
  { id: 'profile', label: 'Hồ sơ' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'privacy', label: 'Cài đặt quyền riêng tư' }
]

export function SettingsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const companion = useOptionalCompanion()

  const profileQuery = useProfileQuery()
  const settingsQuery = useUserSettingsQuery()
  const mutations = useSettingsMutations()

  const authUser = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearSession = useAuthStore((s) => s.clearSession)

  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const setReducedMotion = useUiStore((s) => s.setReducedMotion)
  const floatingEnabled = useMessengerStore((s) => s.floatingEnabled)
  const setFloatingEnabled = useMessengerStore((s) => s.setFloatingEnabled)

  const [activeSection, setActiveSection] = useState<SettingsSection>('preferences')
  const [soundEffects, setSoundEffects] = useState<boolean>(() => readSoundEffects())

  // Server-backed profile state
  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ ok?: string; err?: string }>({})

  // Server-backed user settings state
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh')
  const [language, setLanguage] = useState('vi')
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('FRIENDS')
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  const [settingsMsg, setSettingsMsg] = useState<{ ok?: string; err?: string }>({})

  useEffect(() => {
    const p = profileQuery.data?.profile
    if (p) {
      setDisplayName(p.displayName ?? '')
      setTitle(p.title ?? '')
      setBio(p.bio ?? '')
    }
  }, [profileQuery.data])

  useEffect(() => {
    const s = settingsQuery.data
    if (s) {
      setTimezone(s.timezone)
      setLanguage(s.language)
      setPrivacyMode(s.privacyMode)
      setNotificationEnabled(s.notificationEnabled)
    }
  }, [settingsQuery.data])

  const handleToggleSound = (enabled: boolean) => {
    setSoundEffects(enabled)
    try {
      window.localStorage.setItem(SOUND_EFFECTS_KEY, enabled ? '1' : '0')
    } catch {
      // Ignore storage errors
    }
  }

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileMsg({})
    try {
      await mutations.updateProfile.mutateAsync({
        displayName: displayName.trim() || undefined,
        title: title.trim(),
        bio: bio.trim()
      })
      setProfileMsg({ ok: 'Đã lưu thông tin hồ sơ thành công.' })
    } catch (err) {
      setProfileMsg({ err: err instanceof Error ? err.message : 'Cập nhật hồ sơ thất bại.' })
    }
  }

  const submitSettings = async (e: FormEvent) => {
    e.preventDefault()
    setSettingsMsg({})
    try {
      await mutations.updateSettings.mutateAsync({
        timezone: timezone.trim(),
        language,
        privacyMode,
        notificationEnabled
      })
      setSettingsMsg({ ok: 'Đã lưu thay đổi cài đặt thành công.' })
    } catch (err) {
      setSettingsMsg({ err: err instanceof Error ? err.message : 'Cập nhật cài đặt thất bại.' })
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Clear local session regardless of remote revoke status
    } finally {
      clearSession()
      queryClient.clear()
      useMessengerStore.getState().clearPrivateSession()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className={styles.layout} data-testid="settings-page">
      {/* Main Left Panel — Clean, focused content per selected category */}
      <section className={styles.mainCard} aria-label="Nội dung cài đặt">
        {activeSection === 'preferences' && (
          <>
            <div className={styles.pageTitleRow}>
              <h1 className={styles.pageTitle}>Cài đặt riêng</h1>
              <SourceBadge source="LIVE" />
            </div>

            <div className={styles.group}>
              <h2 className={styles.groupHeading}>Cài đặt trải nghiệm</h2>
              <div className={styles.toggleList}>
                <label className={styles.toggleRow}>
                  <span>
                    <span className={styles.toggleLabel}>Hiệu ứng âm thanh</span>
                  </span>
                  <span className={styles.switchWrap}>
                    <input
                      type="checkbox"
                      className={styles.switchInput}
                      checked={soundEffects}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                    />
                    <span className={styles.switchTrack} aria-hidden="true" />
                  </span>
                </label>

                <label className={styles.toggleRow}>
                  <span>
                    <span className={styles.toggleLabel}>Hiệu ứng hoạt ảnh</span>
                  </span>
                  <span className={styles.switchWrap}>
                    <input
                      type="checkbox"
                      className={styles.switchInput}
                      checked={!reducedMotion}
                      onChange={(e) => setReducedMotion(!e.target.checked)}
                      data-testid="settings-animations-toggle"
                    />
                    <span className={styles.switchTrack} aria-hidden="true" />
                  </span>
                </label>

                {companion && (
                  <>
                    <label className={styles.toggleRow}>
                      <span>
                        <span className={styles.toggleLabel}>Thông báo khích lệ từ Fox</span>
                      </span>
                      <span className={styles.switchWrap}>
                        <input
                          type="checkbox"
                          className={styles.switchInput}
                          checked={companion.settings.interaction && companion.settings.idleVariation}
                          onChange={(e) =>
                            companion.update({
                              interaction: e.target.checked,
                              idleVariation: e.target.checked
                            })
                          }
                        />
                        <span className={styles.switchTrack} aria-hidden="true" />
                      </span>
                    </label>

                    <label className={styles.toggleRow}>
                      <span>
                        <span className={styles.toggleLabel}>Fox nhìn theo con trỏ chuột</span>
                      </span>
                      <span className={styles.switchWrap}>
                        <input
                          type="checkbox"
                          className={styles.switchInput}
                          checked={companion.settings.lookAt}
                          onChange={(e) => companion.update({ lookAt: e.target.checked })}
                        />
                        <span className={styles.switchTrack} aria-hidden="true" />
                      </span>
                    </label>
                  </>
                )}

                <label className={styles.toggleRow}>
                  <span>
                    <span className={styles.toggleLabel}>Bong bóng chat nổi</span>
                  </span>
                  <span className={styles.switchWrap}>
                    <input
                      type="checkbox"
                      className={styles.switchInput}
                      checked={floatingEnabled}
                      onChange={(e) => setFloatingEnabled(e.target.checked)}
                    />
                    <span className={styles.switchTrack} aria-hidden="true" />
                  </span>
                </label>
              </div>
            </div>

            <div className={styles.group}>
              <h2 className={styles.groupHeading}>Giao diện &amp; Ngôn ngữ</h2>
              {settingsQuery.isLoading ? (
                <LoadingSkeleton height={130} />
              ) : settingsQuery.error ? (
                <ErrorBanner error={settingsQuery.error} onRetry={() => settingsQuery.refetch()} />
              ) : (
                <form className={styles.form} onSubmit={submitSettings}>
                  <div className={styles.field}>
                    <label htmlFor="set-lang" className={styles.label}>
                      Ngôn ngữ hiển thị
                    </label>
                    <select
                      id="set-lang"
                      className={styles.select}
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="set-tz" className={styles.label}>
                      Múi giờ
                    </label>
                    <input
                      id="set-tz"
                      className={styles.input}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  {settingsMsg.ok && (
                    <div className={styles.statusOk} role="status">
                      {settingsMsg.ok}
                    </div>
                  )}
                  {settingsMsg.err && (
                    <div className={styles.statusErr} role="alert">
                      {settingsMsg.err}
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <Button
                      type="submit"
                      variant="accent"
                      disabled={mutations.updateSettings.isPending}
                    >
                      Lưu cài đặt
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {activeSection === 'profile' && (
          <>
            <div className={styles.pageTitleRow}>
              <h1 className={styles.pageTitle}>Hồ sơ</h1>
              <SourceBadge source="LIVE" />
            </div>

            {profileQuery.isLoading ? (
              <LoadingSkeleton height={190} />
            ) : profileQuery.error ? (
              <ErrorBanner error={profileQuery.error} onRetry={() => profileQuery.refetch()} />
            ) : (
              <form className={styles.form} onSubmit={submitProfile}>
                <div className={styles.field}>
                  <label htmlFor="prof-name" className={styles.label}>
                    Tên hiển thị (tối đa 100 ký tự)
                  </label>
                  <input
                    id="prof-name"
                    className={styles.input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="prof-title" className={styles.label}>
                    Danh hiệu / Tiêu đề
                  </label>
                  <input
                    id="prof-title"
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="prof-bio" className={styles.label}>
                    Giới thiệu (tối đa 500 ký tự)
                  </label>
                  <textarea
                    id="prof-bio"
                    rows={3}
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                  />
                </div>

                {profileMsg.ok && (
                  <div className={styles.statusOk} role="status">
                    {profileMsg.ok}
                  </div>
                )}
                {profileMsg.err && (
                  <div className={styles.statusErr} role="alert">
                    {profileMsg.err}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button type="submit" variant="accent" disabled={mutations.updateProfile.isPending}>
                    Lưu hồ sơ
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {activeSection === 'notifications' && (
          <>
            <div className={styles.pageTitleRow}>
              <h1 className={styles.pageTitle}>Thông báo</h1>
              <SourceBadge source="LIVE" />
            </div>

            {settingsQuery.isLoading ? (
              <LoadingSkeleton height={120} />
            ) : settingsQuery.error ? (
              <ErrorBanner error={settingsQuery.error} onRetry={() => settingsQuery.refetch()} />
            ) : (
              <form className={styles.form} onSubmit={submitSettings}>
                <label className={styles.toggleRow}>
                  <span>
                    <span className={styles.toggleLabel}>Nhận thông báo từ LifeQuest</span>
                    <span className={styles.toggleSub}>
                      Nhắc nhở chuỗi Streak, nhiệm vụ đến hạn và lời mời từ bạn bè
                    </span>
                  </span>
                  <span className={styles.switchWrap}>
                    <input
                      type="checkbox"
                      className={styles.switchInput}
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                    />
                    <span className={styles.switchTrack} aria-hidden="true" />
                  </span>
                </label>

                {settingsMsg.ok && (
                  <div className={styles.statusOk} role="status">
                    {settingsMsg.ok}
                  </div>
                )}
                {settingsMsg.err && (
                  <div className={styles.statusErr} role="alert">
                    {settingsMsg.err}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={mutations.updateSettings.isPending}
                  >
                    Lưu cài đặt
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {activeSection === 'privacy' && (
          <>
            <div className={styles.pageTitleRow}>
              <h1 className={styles.pageTitle}>Cài đặt quyền riêng tư</h1>
              <SourceBadge source="LIVE" />
            </div>

            {settingsQuery.isLoading ? (
              <LoadingSkeleton height={140} />
            ) : settingsQuery.error ? (
              <ErrorBanner error={settingsQuery.error} onRetry={() => settingsQuery.refetch()} />
            ) : (
              <form className={styles.form} onSubmit={submitSettings}>
                <div className={styles.field}>
                  <label htmlFor="set-privacy" className={styles.label}>
                    Quyền riêng tư hồ sơ
                  </label>
                  <select
                    id="set-privacy"
                    className={styles.select}
                    value={privacyMode}
                    onChange={(e) => setPrivacyMode(e.target.value as PrivacyMode)}
                  >
                    <option value="PUBLIC">Công khai (PUBLIC)</option>
                    <option value="FRIENDS">Chỉ bạn bè (FRIENDS)</option>
                    <option value="PRIVATE">Riêng tư (PRIVATE)</option>
                  </select>
                </div>

                {settingsMsg.ok && (
                  <div className={styles.statusOk} role="status">
                    {settingsMsg.ok}
                  </div>
                )}
                {settingsMsg.err && (
                  <div className={styles.statusErr} role="alert">
                    {settingsMsg.err}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={mutations.updateSettings.isPending}
                  >
                    Lưu cài đặt
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {/* Right Navigation Sidebar Card (Duolingo-inspired structure, Warm Companion colors) */}
      <aside className={styles.sideColumn} aria-label="Danh mục cài đặt tài khoản">
        <div className={styles.sideCard}>
          <h2 className={styles.sideCardTitle}>Tài khoản</h2>
          <nav className={styles.sideNavList}>
            {SIDE_NAV_ITEMS.map((item) => {
              const active = activeSection === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.sideNavItem} ${active ? styles.sideNavItemActive : ''}`.trim()}
                  onClick={() => {
                    setProfileMsg({})
                    setSettingsMsg({})
                    setActiveSection(item.id)
                  }}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`settings-tab-${item.id}`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className={styles.sideCard}>
          <h2 className={styles.sideCardTitle}>Phiên đăng nhập</h2>
          {authUser && (
            <p className={styles.sessionInfo}>
              @{authUser.username} · {authUser.email}
            </p>
          )}
          <Button
            variant="ghost"
            className={styles.logoutBtn}
            onClick={handleLogout}
            data-testid="settings-logout-btn"
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </aside>
    </div>
  )
}
