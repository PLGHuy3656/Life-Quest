import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { useCreateQuestMutation } from '@/hooks/useDashboardData'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { useAuthStore } from '@/stores/authStore'
import styles from './VoiceAssistantSheet.module.css'

export interface VoiceAssistantSheetProps {
  open: boolean
  onClose: () => void
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Sẵn sàng',
  listening: 'Đang lắng nghe (voice_listening_loop)',
  processing: 'Đang suy nghĩ (voice_processing)',
  suggesting: 'Đề xuất nhiệm vụ (task_suggestion)',
  notebook_open: 'Mở sổ tay (task_notebook_open)',
  writing: 'Đang ghi chú (task_notebook_write)',
  confirmed: 'Đã xác nhận (task_notebook_confirm)',
  retry: 'Thử lại (voice_retry)',
  cancelled: 'Đã hủy',
  permission_denied: 'Từ chối quyền micro'
}

export function VoiceAssistantSheet({ open, onClose }: VoiceAssistantSheetProps) {
  const companion = useCompanion()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken.trim()))
  const createQuest = useCreateQuestMutation()

  const [draftTitle, setDraftTitle] = useState('')
  const [feedback, setFeedback] = useState<{ ok?: string; err?: string }>({})

  const handleRequestMicCheck = async () => {
    setFeedback({})
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      companion.dispatchVoiceEvent('VOICE_PERMISSION_DENIED')
      setFeedback({
        err: 'Trình duyệt không hỗ trợ ghi âm hoặc dịch vụ ASR chưa khả dụng.'
      })
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      companion.dispatchVoiceEvent('VOICE_LISTEN_STARTED')
      setFeedback({
        ok: 'Đã cấp quyền micro. Lưu ý: Backend chưa có dịch vụ nhận dạng giọng nói (ASR) — hãy nhập nội dung nhiệm vụ bên dưới để thử luồng Gate I.'
      })
    } catch {
      companion.dispatchVoiceEvent('VOICE_PERMISSION_DENIED')
      setFeedback({ err: 'Quyền truy cập micro bị từ chối (VOICE_PERMISSION_DENIED).' })
    }
  }

  const handleConfirmRealTask = async (e: FormEvent) => {
    e.preventDefault()
    setFeedback({})
    const title = draftTitle.trim()
    if (title.length < 3) {
      companion.dispatchVoiceEvent('VOICE_RETRY_REQUESTED')
      setFeedback({ err: 'Tên nhiệm vụ cần ít nhất 3 ký tự trước khi xác nhận.' })
      return
    }

    // Strict Gate I contract: TASK_CREATED / task_notebook_confirm ONLY fires after real Backend success.
    companion.dispatchVoiceEvent('TASK_WRITING')
    try {
      await createQuest.mutateAsync({ title, type: 'SIMPLE' })
      companion.dispatchVoiceEvent('TASK_CREATED', { title })
      setDraftTitle('')
      setFeedback({
        ok: 'Đã lưu nhiệm vụ thật qua POST /api/v1/quests và phát sự kiện TASK_CREATED!'
      })
    } catch (err) {
      companion.dispatchVoiceEvent('VOICE_RETRY_REQUESTED')
      setFeedback({
        err:
          err instanceof Error
            ? err.message
            : 'Không thể lưu nhiệm vụ lên Backend (không phát TASK_CREATED).'
      })
    }
  }

  return (
    <Sheet
      open={open}
      title="Trợ lý Giọng nói Fox V2 (Gate I)"
      subtitle="Trình diễn trạng thái hoạt ảnh Gate I • Xác nhận TASK_CREATED gắn chặt Backend thật"
      onClose={() => {
        companion.dispatchVoiceEvent('VOICE_CANCELLED')
        onClose()
      }}
    >
      <div className={styles.stack}>
        <div className={styles.banner}>
          <strong>DEMO / ASR UNAVAILABLE:</strong> Backend chưa tích hợp dịch vụ nhận dạng giọng nói
          (ASR/AI). Giao diện này trình diễn chuỗi sự kiện Gate I (<code>FOX_I_VOICE_EVENT_CONTRACT</code>)
          mà không giả lập kết quả ASR hay giả lập lưu nhiệm vụ.
        </div>

        <div className={styles.phaseBar}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Trạng thái Fox V2:</span>
          <Chip tone="accent" className="lq-voice-phase">
            {PHASE_LABELS[companion.voicePhase] ?? companion.voicePhase}
          </Chip>
        </div>

        <div className={styles.controls} aria-label="Điều khiển trình diễn trạng thái Gate I">
          <Button variant="primary" size="sm" onClick={handleRequestMicCheck}>
            Xin quyền Micro
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('VOICE_LISTENING')}
          >
            Lắng nghe
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('VOICE_PROCESSING')}
          >
            Suy nghĩ
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('TASK_SUGGESTION_READY')}
          >
            Đề xuất
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('TASK_NOTEBOOK_OPEN')}
          >
            Mở sổ tay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('VOICE_RETRY_REQUESTED')}
          >
            Thử lại
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => companion.dispatchVoiceEvent('VOICE_CANCELLED')}
          >
            Hủy
          </Button>
        </div>

        <form className={styles.stack} onSubmit={handleConfirmRealTask}>
          <div className={styles.field}>
            <label htmlFor="voice-task-title" className={styles.label}>
              Xác nhận tạo nhiệm vụ thật (kích hoạt TASK_CREATED)
            </label>
            <input
              id="voice-task-title"
              className={styles.input}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Nhập tên nhiệm vụ (tối thiểu 3 ký tự)..."
              maxLength={100}
            />
          </div>

          {!isAuthenticated && (
            <p style={{ fontSize: 12, color: 'var(--lq-ink-secondary)' }}>
              Chưa đăng nhập Backend: nhấn xác nhận sẽ trả về <code>AUTHENTICATION_REQUIRED</code>{' '}
              và phát <code>VOICE_RETRY_REQUESTED</code> (tuyệt đối không phát{' '}
              <code>TASK_CREATED</code> giả).
            </p>
          )}

          {feedback.err && (
            <div className={styles.errorBox} role="alert">
              {feedback.err}
            </div>
          )}
          {feedback.ok && (
            <div className={styles.successBox} role="status">
              {feedback.ok}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="submit" variant="accent" disabled={createQuest.isPending}>
              {createQuest.isPending ? 'Đang gửi...' : 'Xác nhận & Lưu (LIVE)'}
            </Button>
          </div>
        </form>
      </div>
    </Sheet>
  )
}
