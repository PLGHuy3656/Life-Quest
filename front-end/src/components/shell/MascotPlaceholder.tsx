import { Chip } from '@/components/ui/Chip'
import styles from './MascotPlaceholder.module.css'

export function MascotPlaceholder() {
  return (
    <div className={styles.stage} data-testid="mascot-slot-placeholder">
      <div className={styles.avatar} aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M10 14L17 24L10 29L10 14Z" fill="#FFF8EE" />
          <path d="M38 14L31 24L38 29L38 14Z" fill="#FFF8EE" />
          <circle cx="24" cy="26" r="13" fill="#FFF8EE" />
          <circle cx="19.5" cy="24.5" r="2" fill="#16324A" />
          <circle cx="28.5" cy="24.5" r="2" fill="#16324A" />
          <path d="M22 29.5L24 31.5L26 29.5" stroke="#16324A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <Chip tone="accent">Fox V2 Slot • FE-03</Chip>
      <div className={styles.caption}>Bạn đồng hành Cáo V2</div>
      <p className={styles.sub}>
        Khung chờ 3D WebGL giữ nguyên tỉ lệ Claude Canvas (không tải WebGL trong FE-01).
      </p>
    </div>
  )
}
