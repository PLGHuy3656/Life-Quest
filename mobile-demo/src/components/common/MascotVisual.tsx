import React from 'react'

interface MascotVisualProps {
  size?: number
  className?: string
  equippedHat?: string | null
  equippedOutfit?: string | null
  equippedAccessory?: string | null
  emotion?: 'happy' | 'playful' | 'sleepy' | 'cheering' | 'focused'
  onClick?: () => void
}

export const MascotVisual: React.FC<MascotVisualProps> = ({
  size = 72,
  className = '',
  equippedHat,
  equippedAccessory,
  emotion = 'happy',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {/* Real LifeQuest Mascot Render */}
      <img
        src="/fox_poster.png"
        alt="Fox Mascot Kitsu"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: emotion === 'sleepy' ? 'brightness(0.85) grayscale(0.2)' : 'drop-shadow(0 4px 12px rgba(242, 107, 58, 0.25))',
          transition: 'transform 0.2s ease, filter 0.3s ease'
        }}
      />

      {/* Visual Hat accessory badge if equipped */}
      {equippedHat && (
        <div style={{
          position: 'absolute',
          top: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: Math.round(size * 0.28),
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          {equippedHat === 'straw_hat' ? '👒' : equippedHat === 'wizard_hat' ? '🧙‍♂️' : '👑'}
        </div>
      )}

      {/* Visual Weapon / Accessory badge if equipped */}
      {equippedAccessory && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: -2,
          fontSize: Math.round(size * 0.26),
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          {equippedAccessory === 'wooden_staff' ? '🦯' : '🗡️'}
        </div>
      )}
    </div>
  )
}
