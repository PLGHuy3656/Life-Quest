import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { Heart, Sparkles } from 'lucide-react'

export const FoxCompanionCard: React.FC = () => {
  const { fox, wardrobe, petFox } = useStore()
  const [heartAnim, setHeartAnim] = useState(false)

  const equippedHatItem = wardrobe.find((i) => i.id === fox.equippedHat)
  const equippedOutfitItem = wardrobe.find((i) => i.id === fox.equippedOutfit)
  const equippedAccessoryItem = wardrobe.find((i) => i.id === fox.equippedAccessory)

  const handlePet = () => {
    petFox()
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 900)
  }

  return (
    <div className="card" style={{
      background: 'linear-gradient(145deg, #FFFFFF 0%, #F9F7F2 100%)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(242, 107, 58, 0.18)',
      padding: '16px'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 140,
        height: 140,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(246, 200, 95, 0.25) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Speech bubble */}
      <div style={{
        background: '#FAF9F6',
        border: '1px solid var(--border)',
        borderRadius: '16px 16px 16px 4px',
        padding: '10px 14px',
        fontSize: 13,
        color: 'var(--ink)',
        fontWeight: 600,
        lineHeight: 1.45,
        marginBottom: 14,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(22, 50, 74, 0.04)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6
      }}>
        <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{fox.speechBubble}</span>
      </div>

      {/* Main Mascot Display Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}>
        {/* Animated Fox Avatar */}
        <div style={{
          position: 'relative',
          width: 90,
          height: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(242, 107, 58, 0.1) 0%, rgba(246, 200, 95, 0.15) 100%)',
          borderRadius: 24,
          border: '2px solid rgba(242, 107, 58, 0.25)',
          cursor: 'pointer'
        }}
        onClick={handlePet}
        title="Bấm để vuốt ve cáo Kitsu!"
        >
          {/* Hat overlay */}
          {equippedHatItem && (
            <div style={{
              position: 'absolute',
              top: 2,
              fontSize: 22,
              zIndex: 3
            }}>
              {equippedHatItem.icon}
            </div>
          )}

          {/* Fox Face/Body */}
          <div className="animate-mascot" style={{
            fontSize: 48,
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🦊
          </div>

          {/* Accessory overlay */}
          {equippedAccessoryItem && (
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              fontSize: 18,
              zIndex: 3
            }}>
              {equippedAccessoryItem.icon}
            </div>
          )}

          {/* Floating Hearts Animation */}
          {heartAnim && (
            <div style={{
              position: 'absolute',
              top: -10,
              fontSize: 24,
              animation: 'bounceIn 0.8s ease-out forwards',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              💖
            </div>
          )}
        </div>

        {/* Fox Stats & Actions */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6
          }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
              Cáo Đồng Hành {fox.name}
            </div>
            <span className="badge badge-accent" style={{ fontSize: 11 }}>
              {fox.mood === 'cheering' ? '🎉 Phấn chấn' : fox.mood === 'playful' ? '🐾 Tinh nghịch' : '✨ Thân thiết'}
            </span>
          </div>

          {/* Equipped items tags */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            marginBottom: 8,
            fontSize: 11,
            color: 'var(--ink-secondary)'
          }}>
            {equippedOutfitItem && (
              <span style={{
                background: 'var(--bg-subtle)',
                padding: '2px 6px',
                borderRadius: 6
              }}>
                {equippedOutfitItem.icon} {equippedOutfitItem.name}
              </span>
            )}
          </div>

          {/* Affection bar */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-secondary)',
              marginBottom: 4
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Heart size={12} color="#E63946" fill="#E63946" /> Thân thiết
              </span>
              <span>{fox.affection}/100</span>
            </div>
            <div style={{
              height: 6,
              background: 'var(--bg-subtle)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${fox.affection}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #F26B3A 0%, #E63946 100%)',
                borderRadius: 3,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Pet button */}
          <button
            onClick={handlePet}
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#FFFFFF',
              borderRadius: 12,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(22, 50, 74, 0.15)'
            }}
          >
            <Heart size={14} fill="#FF7B90" color="#FF7B90" />
            <span>Xoa đầu bé Cáo</span>
          </button>
        </div>
      </div>
    </div>
  )
}
