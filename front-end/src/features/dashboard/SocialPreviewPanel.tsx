import { Heart, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { SourceBadge } from '@/components/ui/StateViews'
import type { SocialPreviewItem } from '@/types/domain'
import styles from './SocialPreviewPanel.module.css'

export function SocialPreviewPanel({
  items,
  note
}: {
  items: SocialPreviewItem[]
  note?: string
}) {
  return (
    <Card>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <Users size={18} color="#F26B3A" aria-hidden="true" />
          <h2 className={styles.heading}>Social và nhật ký hành trình</h2>
          <SourceBadge source="MOCK" title={note} />
        </div>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.post}>
            <div className={styles.postHead}>
              <div>
                <span className={styles.author}>{item.authorName}</span>{' '}
                <span className={styles.time}>{item.authorTag}</span>
              </div>
              <Chip tone="success">{item.questBadge}</Chip>
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

      {note && <p className={styles.note}>{note}</p>}
    </Card>
  )
}
