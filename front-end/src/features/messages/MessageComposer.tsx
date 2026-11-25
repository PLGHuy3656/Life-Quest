import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { ImagePlus, Send, Smile, X } from 'lucide-react'
import { QUICK_EMOJIS } from './messengerFixtures'
import type { LocalAttachmentDraft } from './messengerTypes'
import styles from './MessagesPage.module.css'

export interface MessageComposerProps {
  conversationTitle: string
  draft: string
  attachments: LocalAttachmentDraft[]
  disabled?: boolean
  onDraftChange: (next: string) => void
  onAddFiles: (files: FileList) => void
  onRemoveAttachment: (id: string) => void
  onSend: () => void
}

export function MessageComposer({
  conversationTitle,
  draft,
  attachments,
  disabled = false,
  onDraftChange,
  onAddFiles,
  onRemoveAttachment,
  onSend
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false)
  const isComposingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend = !disabled && (draft.trim().length > 0 || attachments.length > 0)

  // Close emoji popover on Escape
  useEffect(() => {
    if (!emojiOpen) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmojiOpen(false)
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [emojiOpen])

  // Auto-resize textarea cleanly up to 112px
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`
  }, [draft])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    if (e.shiftKey) return
    // Never intercept Enter during Vietnamese IME composition (Telex/VNI/etc.)
    if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return
    }
    e.preventDefault()
    if (canSend) {
      onSend()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleInsertEmoji = (emoji: string) => {
    onDraftChange(`${draft}${emoji}`)
    setEmojiOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <div className={styles.composerWrap} data-testid="messenger-composer">
      {/* Local Attachment Preview Strip */}
      {attachments.length > 0 && (
        <div
          className={styles.attachmentStrip}
          aria-label="Ảnh đính kèm cục bộ"
          data-testid="messenger-attachment-strip"
        >
          {attachments.map((att) => (
            <div key={att.id} className={styles.attachmentThumb} data-testid="messenger-attachment-item">
              <img src={att.objectUrl} alt={att.fileName} className={styles.attachmentImg} />
              <button
                type="button"
                className={styles.attachmentRemoveBtn}
                onClick={() => onRemoveAttachment(att.id)}
                aria-label={`Xóa ảnh ${att.fileName}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
              <span className={styles.attachmentMeta}>{att.sizeLabel}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Popover */}
      {emojiOpen && (
        <div
          className={styles.emojiPopover}
          role="dialog"
          aria-label="Chọn biểu tượng cảm xúc"
          data-testid="messenger-emoji-popover"
        >
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className={styles.emojiBtn}
              onClick={() => handleInsertEmoji(em)}
              aria-label={`Chèn biểu tượng ${em}`}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <div className={styles.composerRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenFileInput}
          onChange={handleFileChange}
          data-testid="messenger-file-input"
          aria-label="Chọn ảnh đính kèm cục bộ"
        />

        <button
          type="button"
          className={styles.composerToolBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label="Đính kèm ảnh (xem trước cục bộ)"
          title="Đính kèm ảnh cục bộ (Chờ Media Upload API)"
          data-testid="messenger-attach-btn"
        >
          <ImagePlus size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`${styles.composerToolBtn} ${emojiOpen ? styles.composerToolBtnActive : ''}`.trim()}
          onClick={() => setEmojiOpen((prev) => !prev)}
          disabled={disabled}
          aria-label="Chèn biểu tượng cảm xúc"
          aria-expanded={emojiOpen}
          title="Biểu tượng cảm xúc"
          data-testid="messenger-emoji-btn"
        >
          <Smile size={18} aria-hidden="true" />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          disabled={disabled}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => {
            isComposingRef.current = true
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false
          }}
          placeholder={`Nhắn cho ${conversationTitle}... (Enter gửi thử, Shift+Enter xuống dòng)`}
          aria-label={`Soạn tin nhắn gửi tới ${conversationTitle}`}
          className={styles.composerInput}
          data-testid="messenger-composer-input"
        />

        <button
          type="button"
          className={styles.sendBtn}
          onClick={onSend}
          disabled={!canSend}
          aria-label="Gửi tin nhắn mô phỏng cục bộ"
          title="Gửi thử cục bộ (chưa đồng bộ máy chủ)"
          data-testid="messenger-send-btn"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.composerHintRow}>
        <span>Mô phỏng cục bộ (PREVIEW) • Tin nhắn chưa gửi tới người nhận thật</span>
      </div>
    </div>
  )
}
