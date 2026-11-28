import React, { useState } from 'react'
import { X, ExternalLink, Link2, Check, Sparkles, Layers } from 'lucide-react'

interface FigmaLinkModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FigmaLinkModal: React.FC<FigmaLinkModalProps> = ({ isOpen, onClose }) => {
  const [figmaUrl, setFigmaUrl] = useState(() => {
    return localStorage.getItem('lifequest_figma_url') || 'https://www.figma.com/file/LifeQuest-Mobile-UI'
  })
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('lifequest_figma_url', figmaUrl)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  const handleOpenFigma = () => {
    window.open(figmaUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(figmaUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(6px)',
      zIndex: 80,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        background: 'var(--lq-surface)',
        borderRadius: '28px 28px 0 0',
        padding: '22px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Figma Icon Visual */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0ACF83 0%, #A259FF 50%, #F24E1E 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(162, 89, 255, 0.3)'
            }}>
              <Layers size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
                Liên Kết Figma Design
              </h3>
              <p style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                Đồng bộ bản vẽ thiết kế UI/UX LifeQuest
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--lq-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lq-ink-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Callout */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(162, 89, 255, 0.1) 0%, rgba(10, 207, 131, 0.1) 100%)',
          border: '1px solid rgba(162, 89, 255, 0.25)',
          borderRadius: 16,
          padding: '14px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--lq-ink)' }}>
              Trang Thiết Kế UI Figma
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, background: '#A259FF', color: '#FFFFFF', padding: '2px 8px', borderRadius: 10 }}>
              Figma Connected
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--lq-ink-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
            Nhấn nút bên dưới để mở trực tiếp file thiết kế Figma trên trình duyệt hoặc ứng dụng Figma của bạn.
          </p>

          <button
            onClick={handleOpenFigma}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '11px',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ExternalLink size={16} />
            <span>Mở Bản Vẽ Figma Ngay</span>
          </button>
        </div>

        {/* Custom Figma URL Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--lq-ink)' }}>
              Đường dẫn (URL) Figma của bạn
            </label>
            <div style={{ position: 'relative' }}>
              <Link2 size={16} color="var(--lq-ink-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="url"
                required
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 12,
                  border: '1px solid var(--lq-border)',
                  background: 'var(--lq-bg-elevated)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: 'var(--lq-ink)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 12,
                background: 'var(--lq-accent)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              {savedSuccess ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{savedSuccess ? 'Đã lưu đường dẫn!' : 'Lưu đường dẫn mới'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'var(--lq-surface-subtle)',
                color: 'var(--lq-ink)',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {copied ? 'Đã sao chép!' : 'Sao chép'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
