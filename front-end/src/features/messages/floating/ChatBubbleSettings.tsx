import { RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useMessengerStore } from '@/stores/messengerStore'
import styles from './FloatingChat.module.css'

export interface ChatBubbleSettingsProps {
  compact?: boolean
}

export function ChatBubbleSettings({ compact = false }: ChatBubbleSettingsProps) {
  const floatingEnabled = useMessengerStore((s) => s.floatingEnabled)
  const openBubbleCount = useMessengerStore((s) => s.openBubbleIds.length)
  const dockSide = useMessengerStore((s) => s.dockSide)
  const setFloatingEnabled = useMessengerStore((s) => s.setFloatingEnabled)
  const closeAllBubbles = useMessengerStore((s) => s.closeAllBubbles)
  const resetBubblePosition = useMessengerStore((s) => s.resetBubblePosition)

  return (
    <div className={styles.settingsCard} data-testid="chat-bubble-settings">
      <div className={styles.settingsHeaderRow}>
        <div>
          <h3 className={styles.settingsTitle} style={compact ? { fontSize: 14 } : undefined}>
            Bong bóng chat
          </h3>
          <p className={styles.settingsDesc} style={compact ? { fontSize: 12 } : undefined}>
            Hiển thị cửa sổ trò chuyện nổi khi sử dụng LifeQuest.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={floatingEnabled}
          aria-label="Bật hoặc tắt Bong bóng chat"
          className={`${styles.switchBtn} ${floatingEnabled ? styles.switchBtnChecked : ''}`.trim()}
          onClick={() => setFloatingEnabled(!floatingEnabled)}
          data-testid="chat-bubble-settings-toggle"
        >
          <span className={styles.switchThumb} aria-hidden="true" />
        </button>
      </div>

      <p className={styles.settingsMetaNote} data-testid="chat-bubble-settings-status">
        {floatingEnabled
          ? `Đang bật • ${openBubbleCount} bong bóng mở • Cạnh ${dockSide === 'left' ? 'trái' : 'phải'}`
          : 'Đang tắt — Bong bóng chat sẽ không tự mở lại cho đến khi bạn bật lại.'}
      </p>

      <div className={styles.settingsActionsRow}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={closeAllBubbles}
          disabled={!floatingEnabled || openBubbleCount === 0}
          data-testid="chat-bubble-close-all-btn"
        >
          <XCircle size={14} aria-hidden="true" />
          <span>Đóng tất cả bong bóng</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetBubblePosition}
          data-testid="chat-bubble-reset-pos-btn"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Đặt lại vị trí</span>
        </Button>
      </div>
    </div>
  )
}
