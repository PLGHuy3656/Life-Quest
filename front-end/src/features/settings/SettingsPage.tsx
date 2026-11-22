import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorBanner, LoadingSkeleton, SourceBadge } from '@/components/ui/StateViews'
import {
  useProfileQuery,
  useSettingsMutations,
  useUserSettingsQuery
} from '@/hooks/useSettingsData'
import { authApi } from '@/services/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { PrivacyMode } from '@/types/domain'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const profileQuery = useProfileQuery()
  const settingsQuery = useUserSettingsQuery()
  const mutations = useSettingsMutations()

  const refreshToken = useAuthStore((s) => s.refreshToken)
  const clearSession = useAuthStore((s) => s.clearSession)
  const reducedMotion = useUiStore((s) => s.reducedMotion)
  const toggleReducedMotion = useUiStore((s) => s.toggleReducedMotion)

  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ ok?: string; err?: string }>({})

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

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileMsg({})
    try {
      await mutations.updateProfile.mutateAsync({
        displayName: displayName.trim() || undefined,
        title: title.trim(),
        bio: bio.trim()
      })
      setProfileMsg({ ok: 'Đã cập nhật hồ sơ (PATCH /api/v1/users/me).' })
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
      setSettingsMsg({ ok: 'Đã lưu cài đặt (PATCH /api/v1/users/me/settings).' })
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
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className={styles.stack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h1 className={styles.heading}>Hồ sơ &amp; Cài đặt</h1>
        <SourceBadge source="LIVE" />
      </div>

      <div className={styles.grid}>
        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Thông tin cá nhân</h2>
          {profileQuery.isLoading ? (
            <LoadingSkeleton height={180} />
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

              <div>
                <Button type="submit" variant="primary" disabled={mutations.updateProfile.isPending}>
                  Lưu hồ sơ
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Tùy chọn tài khoản</h2>
          {settingsQuery.isLoading ? (
            <LoadingSkeleton height={180} />
          ) : settingsQuery.error ? (
            <ErrorBanner error={settingsQuery.error} onRetry={() => settingsQuery.refetch()} />
          ) : (
            <form className={styles.form} onSubmit={submitSettings}>
              <div className={styles.field}>
                <label htmlFor="set-tz" className={styles.label}>
                  Múi giờ (timezone)
                </label>
                <input
                  id="set-tz"
                  className={styles.input}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="set-lang" className={styles.label}>
                  Ngôn ngữ
                </label>
                <select
                  id="set-lang"
                  className={styles.select}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="vi">Tiếng Việt (vi)</option>
                  <option value="en">English (en)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="set-privacy" className={styles.label}>
                  Quyền riêng tư (privacyMode)
                </label>
                <select
                  id="set-privacy"
                  className={styles.select}
                  value={privacyMode}
                  onChange={(e) => setPrivacyMode(e.target.value as PrivacyMode)}
                >
                  <option value="PUBLIC">PUBLIC — Công khai</option>
                  <option value="FRIENDS">FRIENDS — Bạn bè</option>
                  <option value="PRIVATE">PRIVATE — Riêng tư</option>
                </select>
              </div>

              <label className={styles.checkRow}>
                <span className={styles.label}>Nhận thông báo (notificationEnabled)</span>
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(e) => setNotificationEnabled(e.target.checked)}
                />
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

              <div>
                <Button type="submit" variant="accent" disabled={mutations.updateSettings.isPending}>
                  Lưu cài đặt
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Trợ năng &amp; Phiên đăng nhập</h2>
            <p style={{ fontSize: 13, color: 'var(--lq-ink-secondary)', marginTop: 4 }}>
              Token được lưu trong bộ nhớ trình duyệt (RAM); đăng xuất sẽ thu hồi session trên
              Backend.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" onClick={toggleReducedMotion}>
              {reducedMotion ? 'Tắt giảm chuyển động' : 'Bật giảm chuyển động'}
            </Button>
            <Button variant="primary" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
