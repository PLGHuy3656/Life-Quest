import { useEffect, useState, type FormEvent } from 'react'
import { AtSign, Award, RotateCcw, Shield, Sparkles, User, X } from 'lucide-react'
import {
  DecorativeLabel,
  type ClothColor,
} from '@/features/journal/JournalPrimitives'
import {
  PROFILE_AVATAR_PRESETS,
  PROFILE_TITLE_PRESETS,
  type EditableProfileData,
  type ProfileCoverThemeId,
} from '@/stores/mockProfileStore'
import styles from './AdventureProfile.module.css'

export interface ProfileEditDrawerProps {
  open: boolean
  initialData: EditableProfileData
  achievementOptions: Array<{ id: string; title: string }>
  isLiveBackend: boolean
  onSave: (next: EditableProfileData, clothColor: ClothColor) => void
  onReset: () => void
  onClose: () => void
}

const CLOTH_OPTIONS: Array<{ id: ClothColor; label: string; hex: string; legacyTheme: ProfileCoverThemeId }> = [
  { id: 'navy', label: 'Xanh Navy', hex: '#1C3A54', legacyTheme: 'twilight' },
  { id: 'teal', label: 'Xanh Rừng', hex: '#14594F', legacyTheme: 'forest' },
  { id: 'plum', label: 'Tím Mận', hex: '#4A3A5C', legacyTheme: 'twilight' },
  { id: 'sand', label: 'Cát Ấm', hex: '#8C7B66', legacyTheme: 'meadow' },
  { id: 'rust', label: 'Đất Nung', hex: '#8E4A30', legacyTheme: 'sunrise' },
]

export function ProfileEditDrawer({
  open,
  initialData,
  achievementOptions,
  isLiveBackend,
  onSave,
  onReset,
  onClose,
}: ProfileEditDrawerProps) {
  const [displayName, setDisplayName] = useState(initialData.displayName)
  const [username, setUsername] = useState(initialData.username)
  const [title, setTitle] = useState(initialData.title)
  const [bio, setBio] = useState(initialData.bio)
  const [avatarPresetId, setAvatarPresetId] = useState(initialData.avatarPresetId)
  const [clothColor, setClothColor] = useState<ClothColor>('navy')
  const [pinnedIds, setPinnedIds] = useState<string[]>(initialData.pinnedAchievementIds)
  const [showStreak, setShowStreak] = useState(initialData.showStreakToFriends)
  const [allowInvites, setAllowInvites] = useState(initialData.allowQuestInvites)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingCover, setEditingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDisplayName(initialData.displayName)
    setUsername(initialData.username)
    setTitle(initialData.title)
    setBio(initialData.bio)
    setAvatarPresetId(initialData.avatarPresetId)
    setPinnedIds(initialData.pinnedAchievementIds)
    setShowStreak(initialData.showStreakToFriends)
    setAllowInvites(initialData.allowQuestInvites)
    setEditingAvatar(false)
    setEditingCover(false)
    setError(null)
  }, [open, initialData])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const cleanName = displayName.trim()
    const cleanHandle = username.trim().replace(/^@+/, '')
    if (cleanName.length < 2) {
      setError('Tên hiển thị cần ít nhất 2 ký tự.')
      return
    }
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(cleanHandle)) {
      setError('Tên người dùng chỉ gồm chữ, số, dấu chấm hoặc gạch dưới (3–30 ký tự).')
      return
    }
    const chosenCloth = CLOTH_OPTIONS.find((c) => c.id === clothColor) ?? CLOTH_OPTIONS[0]
    onSave(
      {
        ...initialData,
        displayName: cleanName,
        username: cleanHandle,
        title: title.trim() || PROFILE_TITLE_PRESETS[0],
        bio: bio.trim().slice(0, 160),
        avatarPresetId,
        coverTheme: chosenCloth.legacyTheme,
        pinnedAchievementIds: pinnedIds.slice(0, 3),
        showStreakToFriends: showStreak,
        allowQuestInvites: allowInvites,
      },
      clothColor,
    )
  }

  const activeAvatar =
    PROFILE_AVATAR_PRESETS.find((p) => p.id === avatarPresetId) ?? PROFILE_AVATAR_PRESETS[0]
  const activeCloth = CLOTH_OPTIONS.find((c) => c.id === clothColor) ?? CLOTH_OPTIONS[0]

  return (
    <div
      className={styles.fbModalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-drawer-title"
      data-testid="profile-edit-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form className={styles.fbModalCard} onSubmit={handleSubmit}>
        {/* Facebook-style Centered Modal Header */}
        <div className={styles.fbModalHead}>
          <span className={styles.fbModalHeadSpacer} aria-hidden="true" />
          <h2 id="profile-edit-drawer-title" className={styles.fbModalTitle}>
            Chỉnh sửa trang cá nhân
          </h2>
          <button
            type="button"
            className={styles.fbCloseBtn}
            onClick={onClose}
            aria-label="Đóng chỉnh sửa hồ sơ"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.fbModalBody}>
          {error && (
            <div role="alert" className={styles.fbErrorBanner}>
              {error}
            </div>
          )}

          {/* Section 1: Profile Picture */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <h3>Ảnh đại diện</h3>
              <button
                type="button"
                className={styles.fbActionLink}
                onClick={() => setEditingAvatar((v) => !v)}
              >
                {editingAvatar ? 'Xong' : 'Chỉnh sửa'}
              </button>
            </div>
            <div className={styles.fbAvatarCenter}>
              <div className={styles.fbAvatarRing}>
                <img src={activeAvatar.src} alt={activeAvatar.label} />
              </div>
              {editingAvatar && (
                <div className={styles.fbAvatarPickerRow}>
                  {PROFILE_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarPresetId(preset.id)}
                      aria-label={preset.label}
                      aria-pressed={avatarPresetId === preset.id}
                      className={`${styles.fbAvatarThumb} ${
                        avatarPresetId === preset.id ? styles.fbAvatarThumbActive : ''
                      }`.trim()}
                    >
                      <img src={preset.src} alt={preset.label} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Cover Photo / Journal Cloth */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <h3>Ảnh bìa</h3>
              <button
                type="button"
                className={styles.fbActionLink}
                onClick={() => setEditingCover((v) => !v)}
              >
                {editingCover ? 'Xong' : 'Chỉnh sửa'}
              </button>
            </div>
            <div
              className={styles.fbCoverPreview}
              style={{ background: activeCloth.hex }}
            >
              <span className={styles.fbCoverStitched} aria-hidden="true" />
              <span className={styles.fbCoverRibbon} aria-hidden="true" />
              <span className={styles.fbCoverLabel}>
                NHẬT KÝ PHIÊU LƯU · {displayName.trim().toUpperCase() || 'LIFEQUEST'} · 2026
              </span>
            </div>
            {editingCover && (
              <div className={styles.fbSwatchCenterRow}>
                {CLOTH_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`Chọn màu bìa ${c.label}`}
                    aria-pressed={clothColor === c.id}
                    className={`${styles.fbColorChip} ${
                      clothColor === c.id ? styles.fbColorChipActive : ''
                    }`.trim()}
                    onClick={() => setClothColor(c.id)}
                  >
                    <span className={styles.fbColorDot} style={{ background: c.hex }} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: Bio */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <label htmlFor="edit-bio" className={styles.fbSectionTitleLabel}>
                Tiểu sử
                <span className={styles.srOnly}>Giới thiệu ngắn</span>
              </label>
              <span className={styles.fbCharCount}>{bio.length}/160</span>
            </div>
            <textarea
              id="edit-bio"
              aria-label="Giới thiệu ngắn"
              className={styles.fbBioInput}
              placeholder="Mô tả ngắn về hành trình của bạn..."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              maxLength={160}
              rows={3}
            />
          </section>

          {/* Section 4: Details (Name, @handle, Title) */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <h3>Chi tiết</h3>
              {isLiveBackend && <span className={styles.fbSyncNote}>Đồng bộ tài khoản</span>}
            </div>
            <div className={styles.fbDetailsList}>
              <div className={styles.fbDetailRow}>
                <User size={16} className={styles.fbDetailIcon} aria-hidden="true" />
                <label htmlFor="edit-display-name" className={styles.fbDetailLabel}>
                  Tên hiển thị
                </label>
                <input
                  id="edit-display-name"
                  className={styles.fbInlineInput}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>

              <div className={styles.fbDetailRow}>
                <AtSign size={16} className={styles.fbDetailIcon} aria-hidden="true" />
                <label htmlFor="edit-username" className={styles.fbDetailLabel}>
                  Tên người dùng
                </label>
                <input
                  id="edit-username"
                  className={styles.fbInlineInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>

              <div className={styles.fbDetailRow}>
                <Sparkles size={16} className={styles.fbDetailIcon} aria-hidden="true" />
                <label htmlFor="edit-title" className={styles.fbDetailLabel}>
                  Danh hiệu
                </label>
                <div className={styles.fbTitleSelectWrap}>
                  <select
                    id="edit-title"
                    className={styles.fbInlineSelect}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  >
                    {PROFILE_TITLE_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                  <DecorativeLabel />
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Featured Badges (max 3) */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} aria-hidden="true" /> Đáng chú ý · Huy hiệu ghim
              </h3>
              <span className={styles.fbCharCount}>{pinnedIds.length}/3</span>
            </div>
            <div className={styles.fbBadgeGrid}>
              {achievementOptions.map((ach) => {
                const active = pinnedIds.includes(ach.id)
                return (
                  <button
                    key={ach.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => togglePin(ach.id)}
                    className={`${styles.fbBadgeChip} ${active ? styles.fbBadgeChipActive : ''}`.trim()}
                  >
                    {active ? '★ ' : ''}
                    {ach.title}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 6: Privacy Switches */}
          <section className={styles.fbSection}>
            <div className={styles.fbSectionHead}>
              <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} aria-hidden="true" /> Quyền riêng tư
              </h3>
            </div>
            <div className={styles.fbPrivacyList}>
              <label className={styles.fbPrivacyRow}>
                <span>Hiển thị chuỗi ngày (Streak) cho bạn bè</span>
                <input
                  type="checkbox"
                  className={styles.fbSwitchInput}
                  checked={showStreak}
                  onChange={(e) => setShowStreak(e.target.checked)}
                />
              </label>
              <label className={styles.fbPrivacyRow}>
                <span>Cho phép bạn bè gửi lời mời thử thách Quest</span>
                <input
                  type="checkbox"
                  className={styles.fbSwitchInput}
                  checked={allowInvites}
                  onChange={(e) => setAllowInvites(e.target.checked)}
                />
              </label>
            </div>
          </section>
        </div>

        {/* Sticky Facebook-style Footer */}
        <div className={styles.fbModalFoot}>
          <button type="button" className={styles.fbResetBtn} onClick={onReset}>
            <RotateCcw size={14} aria-hidden="true" /> Đặt lại mặc định
          </button>
          <div className={styles.fbFootActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className={styles.btnPrimary} data-testid="profile-save-btn">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
