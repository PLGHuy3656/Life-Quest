import { Heart, Users } from 'lucide-react'
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
          <Users size={18} color="#F26B3A" aria-hidden="true" />
          <h2 className={styles.heading}>Social và nhật ký hành trình</h2>
        </div>
        <Chip tone="reward">
          <span title={note}>Xem trước</span>
        </Chip>
      </div>

      <div className={styles.list}>
        {items.map((item, idx) => (
          <article key={item.id} className={styles.post}>
            <div className={styles.postHead}>
              <div className={styles.authorRow}>
                <span
                  className={`${styles.avatar} ${idx % 2 === 0 ? styles.avatarTeal : styles.avatarCoral}`}
                  aria-hidden="true"
                >
                  {getInitials(item.authorName)}
                </span>
                <div>
                  <div className={styles.author}>{item.authorName}</div>
                  <div className={styles.time}>{item.authorTag}</div>
                </div>
              </div>
              <Chip tone={idx % 2 === 0 ? 'success' : 'accent'}>{item.questBadge}</Chip>
            </div>
            <p className={styles.caption}>{item.caption}</p>
            <div className={styles.postHead}>
              <span className={styles.time}>{item.timeLabel}</span>
              <span className={styles.time}>
                <Heart size={12} style={{ display: 'inline', verticalAlign: '-2px', color: '#F26B3A' }} />{' '}
                {item.cheerCount} cổ vũ
              </span>
            </div>
          </article>
        ))}
      </div>

      <p className={styles.note}>
        Bảng tin cộng đồng đang ở chế độ xem trước và sẽ đồng bộ trực tiếp khi mở khóa tính năng Social.
      </p>
    </Card>
  )
}
