import { Mic } from 'lucide-react'
import { useState } from 'react'
import { VoiceAssistantSheet } from '@/features/voice/VoiceAssistantSheet'
import { useOptionalCompanion } from './CompanionProvider'
import styles from './FloatingMascotDock.module.css'

export function FloatingMascotDock() {
  const [open, setOpen] = useState(false)
  const companion = useOptionalCompanion()

  return (
    <>
      <div className={styles.dock} data-testid="floating-mascot-dock">
        <button
          type="button"
          className={styles.dockBtn}
          onClick={() => setOpen(true)}
          aria-label="Mở Trợ lý Giọng nói Fox V2"
        >
          <Mic size={16} aria-hidden="true" />
          <span>Trợ lý Fox{companion && companion.voicePhase !== 'idle' ? ` • ${companion.voicePhase}` : ''}</span>
        </button>
      </div>

      {open && <VoiceAssistantSheet open={open} onClose={() => setOpen(false)} />}
    </>
  )
}
