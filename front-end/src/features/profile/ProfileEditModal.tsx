import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ImagePlus, RotateCcw, Sparkles, X } from 'lucide-react'
import {
  PROFILE_AVATAR_PRESETS,
  PROFILE_COVER_THEMES,
  PROFILE_TITLE_PRESETS,
  type EditableProfileData,
  type ProfileCoverThemeId,
} from '@/stores/mockProfileStore'
import styles from './ProfilePage.module.css'

export interface AchievementOption {
  readonly id: string
  readonly title: string
}

interface ProfileEditModalProps {
  open: boolean
  initialData: EditableProfileData
  achievementOptions: readonly AchievementOption[]
  onSave: (next: EditableProfileData) => void
  onReset: () => void
  onClose: () => void
}

const HANDLE_RE = /^[a-zA-Z0-9_]{3,24}$/

export function ProfileEditModal({
  open,
  initialData,
  achievementOptions,
  onSave,
  onReset,
  onClose,
}: ProfileEditModalProps) {
  const [draft, setDraft] = useState<EditableProfileData>(initialData)
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setDraft(initialData)
      setErrors({})
    }
  }, [open, initialData])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const activeCover =
    PROFILE_COVER_THEMES.find((t) => t.id === draft.coverTheme) ?? PROFILE_COVER_THEMES[0]
  const activeAvatarSrc =
    draft.customAvatarUrl ||
    PROFILE_AVATAR_PRESETS.find((p) => p.id === draft.avatarPresetId)?.src ||
    PROFILE_AVATAR_PRESETS[0].src

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({ ...prev, customAvatarUrl: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const togglePinnedAchievement = (id: string) => {
    setDraft((prev) => {
      const exists = prev.pinnedAchievementIds.includes(id)
      if (exists) {
        return {
          ...prev,
          pinnedAchievementIds: prev.pinnedAchievementIds.filter((item) => item !== id),
        }
      }
      if (prev.pinnedAchievementIds.length >= 3) {
        return {
          ...prev,
          pinnedAchievementIds: [...prev.pinnedAchievementIds.slice(1), id],
        }
      }
      return {
        ...prev,
        pinnedAchievementIds: [...prev.pinnedAchievementIds, id],
      }
    })
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: { displayName?: string; username?: string } = {}
    const trimmedName = draft.displayName.trim()
    const trimmedHandle = draft.username.trim().replace(/^@/, '')

    if (!trimmedName) {
      nextErrors.displayName = 'Vui lòng nhập tên hiển thị.'
    } else if (trimmedName.length > 40) {
      nextErrors.displayName = 'Tên hiển thị tối đa 40 ký tự.'
    }

    if (!HANDLE_RE.test(trimmedHandle)) {
      nextErrors.username = 'Handle từ 3–24 ký tự (chữ, số hoặc dấu gạch dưới _).'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSave({
      ...draft,
      displayName: trimmedName,
      username: trimmedHandle,
      title: draft.title.trim() || 'Nhà thám hiểm LifeQuest',
      bio: draft.bio.trim(),
      location: draft.location.trim(),
      focusGoal: draft.focusGoal.trim(),
    })
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-modal-title"
      data-testid="profile-edit-modal"
      onClick={onClose}
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 id="profile-edit-modal-title" className={styles.modalTitle}>
              Chỉnh sửa hồ sơ
            </h2>
            <p className={styles.modalSubtitle}>
              Thay đổi hiển thị ngay trên hồ sơ (phiên kiểm thử Mock cục bộ).
            </p>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Đóng hộp thoại chỉnh sửa hồ sơ"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {/* Live Preview Banner */}
            <div
              className={styles.previewBanner}
              style={{
                background: activeCover.background,
                borderColor: activeCover.borderColor,
              }}
            >
              <img
                src={activeAvatarSrc}
                alt="Xem trước ảnh đại diện"
                className={draft.customAvatarUrl ? styles.previewAvatarPhoto : styles.previewAvatarFox}
              />
              <div className={styles.previewMeta}>
                <strong
                  className={
                    draft.coverTheme === 'twilight' ? styles.previewNameLight : styles.previewNameDark
                  }
                >
                  {draft.displayName.trim() || 'Tên hiển thị'}
                </strong>
                <span
                  className={
                    draft.coverTheme === 'twilight'
                      ? styles.previewHandleLight
                      : styles.previewHandleDark
                  }
                >
                  @{draft.username.trim().replace(/^@/, '') || 'handle'} ·{' '}
                  {draft.title.trim() || 'Danh hiệu'}
                </span>
              </div>
            </div>

            {/* Cover Theme Selector */}
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Màu ảnh bìa</span>
              <div className={styles.coverGrid}>
                {PROFILE_COVER_THEMES.map((theme) => {
                  const selected = draft.coverTheme === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`${styles.coverOption} ${selected ? styles.coverOptionActive : ''}`.trim()}
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, coverTheme: theme.id as ProfileCoverThemeId }))
                      }
                      aria-pressed={selected}
                    >
                      <span
                        className={styles.coverSwatch}
                        style={{ background: theme.background, borderColor: theme.borderColor }}
                      />
                      <span>{theme.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Avatar Selector */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>Ảnh đại diện Fox V2 hoặc ảnh cá nhân</span>
                <button
                  type="button"
                  className={styles.uploadAvatarBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={14} aria-hidden="true" />
                  <span>Tải ảnh lên</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className={styles.avatarPresetRow}>
                {PROFILE_AVATAR_PRESETS.map((preset) => {
                  const selected = !draft.customAvatarUrl && draft.avatarPresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`${styles.avatarPresetBtn} ${selected ? styles.avatarPresetActive : ''}`.trim()}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          avatarPresetId: preset.id,
                          customAvatarUrl: null,
                        }))
                      }
                      title={preset.label}
                      aria-pressed={selected}
                    >
                      <img src={preset.src} alt={preset.label} className={styles.avatarPresetImg} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Name & Handle */}
            <div className={styles.twoColFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="profile-edit-name" className={styles.fieldLabel}>
                  Tên hiển thị *
                </label>
                <input
                  id="profile-edit-name"
                  type="text"
                  maxLength={40}
                  className={`${styles.textInput} ${errors.displayName ? styles.textInputError : ''}`.trim()}
                  value={draft.displayName}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, displayName: e.target.value }))
                    if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }))
                  }}
                />
                {errors.displayName && <span className={styles.errorText}>{errors.displayName}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="profile-edit-handle" className={styles.fieldLabel}>
                  Tên người dùng (@handle) *
                </label>
                <input
                  id="profile-edit-handle"
                  type="text"
                  maxLength={24}
                  className={`${styles.textInput} ${errors.username ? styles.textInputError : ''}`.trim()}
                  value={draft.username}
                  onChange={(e) => {
                    setDraft((prev) => ({ ...prev, username: e.target.value }))
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
                  }}
                />
                {errors.username && <span className={styles.errorText}>{errors.username}</span>}
              </div>
            </div>

            {/* Title + Presets */}
            <div className={styles.fieldGroup}>
              <label htmlFor="profile-edit-title" className={styles.fieldLabel}>
                Danh hiệu
              </label>
              <input
                id="profile-edit-title"
                type="text"
                maxLength={36}
                className={styles.textInput}
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              />
              <div className={styles.presetChipRow}>
                {PROFILE_TITLE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`${styles.presetChip} ${draft.title === preset ? styles.presetChipActive : ''}`.trim()}
                    onClick={() => setDraft((prev) => ({ ...prev, title: preset }))}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label htmlFor="profile-edit-bio" className={styles.fieldLabel}>
                  Giới thiệu ngắn
                </label>
                <span className={styles.charCount}>{draft.bio.length}/160</span>
              </div>
              <textarea
                id="profile-edit-bio"
                rows={3}
                maxLength={160}
                className={styles.textareaInput}
                value={draft.bio}
                onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Chia sẻ ngắn về hành trình và thói quen bạn đang theo đuổi..."
              />
            </div>

            {/* Location & Focus Goal */}
            <div className={styles.twoColFields}>
              <div className={styles.fieldGroup}>
                <label htmlFor="profile-edit-location" className={styles.fieldLabel}>
                  Khu vực
                </label>
                <input
                  id="profile-edit-location"
                  type="text"
                  maxLength={40}
                  className={styles.textInput}
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="VD: TP. Hồ Chí Minh"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="profile-edit-goal" className={styles.fieldLabel}>
                  Mục tiêu đang theo đuổi
                </label>
                <input
                  id="profile-edit-goal"
                  type="text"
                  maxLength={80}
                  className={styles.textInput}
                  value={draft.focusGoal}
                  onChange={(e) => setDraft((prev) => ({ ...prev, focusGoal: e.target.value }))}
                  placeholder="VD: Đạt IELTS 6.5"
                />
              </div>
            </div>

            {/* Pinned Showcase Achievements */}
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                <Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} aria-hidden="true" />
                Huy hiệu trưng bày trên hồ sơ (tối đa 3)
              </span>
              <div className={styles.presetChipRow}>
                {achievementOptions.map((ach) => {
                  const selected = draft.pinnedAchievementIds.includes(ach.id)
                  return (
                    <button
                      key={ach.id}
                      type="button"
                      className={`${styles.presetChip} ${selected ? styles.presetChipActive : ''}`.trim()}
                      onClick={() => togglePinnedAchievement(ach.id)}
                      aria-pressed={selected}
                    >
                      {selected && <Check size={12} aria-hidden="true" />}
                      <span>{ach.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Privacy Toggles */}
            <div className={styles.toggleRow}>
              <label className={styles.toggleItem}>
                <input
                  type="checkbox"
                  checked={draft.showStreakToFriends}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, showStreakToFriends: e.target.checked }))
                  }
                />
                <span>Hiển thị chuỗi ngày (Streak) với bạn bè</span>
              </label>
              <label className={styles.toggleItem}>
                <input
                  type="checkbox"
                  checked={draft.allowQuestInvites}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, allowQuestInvites: e.target.checked }))
                  }
                />
                <span>Cho phép bạn bè gửi lời mời Quest chung</span>
              </label>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                onReset()
                onClose()
              }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Khôi phục mặc định</span>
            </button>

            <div className={styles.modalFooterActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className={styles.saveBtn} data-testid="profile-save-btn">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
