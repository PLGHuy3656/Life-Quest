import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import {
  WARDROBE_CATEGORIES,
  WardrobeCategoryId,
  WardrobeCatalogItem
} from '../data/wardrobeCatalog'
import { CosmeticPreviewThumb } from '../components/common/CosmeticPreviewThumb'
import {
  Shirt,
  Store,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Mic,
  Check,
  Crown
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface OutfitPreset {
  id: string
  name: string
  emoji: string
  color: string
  gradient: string
  dialogue: string
  items: string[]
}

const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: 'student',
    name: 'Học sinh',
    emoji: '🎓',
    color: '#24406B',
    gradient: 'linear-gradient(135deg, #24406B, #1E7F8C)',
    dialogue: 'Kính tròn và áo khoác học sinh vừa vặn lắm, cùng đến trường nào!',
    items: ['student_cap', 'student_glasses', 'simple_jacket']
  },
  {
    id: 'sports',
    name: 'Thể thao',
    emoji: '🏃',
    color: '#168C78',
    gradient: 'linear-gradient(135deg, #168C78, #1F6FD1)',
    dialogue: 'Băng đô và giày thể thao siêu êm, sẵn sàng bứt phá chuỗi 5K rồi!',
    items: ['sports_headband', 'sports_jersey', 'sports_sneakers']
  },
  {
    id: 'explorer',
    name: 'Thám hiểm',
    emoji: '🧭',
    color: '#5E7A3A',
    gradient: 'linear-gradient(135deg, #D8C08A, #5E7A3A)',
    dialogue: 'Mũ safari và kính lúp đã sẵn sàng, cùng đi tìm bí mật mới thôi!',
    items: ['explorer_hat', 'explorer_backpack', 'explorer_magnifier']
  },
  {
    id: 'mage',
    name: 'Pháp sư',
    emoji: '🧙‍♂️',
    color: '#4B2E83',
    gradient: 'linear-gradient(135deg, #4B2E83, #F2C14E)',
    dialogue: 'Đũa sao phát sáng kìa! Hôm nay mình sẽ làm phép nhân đôi năng suất!',
    items: ['mage_hat', 'mage_capelet', 'mage_wand']
  },
  {
    id: 'ninja',
    name: 'Ninja',
    emoji: '🥷',
    color: '#1D2433',
    gradient: 'linear-gradient(135deg, #1D2433, #E0533A)',
    dialogue: 'Cuộn bí kíp đã mở, bước đi không một tiếng động để hoàn thành task!',
    items: ['ninja_headband', 'ninja_gi', 'ninja_scroll']
  },
  {
    id: 'tet',
    name: 'Tết',
    emoji: '🧧',
    color: '#C1121F',
    gradient: 'linear-gradient(135deg, #C1121F, #E9B949)',
    dialogue: 'Khăn đóng và áo dài rực rỡ, chúc bạn vạn sự như ý, chuỗi ngày bất tận!',
    items: ['tet_khan_dong', 'tet_ao_dai', 'tet_lixi']
  }
]

export const WardrobeScreen: React.FC = () => {
  const { wardrobe, equipItem } = useStore()

  // State matching specification
  const [mode, setMode] = useState<'wardrobe' | 'shop'>('wardrobe')
  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategoryId>('ALL')
  const [currentOutfit, setCurrentOutfit] = useState<OutfitPreset>(OUTFIT_PRESETS[0])
  const [speechText, setSpeechText] = useState<string>(OUTFIT_PRESETS[0].dialogue)
  const [isDialogueVisible, setIsDialogueVisible] = useState(true)
  const [mascotAnim, setMascotAnim] = useState<string>('/assets/fox/fox-cp4-anim.webp')

  // Natural Finger Touch & 3D Gesture Rotation State
  const [rotationY, setRotationY] = useState(0)
  const [rotationX, setRotationX] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStart = React.useRef({ x: 0, y: 0, rotY: 0, rotX: 0 })
  const initialTouchDistance = React.useRef<number | null>(null)
  const initialZoom = React.useRef(1)

  // 1. One finger drag / mouse drag for smooth 360 rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    setIsDragging(true)
    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotY: rotationY,
      rotX: rotationX
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const deltaX = e.clientX - pointerStart.current.x
    const deltaY = e.clientY - pointerStart.current.y

    const newRotY = pointerStart.current.rotY + deltaX * 0.95
    const newRotX = Math.max(-18, Math.min(18, pointerStart.current.rotX - deltaY * 0.2))

    setRotationY(newRotY)
    setRotationX(newRotX)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // 2. Two fingers pinch to zoom (2 ngón phóng to thu nhỏ)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      initialTouchDistance.current = dist
      initialZoom.current = zoom
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scaleFactor = dist / initialTouchDistance.current
      const newZoom = Math.max(0.75, Math.min(1.65, initialZoom.current * scaleFactor))
      setZoom(newZoom)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      initialTouchDistance.current = null
    }
  }

  // 3. Mouse wheel zoom support for desktop browsers
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    setZoom((prev) => Math.max(0.75, Math.min(1.65, prev - e.deltaY * 0.0012)))
  }

  // 4. Reset gesture
  const handleReset = () => {
    setRotationY(0)
    setRotationX(0)
    setZoom(1)
  }

  // Count items by category
  const getCategoryCount = (catId: WardrobeCategoryId) => {
    if (catId === 'ALL') return wardrobe.length
    return wardrobe.filter((i) => i.category === catId).length
  }

  // Filter items by category
  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'ALL') return true
    return item.category === selectedCategory
  })

  // Equip full outfit preset
  const handleSelectPreset = (preset: OutfitPreset) => {
    setCurrentOutfit(preset)
    setSpeechText(preset.dialogue)
    setIsDialogueVisible(true)

    // Trigger celebration animation
    setMascotAnim('/assets/fox/fox-mood-celebrate-anim.webp')
    confetti({ particleCount: 60, spread: 70 })

    setTimeout(() => {
      setMascotAnim('/assets/fox/fox-cp4-anim.webp')
    }, 2200)

    // Equip items in this preset
    wardrobe.forEach((item) => {
      if (preset.items.includes(item.id) && !item.equipped) {
        equipItem(item)
      }
    })
  }

  // Toggle single item equip
  const handleToggleItem = (item: WardrobeCatalogItem) => {
    equipItem(item)

    if (!item.equipped) {
      setSpeechText(`Món "${item.displayNameVi}" hợp với Fox ghê! Cùng thử thêm nhé!`)
      setIsDialogueVisible(true)
      confetti({ particleCount: 35, spread: 50 })
    }
  }

  // 3D mascot smooth transform
  const mascotTransform = `scale(${zoom}) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '8px 16px 80px',
      background: 'var(--lq-bg)',
      minHeight: '100%'
    }}>
      {/* ================================================================ */}
      {/* 1. PHÒNG THỬ ĐỒ 3D VỚI MASCOT HOẠT ẢNH CHUYỂN ĐỘNG             */}
      {/* ================================================================ */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '14px',
        border: '1px solid rgba(22, 50, 74, 0.1)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {/* Stage Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 20,
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              fontSize: 11.5,
              fontWeight: 800
            }}>
              <Sparkles size={12} />
              <span>Phòng thử đồ 3D</span>
            </span>

            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 20,
              background: 'var(--lq-reward-soft)',
              color: 'var(--lq-reward-ink)'
            }}>
              1.280 Xu
            </span>
          </div>

          {/* Mode Switch: [👕 Tủ đồ] vs [🏬 Cửa hàng] */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: 2,
            borderRadius: 20,
            background: 'var(--lq-surface-subtle)'
          }}>
            <button
              onClick={() => setMode('wardrobe')}
              style={{
                border: 'none',
                background: mode === 'wardrobe' ? '#16324A' : 'transparent',
                color: mode === 'wardrobe' ? '#FFFFFF' : 'var(--lq-ink-muted)',
                borderRadius: 16,
                padding: '4px 9px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer'
              }}
            >
              <Shirt size={11} />
              <span>Tủ đồ</span>
            </button>

            <button
              onClick={() => setMode('shop')}
              style={{
                border: 'none',
                background: mode === 'shop' ? '#16324A' : 'transparent',
                color: mode === 'shop' ? '#FFFFFF' : 'var(--lq-ink-muted)',
                borderRadius: 16,
                padding: '4px 9px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer'
              }}
            >
              <Store size={11} />
              <span>Cửa hàng</span>
            </button>
          </div>
        </div>

        {/* Mascot Speech Bubble */}
        {isDialogueVisible && speechText && (
          <div style={{
            background: '#FAF9F6',
            border: '1px solid var(--lq-border)',
            borderRadius: 16,
            padding: '9px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--lq-ink)',
            lineHeight: 1.35,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lq-accent)', flexShrink: 0 }} />
              <span>{speechText}</span>
            </div>
            <button
              onClick={() => setIsDialogueVisible(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--lq-ink-muted)', padding: 0, cursor: 'pointer' }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 3D Mascot Stage Viewport with Finger Drag & Pinch-to-Zoom */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onDoubleClick={handleReset}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 250,
            background: 'linear-gradient(160deg, #FFE9D6 0%, #FFF6EC 100%)',
            borderRadius: 20,
            border: '1px solid rgba(242, 107, 58, 0.2)',
            overflow: 'hidden',
            padding: '16px 0 12px',
            boxShadow: 'inset 0 2px 10px rgba(242, 107, 58, 0.08)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none'
          }}
        >
          {/* Top-Left Chip: Gesture instruction */}
          <span style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(22, 50, 74, 0.08)',
            color: 'var(--lq-ink)',
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 10,
            pointerEvents: 'none'
          }}>
            👆 Lướt xoay 360° · 🤏 2 ngón thu phóng
          </span>

          {/* Top-Right Reset Button if transformed */}
          {(rotationY !== 0 || rotationX !== 0 || zoom !== 1) && (
            <button
              onClick={handleReset}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(22, 50, 74, 0.12)',
                color: 'var(--lq-ink)',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                zIndex: 10
              }}
              title="Đặt lại góc nhìn ban đầu"
            >
              <RotateCcw size={10} />
              <span>Gốc</span>
            </button>
          )}

          {/* Bottom-Left Chip: Active Outfit */}
          <span style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'var(--lq-accent-soft)',
            color: 'var(--lq-accent)',
            fontSize: 10.5,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 10,
            border: '1px solid rgba(242, 107, 58, 0.25)',
            pointerEvents: 'none'
          }}>
            Bộ: {currentOutfit.name} {currentOutfit.emoji}
          </span>

          {/* Official Animated 3D Fox Mascot */}
          <div style={{
            perspective: 800,
            width: 195,
            height: 195,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <img
              src={mascotAnim}
              alt="Fox Mascot Animated"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: mascotTransform,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                filter: 'drop-shadow(0 8px 20px rgba(22, 50, 74, 0.18))'
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/assets/fox/fox-cp4.png'
              }}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. CHỌN NHANH 6 BỘ TRANG PHỤC (OUTFIT LIBRARY)                   */}
      {/* ================================================================ */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Crown size={15} color="#F26B3A" />
            <span>6 Bộ Trang Phục Chính</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-ink-muted)' }}>
            Chạm để mặc cả bộ
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {OUTFIT_PRESETS.map((preset) => {
            const isSelected = currentOutfit.id === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 16,
                  background: isSelected ? preset.gradient : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--lq-ink)',
                  border: isSelected ? 'none' : '1px solid var(--lq-border)',
                  boxShadow: isSelected ? '0 4px 12px rgba(22, 50, 74, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 800,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
                {isSelected && <Check size={12} strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. TỦ ĐỒ VẬT PHẨM FOX V2 (GRID 3 CỘT CHUẨN SKELETON 16)          */}
      {/* ================================================================ */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '14px',
        border: '1px solid rgba(22, 50, 74, 0.1)',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* Category Filter Pills */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4
        }}>
          {WARDROBE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  border: isSelected ? '1.5px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                  background: isSelected ? 'var(--lq-accent-soft)' : '#FFFFFF',
                  color: isSelected ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  marginLeft: 4,
                  opacity: 0.8
                }}>
                  ({getCategoryCount(cat.id)})
                </span>
              </button>
            )
          })}
        </div>

        {/* 3-Column Items Touch Grid (Matches screens/16_wardrobe.html) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8
        }}>
          {filteredItems.map((item) => {
            const isEquipped = item.equipped

            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item)}
                style={{
                  background: isEquipped ? 'var(--lq-accent-soft)' : '#FFFFFF',
                  borderRadius: 16,
                  border: isEquipped ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                  padding: '8px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isEquipped ? '0 3px 10px rgba(242, 107, 58, 0.18)' : '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Equipped Check Badge */}
                {isEquipped && (
                  <span style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--lq-accent)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9
                  }}>
                    <Check size={10} strokeWidth={3.5} />
                  </span>
                )}

                {/* Clean Vector SVG Thumbnail Tile */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 12,
                  background: isEquipped ? 'rgba(242, 107, 58, 0.12)' : 'var(--lq-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CosmeticPreviewThumb
                    kind={item.iconKind}
                    palette={item.palette}
                    size={38}
                  />
                </div>

                {/* Title */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isEquipped ? 'var(--lq-accent)' : 'var(--lq-ink)',
                  lineHeight: 1.25,
                  minHeight: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.displayNameVi}
                </div>

                {/* Equip Status Tag */}
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 8,
                  background: isEquipped ? 'var(--lq-accent)' : 'var(--lq-surface-subtle)',
                  color: isEquipped ? '#FFFFFF' : 'var(--lq-ink-muted)'
                }}>
                  {isEquipped ? 'Đang thử' : 'Thử ngay'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Floating Bottom-Right Assistant Button */}
      <div style={{
        position: 'sticky',
        bottom: 8,
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
        zIndex: 35
      }}>
        <button
          style={{
            pointerEvents: 'auto',
            background: '#16324A',
            color: '#FFFFFF',
            borderRadius: 24,
            padding: '8px 14px',
            fontSize: 11.5,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 6px 18px rgba(22, 50, 74, 0.35)',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Trợ lý thoại Fox"
        >
          <Mic size={14} />
          <span>Trợ lý Fox</span>
        </button>
      </div>
    </div>
  )
}
export default WardrobeScreen
