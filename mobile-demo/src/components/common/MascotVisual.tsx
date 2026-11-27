import React from 'react'

interface MascotVisualProps {
  size?: number
  className?: string
  equippedHat?: string | null
  equippedOutfit?: string | null
  equippedAccessory?: string | null
  facing?: 'front' | 'side' | 'back'
  zoom?: number
  emotion?: 'happy' | 'playful' | 'sleepy' | 'cheering' | 'focused' | 'celebrate' | string
  onClick?: () => void
}

const getOfficialFoxAsset = (emotion?: string) => {
  switch (emotion) {
    case 'celebrate':
    case 'playful':
      return {
        src: '/assets/fox/fox-mood-celebrate-anim.webp',
        fallback: '/assets/fox/fox-mood-celebrate.png'
      }
    case 'cheering':
      return {
        src: '/assets/fox/fox-mood-cheer-anim.webp',
        fallback: '/assets/fox/fox-mood-cheer.png'
      }
    case 'focused':
    case 'sleepy':
      return {
        src: '/assets/fox/fox-cp1-anim.webp',
        fallback: '/assets/fox/fox-cp1.png'
      }
    default:
      return {
        src: '/assets/fox/fox-cp4-anim.webp',
        fallback: '/assets/fox/fox-cp4.png'
      }
  }
}

export const MascotVisual: React.FC<MascotVisualProps> = ({
  size = 180,
  className = '',
  facing = 'front',
  zoom = 1,
  emotion = 'happy',
  onClick
}) => {
  let transform = `scale(${zoom})`
  if (facing === 'side') {
    transform += ' rotateY(38deg) skewY(-3deg)'
  } else if (facing === 'back') {
    transform += ' rotateY(180deg) brightness(0.92)'
  }

  const asset = getOfficialFoxAsset(emotion)

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
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform,
          transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Official Animated 3D Fox Mascot */}
        <img
          src={asset.src}
          alt="Bé Cáo LifeQuest"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 18px rgba(22, 50, 74, 0.18))'
          }}
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = asset.fallback
          }}
        />
      </div>
    </div>
  )
}
