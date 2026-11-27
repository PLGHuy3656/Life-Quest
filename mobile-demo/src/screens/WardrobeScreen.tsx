import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import {
  WARDROBE_CATEGORIES,
  EXACT_WARDROBE_CATALOG,
  WardrobeCategoryId,
  WardrobeCatalogItem
} from '../data/wardrobeCatalog'
import { CosmeticPreviewThumb } from '../components/common/CosmeticPreviewThumb'
import { MascotVisual } from '../components/common/MascotVisual'
import { MiniHangerHook, ClosetBotanicalDecor } from '../components/common/ClosetBotanicalDecor'
import {
  Shirt,
  Store,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Mic,
  Archive,
  Layers
} from 'lucide-react'

export const WardrobeScreen: React.FC = () => {
  const {
    fox,
    wardrobe,
    equipItem
  } = useStore()

  // State matching desktop Web exactly
  const [mode, setMode] = useState<'wardrobe' | 'shop'>('wardrobe')
  const [closetTab, setClosetTab] = useState<'drawers' | 'hanging'>('drawers')
  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategoryId>('ALL')
  const [cameraFacing, setCameraFacing] = useState<'front' | 'side' | 'back'>('front')
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [isDialogueVisible, setIsDialogueVisible] = useState(true)

  // Dialogue from screenshot: "Đuôi mình vẫn vẫy thoải mái — phối thêm món khác xem sao nhé!"
  const speechText = isDialogueVisible
    ? fox.speechBubble || 'Đuôi mình vẫn vẫy thoải mái — phối thêm món khác xem sao nhé!'
    : null

  // Count previewed / equipped items
  const previewedItems = wardrobe.filter((i) => i.equipped)
  const previewCount = previewedItems.length

  // Filter items by selected category
  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'ALL') return true
    return item.category === selectedCategory
  })

  // Toggle item preview/equip
  const handleTogglePreview = (item: WardrobeCatalogItem) => {
    equipItem(item)
  }

  // Camera controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.3, z + 0.1))
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.1))
  const handleResetCamera = () => {
    setCameraFacing('front')
    setZoomLevel(1)
  }

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '12px 14px 70px',
      background: 'var(--lq-bg)',
      minHeight: '100%'
    }}>
      {/* ================================================================ */}
      {/* 1. PHÒNG THỬ ĐỒ 3D (Match LEFT CARD from desktop screenshot)     */}
      {/* ================================================================ */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '14px',
        border: '1px solid rgba(22, 50, 74, 0.1)',
        boxShadow: '0 4px 18px rgba(22, 50, 74, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* Stage Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 20,
              background: '#fff3ea',
              color: '#c85020',
              fontSize: 11.5,
              fontWeight: 800
            }}>
              <Sparkles size={12} color="#c85020" />
              <span>Phòng thử đồ 3D</span>
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 8px',
              borderRadius: 20,
              background: '#fff8e6',
              color: '#b45309',
              fontSize: 11,
              fontWeight: 700
            }}>
              Đang xem trước ({previewCount})
            </span>
          </div>

          {/* Mode Switch: [👕 Tủ đồ] vs [🏬 Cửa hàng] */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: 3,
            borderRadius: 20,
            background: '#f5f0e6',
            border: '1px solid #e9e0d1'
          }}>
            <button
              onClick={() => setMode('wardrobe')}
              style={{
                border: 'none',
                background: mode === 'wardrobe' ? '#16324A' : 'transparent',
                color: mode === 'wardrobe' ? '#FFFFFF' : '#4D6274',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: mode === 'wardrobe' ? '0 2px 8px rgba(22, 50, 74, 0.2)' : 'none'
              }}
            >
              <Shirt size={12} />
              <span>Tủ đồ</span>
            </button>
            <button
              onClick={() => setMode('shop')}
              style={{
                border: 'none',
                background: mode === 'shop' ? '#16324A' : 'transparent',
                color: mode === 'shop' ? '#FFFFFF' : '#4D6274',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Store size={12} />
              <span>Cửa hàng</span>
            </button>
          </div>
        </div>

        {/* Speech Bubble (Identical to screenshot) */}
        {speechText && (
          <div style={{
            background: '#FAF9F6',
            border: '1px solid rgba(22, 50, 74, 0.1)',
            borderRadius: 16,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#16324A',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F26B3A', flexShrink: 0 }} />
              <span>{speechText}</span>
            </div>
            <button
              onClick={() => setIsDialogueVisible(false)}
              style={{ background: 'transparent', color: '#8B9DAE', padding: 2 }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 3D Mascot Stage Viewport */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 220,
          background: 'radial-gradient(circle, #FFF4E8 0%, #FAF9F6 70%)',
          borderRadius: 20,
          border: '1px solid rgba(242, 107, 58, 0.15)',
          overflow: 'hidden',
          padding: '16px 0 10px'
        }}>
          {/* Real Mascot Render with Glasses + Jacket */}
          <MascotVisual
            size={185}
            facing={cameraFacing}
            zoom={zoomLevel}
            equippedHat={fox.equippedHat}
            equippedOutfit={fox.equippedOutfit}
            equippedAccessory={fox.equippedAccessory}
          />

          {/* Floating Camera / View Controls Bar (Matches desktop screenshot!) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 24,
            background: '#FFFFFF',
            border: '1px solid rgba(22, 50, 74, 0.12)',
            boxShadow: '0 4px 14px rgba(22, 50, 74, 0.08)',
            marginTop: 8
          }}>
            <button
              onClick={() => setCameraFacing('front')}
              style={{
                border: 'none',
                background: cameraFacing === 'front' ? '#16324A' : 'transparent',
                color: cameraFacing === 'front' ? '#FFFFFF' : '#4D6274',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <span style={{ fontSize: 9 }}>•</span> Trước
            </button>

            <button
              onClick={() => setCameraFacing('side')}
              style={{
                border: 'none',
                background: cameraFacing === 'side' ? '#16324A' : 'transparent',
                color: cameraFacing === 'side' ? '#FFFFFF' : '#4D6274',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              Ngang
            </button>

            <button
              onClick={() => setCameraFacing('back')}
              style={{
                border: 'none',
                background: cameraFacing === 'back' ? '#16324A' : 'transparent',
                color: cameraFacing === 'back' ? '#FFFFFF' : '#4D6274',
                borderRadius: 16,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <span style={{ fontSize: 9 }}>•</span> Sau
            </button>

            <div style={{ width: 1, height: 12, background: '#E2DFD8', margin: '0 2px' }} />

            <button
              onClick={handleZoomIn}
              style={{ background: 'transparent', color: '#4D6274', padding: 4 }}
              title="Phóng to"
            >
              <ZoomIn size={14} />
            </button>

            <button
              onClick={handleZoomOut}
              style={{ background: 'transparent', color: '#4D6274', padding: 4 }}
              title="Thu nhỏ"
            >
              <ZoomOut size={14} />
            </button>

            <button
              onClick={handleResetCamera}
              style={{ background: 'transparent', color: '#4D6274', padding: 4 }}
              title="Đặt lại góc nhìn"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. TỦ ĐỒ FOX V2 (Match RIGHT CARD from desktop screenshot)        */}
      {/* ================================================================ */}
      <section style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '16px',
        border: '1px solid rgba(22, 50, 74, 0.1)',
        boxShadow: '0 4px 18px rgba(22, 50, 74, 0.05)',
        position: 'relative'
      }}>
        {/* Botanical Vine Decor on top */}
        <ClosetBotanicalDecor />

        {/* Panel Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          position: 'relative',
          zIndex: 3
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#16324A', margin: 0 }}>
              Tủ đồ Fox V2
            </h3>
            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid #fde68a'
            }}>
              PREVIEW ONLY
            </span>
          </div>

          {/* Sub-tabs: [🗄️ Ngăn kéo] vs [👕 Hộc tủ] */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: 3,
            borderRadius: 20,
            background: '#f5f0e6',
            border: '1px solid #e9e0d1'
          }}>
            <button
              onClick={() => setClosetTab('drawers')}
              style={{
                border: 'none',
                background: closetTab === 'drawers' ? '#16324A' : 'transparent',
                color: closetTab === 'drawers' ? '#FFFFFF' : '#4D6274',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Archive size={12} />
              <span>Ngăn kéo</span>
            </button>
            <button
              onClick={() => setClosetTab('hanging')}
              style={{
                border: 'none',
                background: closetTab === 'hanging' ? '#16324A' : 'transparent',
                color: closetTab === 'hanging' ? '#FFFFFF' : '#4D6274',
                borderRadius: 20,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Shirt size={12} />
              <span>Hộc tủ</span>
            </button>
          </div>
        </div>

        {/* Category Chips Bar (Tất cả 18, Mũ 6, Khăn 1, Balo 3, Trang phục 4, Phụ kiện 5) */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 8,
          marginBottom: 12,
          position: 'relative',
          zIndex: 3
        }}>
          {[
            { id: 'ALL' as WardrobeCategoryId, label: 'Tất cả', count: 18 },
            { id: 'HAT' as WardrobeCategoryId, label: 'Mũ', count: 6 },
            { id: 'SCARF' as WardrobeCategoryId, label: 'Khăn', count: 1 },
            { id: 'BACKPACK' as WardrobeCategoryId, label: 'Balo', count: 3 },
            { id: 'OUTFIT' as WardrobeCategoryId, label: 'Trang phục', count: 4 },
            { id: 'ACCESSORY' as WardrobeCategoryId, label: 'Phụ kiện', count: 5 }
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  border: isSelected ? '1.5px solid #F26B3A' : '1px solid #E9E0D1',
                  background: isSelected ? '#FFF7F2' : '#FFFFFF',
                  color: isSelected ? '#F26B3A' : '#4D6274',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: isSelected ? '#F26B3A' : 'rgba(22, 50, 74, 0.08)',
                  color: isSelected ? '#FFFFFF' : '#768796',
                  padding: '1px 5px',
                  borderRadius: 10
                }}>
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* 2-Column Item Cards Grid (Matches desktop screenshot!) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
          position: 'relative',
          zIndex: 3
        }}>
          {filteredItems.map((item) => {
            const isPreviewing = item.equipped

            return (
              <article
                key={item.id}
                style={{
                  position: 'relative',
                  background: '#FFFFFF',
                  border: isPreviewing ? '1.5px solid #F26B3A' : '1px solid rgba(22, 50, 74, 0.1)',
                  borderRadius: 18,
                  padding: '12px 14px',
                  boxShadow: isPreviewing ? '0 4px 16px rgba(242, 107, 58, 0.12)' : '0 2px 6px rgba(22, 50, 74, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                {/* Mini Coat Hanger Hook on Top */}
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none'
                }}>
                  <MiniHangerHook />
                </div>

                {/* Top Row: Vector Thumbnail + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Vector Thumbnail */}
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: '#FAF6EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid #EFE6D8'
                  }}>
                    <CosmeticPreviewThumb
                      kind={item.iconKind}
                      palette={item.palette}
                      size={44}
                    />
                  </div>

                  {/* Title & Subtitle */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#16324A',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.displayNameVi}
                    </div>

                    <div style={{
                      fontSize: 10.5,
                      color: '#768796',
                      marginTop: 2,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.subtitleVi}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Theme Badge + Action Buttons (Thử ngay / Tháo) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 2,
                  paddingTop: 6,
                  borderTop: '1px solid rgba(22, 50, 74, 0.06)'
                }}>
                  {/* Theme pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {item.outfitThemeVi && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#16324A',
                        background: '#EDF3F8',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        {item.outfitThemeVi}
                      </span>
                    )}

                    {isPreviewing && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        background: '#FFF8E6',
                        color: '#B45309',
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        Đang thử
                      </span>
                    )}
                  </div>

                  {/* Action Button: Thử ngay (navy) or Tháo (ghost/outline) */}
                  <button
                    onClick={() => handleTogglePreview(item)}
                    style={{
                      border: isPreviewing ? '1px solid #D1D5DB' : 'none',
                      background: isPreviewing ? '#FFFFFF' : '#16324A',
                      color: isPreviewing ? '#4B5563' : '#FFFFFF',
                      borderRadius: 14,
                      padding: '5px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isPreviewing ? 'none' : '0 2px 6px rgba(22, 50, 74, 0.15)'
                    }}
                  >
                    {isPreviewing ? 'Tháo' : 'Thử ngay'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* Floating Bottom-Right Button: [🎙️ Trợ lý Fox] (Matches screenshot!) */}
      <button
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          background: '#16324A',
          color: '#FFFFFF',
          borderRadius: 24,
          padding: '10px 16px',
          fontSize: 12,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 6px 20px rgba(22, 50, 74, 0.3)',
          zIndex: 45
        }}
        title="Trợ lý thoại Fox"
      >
        <Mic size={15} />
        <span>Trợ lý Fox</span>
      </button>
    </div>
  )
}
