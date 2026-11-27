import React from 'react'

interface MascotVisualProps {
  size?: number
  className?: string
  equippedHat?: string | null
  equippedOutfit?: string | null
  equippedAccessory?: string | null
  facing?: 'front' | 'side' | 'back'
  zoom?: number
  emotion?: 'happy' | 'playful' | 'sleepy' | 'cheering' | 'focused' | string
  onClick?: () => void
}

export const MascotVisual: React.FC<MascotVisualProps> = ({
  size = 180,
  className = '',
  equippedHat = 'student_cap',
  equippedOutfit = 'simple_jacket',
  equippedAccessory = 'student_glasses',
  facing = 'front',
  zoom = 1,
  emotion = 'happy',
  onClick
}) => {
  // Compute transform based on camera facing angle and zoom
  let transform = `scale(${zoom})`
  if (facing === 'side') {
    transform += ' rotateY(38deg) skewY(-3deg)'
  } else if (facing === 'back') {
    transform += ' rotateY(180deg) brightness(0.92)'
  }

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
        userSelect: 'none',
        perspective: 800,
        transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform,
        transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        {/* Real LifeQuest 3D Mascot Render */}
        <img
          src="/fox_poster.png"
          alt="Fox Mascot V2"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 16px rgba(22, 50, 74, 0.16))'
          }}
        />

        {/* Overlay Glasses if equipped */}
        {(equippedAccessory === 'student_glasses' || equippedAccessory === 'glasses') && facing !== 'back' && (
          <div style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            width: '46%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 64 24" width="100%" fill="none">
              <circle cx="18" cy="12" r="10" stroke="#1D2A3A" strokeWidth="3" fill="rgba(255, 255, 255, 0.15)" />
              <circle cx="46" cy="12" r="10" stroke="#1D2A3A" strokeWidth="3" fill="rgba(255, 255, 255, 0.15)" />
              <path d="M28 12 H36" stroke="#1D2A3A" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Overlay Hat if equipped */}
        {equippedHat && (
          <div style={{
            position: 'absolute',
            top: '2%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: Math.round(size * 0.24),
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
            pointerEvents: 'none'
          }}>
            {equippedHat === 'student_cap' ? '🧢' :
             equippedHat === 'sports_headband' ? '🏷️' :
             equippedHat === 'explorer_hat' ? '👒' :
             equippedHat === 'mage_hat' ? '🧙‍♂️' :
             equippedHat === 'ninja_headband' ? '🥷' : '👑'}
          </div>
        )}
      </div>
    </div>
  )
}
