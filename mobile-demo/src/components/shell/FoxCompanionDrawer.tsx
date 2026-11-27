import React, { useState } from 'react'
import { useStore } from '../../store/questStore'
import { X, Heart, Sparkles, Volume2, Shield } from 'lucide-react'

export const FoxCompanionDrawer: React.FC = () => {
  const { fox, wardrobe, isFoxDrawerOpen, toggleFoxDrawer, petFox } = useStore()
  const [heartAnim, setHeartAnim] = useState(false)

  if (!isFoxDrawerOpen) return null

  const equippedHat = wardrobe.find((i) => i.id === fox.equippedHat)
  const equippedOutfit = wardrobe.find((i) => i.id === fox.equippedOutfit)
  const equippedAccessory = wardrobe.find((i) => i.id === fox.equippedAccessory)

  const handlePet = () => {
    petFox()
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 900)
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(6px)',
      zIndex: 60,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        background: 'var(--lq-surface)',
        borderRadius: '28px 28px 0 0',
        padding: '20px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🦊</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
                Bé Cáo {fox.name}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--lq-ink-muted)' }}>
                Đồng hành & Động viên hiệp sĩ
              </div>
            </div>
          </div>

          <button
            onClick={toggleFoxDrawer}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--lq-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--lq-ink-secondary)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Speech Bubble */}
        <div style={{
          background: 'var(--lq-bg-elevated)',
          border: '1px solid var(--lq-border)',
          borderRadius: '16px 16px 16px 4px',
          padding: '12px 14px',
          fontSize: 13,
          color: 'var(--lq-ink)',
          fontWeight: 600,
          lineHeight: 1.45,
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start'
        }}>
          <Sparkles size={16} color="var(--lq-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{fox.speechBubble}</span>
        </div>

        {/* Mascot Avatar Stage */}
        <div style={{
          background: 'linear-gradient(180deg, var(--lq-bg-elevated) 0%, var(--lq-surface) 100%)',
          borderRadius: 24,
          padding: '24px 16px',
          textAlign: 'center',
          border: '1px solid var(--lq-border)',
          position: 'relative',
          marginBottom: 16
        }}>
          {heartAnim && (
            <div style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 26,
              animation: 'bounceIn 0.8s ease-out forwards',
              zIndex: 10
            }}>
              💖✨
            </div>
          )}

          <div style={{
            position: 'relative',
            width: 100,
            height: 100,
            margin: '0 auto 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(242, 107, 58, 0.15) 0%, rgba(0,0,0,0) 70%)',
            borderRadius: '50%'
          }}>
            {equippedHat && (
              <div style={{ position: 'absolute', top: 2, fontSize: 26, zIndex: 4 }}>
                {equippedHat.icon}
              </div>
            )}
            <div className="animate-mascot" style={{ fontSize: 56, zIndex: 2 }}>
              🦊
            </div>
            {equippedAccessory && (
              <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 20, zIndex: 4 }}>
                {equippedAccessory.icon}
              </div>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lq-ink)' }}>
            {equippedOutfit ? equippedOutfit.name : 'Áo Tân Thủ'}
          </div>

          {/* Affection Bar */}
          <div style={{ maxWidth: 220, margin: '10px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ color: 'var(--lq-ink-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Heart size={11} color="#E63946" fill="#E63946" /> Độ thân thiết
              </span>
              <span style={{ color: 'var(--lq-accent)' }}>{fox.affection}/100</span>
            </div>
            <div style={{ height: 6, background: 'var(--lq-surface-subtle)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${fox.affection}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #F26B3A 0%, #E63946 100%)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Pet Action Button */}
        <button
          onClick={handlePet}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #F26B3A 0%, #DE5A2A 100%)',
            color: '#FFFFFF',
            borderRadius: 16,
            padding: '12px',
            fontSize: 14,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-accent)'
          }}
        >
          <Heart size={18} fill="#FFFFFF" />
          <span>Xoa Đầu Bé Cáo (+Thân Mật)</span>
        </button>
      </div>
    </div>
  )
}
