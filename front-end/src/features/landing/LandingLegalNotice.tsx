import { useEffect } from 'react'
import styles from './LandingPage.module.css'

export type LegalTopic = 'privacy' | 'terms' | null

interface LandingLegalNoticeProps {
  topic: LegalTopic
  onClose: () => void
}

export function LandingLegalNotice({ topic, onClose }: LandingLegalNoticeProps) {
  useEffect(() => {
    if (!topic) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [topic, onClose])

  if (!topic) return null

  const isPrivacy = topic === 'privacy'

  return (
    <div
      className={styles.legalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="landing-legal-title"
      onClick={onClose}
    >
      <div className={styles.legalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.legalHeader}>
          <h3 id="landing-legal-title" className={styles.legalTitle}>
            {isPrivacy ? 'Quyền riêng tư · LifeQuest' : 'Điều khoản sử dụng · LifeQuest'}
          </h3>
          <button
            type="button"
            className={styles.legalCloseBtn}
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            ✕
          </button>
        </div>
        <p className={styles.legalBody}>
          {isPrivacy
            ? 'LifeQuest được thiết kế theo hướng riêng tư: nhiệm vụ, thói quen, mục tiêu và các khoảnh khắc bạn chia sẻ chỉ hiển thị trong vòng tròn bạn bè bạn chấp nhận — không có bảng tin công khai.'
            : 'Bằng việc tạo tài khoản và sử dụng LifeQuest, bạn đồng ý sử dụng không gian hành trình một cách lành mạnh, tôn trọng bạn bè và tuân thủ các nguyên tắc cộng đồng của sản phẩm.'}
        </p>
        <p className={styles.legalNote}>
          Tài liệu pháp lý đầy đủ sẽ được cập nhật chính thức khi phát hành bản chính thức.
        </p>
        <button type="button" className={styles.legalActionBtn} onClick={onClose}>
          Đã hiểu
        </button>
      </div>
    </div>
  )
}
