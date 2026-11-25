import { Brain, Clock, Flag, Heart, Repeat, Sparkles, Users } from 'lucide-react'
import { SOCIAL_MOCK_ASSETS } from '@/assets/social'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import type { SocialPreviewItem } from '@/types/domain'
import styles from './SocialPreviewPanel.module.css'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'LQ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getCategoryIcon(category?: SocialPreviewItem['category']) {
  switch (category) {
    case 'focus':
      return Brain
    case 'milestone':
      return Flag
    case 'habit':
      return Repeat
    default:
      return Sparkles
  }
}

export function SocialPreviewPanel({
  items,
  note
}: {
  items: SocialPreviewItem[]
  note?: string
}) {
  return (
    <Card compact data-testid="social-preview-card">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Users size={16} />
          </span>
          <h2 className={styles.heading}>Social và nhật ký hành trình</h2>
        </div>
        <Chip tone="reward">
          <Sparkles size={12} aria-hidden="true" />
          <span title={note}>Xem trước • Minh họa</span>
        </Chip>
      </div>

      <div className={styles.list}>
        {items.map((item, idx) => {
          const fallbackKey = idx % 2 === 0 ? 'study-corner' : 'milestone-moment'
          const asset = SOCIAL_MOCK_ASSETS[item.illustrationKey ?? fallbackKey]
          const CategoryIcon = getCategoryIcon(item.category)

          return (
            <article key={item.id} className={styles.post} data-testid="social-preview-item">
              <div className={styles.mediaWrap}>
                <img
                  src={asset.src}
                  alt={item.illustrationAlt ?? asset.defaultAlt}
                  className={styles.mediaImg}
                />
                <span
                  className={`${styles.mediaBadge} ${idx % 2 === 0 ? styles.badgeSuccess : styles.badgeAccent}`}
                >
                  <CategoryIcon size={12} strokeWidth={2.25} aria-hidden="true" />
                  <span>{item.questBadge}</span>
                </span>
              </div>

              <div className={styles.postBody}>
                <div className={styles.postHead}>
                  <div className={styles.authorRow}>
                    <span
                      className={`${styles.avatar} ${idx % 2 === 0 ? styles.avatarTeal : styles.avatarCoral}`}
                      aria-hidden="true"
                    >
                      {getInitials(item.authorName)}
                    </span>
                    <div className={styles.authorMeta}>
                      <div className={styles.author}>{item.authorName}</div>
                      <div className={styles.time}>{item.authorTag}</div>
                    </div>
                  </div>
                </div>

                <p className={styles.caption}>{item.caption}</p>

                <div className={styles.postFooter}>
                  <span className={styles.metaItem}>
                    <Clock size={12} aria-hidden="true" />
                    <span>{item.timeLabel}</span>
                  </span>
                  <span className={styles.cheerPill}>
                    <Heart size={12} aria-hidden="true" />
                    <span>{item.cheerCount} cổ vũ</span>
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p className={styles.note}>
        Ảnh minh họa mẫu cho chế độ xem trước — hoạt động cộng đồng thực sẽ đồng bộ khi mở khóa tính năng Social.
      </p>
    </Card>
  )
}
