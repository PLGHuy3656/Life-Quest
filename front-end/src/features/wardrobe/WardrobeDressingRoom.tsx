import { useCallback, useEffect, useState } from 'react'
import { Eye, FlipHorizontal2, RotateCcw, Shirt, Sparkles, Store, ZoomIn, ZoomOut } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import type { FoxCameraCommand } from '@/features/mascot/FoxCanvas'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import { FoxSpeechBubble } from '@/features/mascot/FoxSpeechBubble'
import { foxDialogueBus } from '@/features/mascot/dialogue/dialogueBus'
import type { ActiveDialogueBubble } from '@/features/mascot/dialogue/types'
import styles from './WardrobeDressingRoom.module.css'

export interface WardrobeDressingRoomProps {
  mode: 'wardrobe' | 'shop'
  onSwitchMode: (mode: 'wardrobe' | 'shop') => void
}

export function WardrobeDressingRoom({ mode, onSwitchMode }: WardrobeDressingRoomProps) {
  const companion = useCompanion()
  const [cameraCommand, setCameraCommand] = useState<FoxCameraCommand | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'front' | 'side' | 'back'>('front')
  const [activeDialogue, setActiveDialogue] = useState<ActiveDialogueBubble | null>(() =>
    foxDialogueBus.getActive()
  )

  useEffect(() => {
    return foxDialogueBus.subscribe((bubble) => {
      setActiveDialogue(bubble)
    })
  }, [])

  const sendCamera = useCallback((type: FoxCameraCommand['type']) => {
    if (type === 'front' || type === 'reset') setCameraFacing('front')
    if (type === 'side') setCameraFacing('side')
    if (type === 'back') setCameraFacing('back')
    setCameraCommand((prev) => ({ type, seq: (prev?.seq ?? 0) + 1 }))
  }, [])

  const dismissDialogue = useCallback(() => {
    foxDialogueBus.dismiss()
  }, [])

  const previewSlots = Object.keys(companion.previewCosmetics)
  const previewCount = previewSlots.length
  const persistedCount = Object.keys(companion.persistedCosmetics).length

  return (
    <section
      className={styles.stageCard}
      aria-label="Phòng thử đồ Fox V2 3D"
      data-testid="wardrobe-dressing-room"
      data-persisted-count={persistedCount}
      data-preview-slots={previewSlots.join(',')}
    >
      <div className={styles.stageHeader}>
        <div className={styles.stageTitleWrap}>
          <span className={styles.stageBadge}>
            <Sparkles size={13} aria-hidden="true" />
            <span>Phòng thử đồ 3D</span>
          </span>
          {companion.hasUnsavedPreview ? (
            <Chip tone="reward">Đang xem trước ({previewCount})</Chip>
          ) : (
            <Chip tone="success">Mặc định Fox V2</Chip>
          )}
        </div>

        <nav className={styles.modeSwitch} aria-label="Chuyển đổi Tủ đồ và Cửa hàng">
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'wardrobe' ? styles.modeBtnActive : ''}`.trim()}
            aria-current={mode === 'wardrobe' ? 'page' : undefined}
            onClick={() => onSwitchMode('wardrobe')}
            data-testid="wardrobe-tab-btn"
          >
            <Shirt size={14} aria-hidden="true" />
            <span>Tủ đồ</span>
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === 'shop' ? styles.modeBtnActive : ''}`.trim()}
            aria-current={mode === 'shop' ? 'page' : undefined}
            onClick={() => onSwitchMode('shop')}
            data-testid="shop-tab-btn"
          >
            <Store size={14} aria-hidden="true" />
            <span>Cửa hàng</span>
          </button>
        </nav>
      </div>

      <div className={styles.canvasStage}>
        <div className={styles.stageBackdropGlow} aria-hidden="true" />
        <div className={styles.stagePedestal} aria-hidden="true" />

        <div className={styles.bubbleAnchor}>
          <FoxSpeechBubble
            dialogue={activeDialogue}
            visible
            onDismiss={dismissDialogue}
          />
        </div>

        <FoxCompanionView
          presentation="full"
          label="Xem trước tủ đồ Fox V2 3D"
          orbit
          cameraCommand={cameraCommand}
          className={styles.foxCanvasFrame}
        />

        <div
          className={styles.cameraToolbar}
          role="toolbar"
          aria-label="Điều khiển góc nhìn 3D"
        >
          <button
            type="button"
            className={`${styles.camBtn} ${cameraFacing === 'front' ? styles.camBtnActive : ''}`.trim()}
            onClick={() => sendCamera('front')}
            aria-label="Góc nhìn mặt trước"
            title="Mặt trước"
          >
            <Eye size={14} aria-hidden="true" />
            <span>Trước</span>
          </button>
          <button
            type="button"
            className={`${styles.camBtn} ${cameraFacing === 'side' ? styles.camBtnActive : ''}`.trim()}
            onClick={() => sendCamera('side')}
            aria-label="Góc nhìn mặt ngang"
            title="Mặt ngang"
          >
            <span>Ngang</span>
          </button>
          <button
            type="button"
            className={`${styles.camBtn} ${cameraFacing === 'back' ? styles.camBtnActive : ''}`.trim()}
            onClick={() => sendCamera('back')}
            aria-label="Góc nhìn mặt sau"
            title="Mặt sau (kiểm tra balo)"
          >
            <FlipHorizontal2 size={14} aria-hidden="true" />
            <span>Sau</span>
          </button>
          <button
            type="button"
            className={styles.camIconBtn}
            onClick={() => sendCamera('zoomIn')}
            aria-label="Phóng to Fox"
            title="Phóng to"
          >
            <ZoomIn size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.camIconBtn}
            onClick={() => sendCamera('zoomOut')}
            aria-label="Thu nhỏ Fox"
            title="Thu nhỏ"
          >
            <ZoomOut size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.camIconBtn}
            onClick={() => sendCamera('reset')}
            aria-label="Đặt lại góc nhìn"
            title="Đặt lại góc nhìn"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
