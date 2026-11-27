import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import {
  WARDROBE_CATEGORIES,
  OUTFIT_PRESETS,
  WardrobeCategoryId,
  OutfitId
} from '../data/wardrobeCatalog'
import { CosmeticPreviewThumb } from '../components/common/CosmeticPreviewThumb'
import { MascotVisual } from '../components/common/MascotVisual'
import { Coins, RotateCcw, Sparkles, Check, Shirt } from 'lucide-react'

export const WardrobeScreen: React.FC = () => {
  const {
    fox,
    wardrobe,
    player,
    buyItem,
    equipItem,
    equipOutfitPreset,
    resetOutfitToDefault
  } = useStore()

  const [selectedCategory, setSelectedCategory] = useState<WardrobeCategoryId>('ALL')
  const [activeTab, setActiveTab] = useState<'items' | 'outfits'>('outfits')

  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'ALL') return true
    return item.category === selectedCategory
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      {/* Dressing Room Showcase Stage */}
      <div className="card" style={{
        textAlign: 'center',
        padding: '18px 14px 14px',
        position: 'relative',
        background: 'linear-gradient(180deg, var(--lq-bg-elevated) 0%, var(--lq-surface) 100%)',
        border: '1px solid rgba(246, 200, 95, 0.4)'
      }}>
        {/* Reset to Default Scarf & Backpack */}
        <button
          onClick={resetOutfitToDefault}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'var(--lq-surface-subtle)',
            color: 'var(--lq-ink-muted)',
            padding: '4px 8px',
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
          title="Đặt lại về khăn đỏ & balo mặc định"
        >
          <RotateCcw size={11} />
          <span>Mặc định</span>
        </button>

        {/* Mascot Center Render */}
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 140,
          height: 140,
          margin: '0 auto 6px'
        }}>
          <MascotVisual
            size={135}
            className="animate-mascot"
            equippedHat={fox.equippedHat}
            equippedOutfit={fox.equippedOutfit}
            equippedAccessory={fox.equippedAccessory}
          />
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Bé Cáo {fox.name} (Gate H1/H2)
        </h3>

        {/* Speech Bubble */}
        <div style={{
          background: 'var(--lq-surface-subtle)',
          borderRadius: 12,
          padding: '8px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--lq-ink)',
          margin: '8px auto',
          maxWidth: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <Sparkles size={13} color="var(--lq-accent)" />
          <span>{fox.speechBubble}</span>
        </div>

        {/* Current Equipped Slots Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {wardrobe
            .filter((i) => i.equipped)
            .map((i) => (
              <span
                key={i.id}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: 'var(--lq-accent-soft)',
                  color: 'var(--lq-accent)',
                  padding: '2px 7px',
                  borderRadius: 6
                }}
              >
                {i.displayNameVi}
              </span>
            ))}
        </div>
      </div>

      {/* Main Tab Toggle: Bộ Trang Phục (Outfits) vs Từng Món (Items) */}
      <div style={{
        display: 'flex',
        background: 'var(--lq-surface-subtle)',
        padding: 4,
        borderRadius: 12,
        gap: 4
      }}>
        <button
          onClick={() => setActiveTab('outfits')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            background: activeTab === 'outfits' ? 'var(--lq-surface)' : 'transparent',
            color: activeTab === 'outfits' ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
            boxShadow: activeTab === 'outfits' ? 'var(--shadow-sm)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <Shirt size={14} />
          <span>6 Bộ Trang Phục Đồng Bộ</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            background: activeTab === 'items' ? 'var(--lq-surface)' : 'transparent',
            color: activeTab === 'items' ? 'var(--lq-accent)' : 'var(--lq-ink-muted)',
            boxShadow: activeTab === 'items' ? 'var(--shadow-sm)' : 'none'
          }}
        >
          Từng Món Phụ Kiện (H1/H2)
        </button>
      </div>

      {/* 6 OUTFIT PRESETS VIEW */}
      {activeTab === 'outfits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OUTFIT_PRESETS.map((preset) => {
            const isFullyEquipped =
              (!preset.slots.HEAD || fox.equippedHat === preset.slots.HEAD) &&
              (!preset.slots.BODY || fox.equippedOutfit === preset.slots.BODY)

            return (
              <div
                key={preset.id}
                className="card"
                style={{
                  padding: '14px',
                  border: isFullyEquipped ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                  background: isFullyEquipped ? 'var(--lq-bg-elevated)' : 'var(--lq-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: preset.palette[0],
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }} />
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--lq-ink)' }}>
                      {preset.nameVi}
                    </h4>
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--lq-accent)',
                    background: 'var(--lq-accent-soft)',
                    padding: '2px 8px',
                    borderRadius: 6
                  }}>
                    {preset.theme}
                  </span>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lq-success)', marginBottom: 10 }}>
                  ✨ {preset.buff}
                </div>

                {/* Previews of items in this preset */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {Object.values(preset.slots).map((itemId) => {
                    const item = wardrobe.find((i) => i.id === itemId)
                    if (!item) return null
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'var(--lq-surface-subtle)',
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--lq-ink)'
                        }}
                      >
                        <CosmeticPreviewThumb kind={item.iconKind} palette={item.palette} size={22} />
                        <span>{item.displayNameVi}</span>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => equipOutfitPreset(preset.id)}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    background: isFullyEquipped
                      ? 'var(--lq-surface-subtle)'
                      : 'linear-gradient(135deg, #16324A 0%, #1E4261 100%)',
                    color: isFullyEquipped ? 'var(--lq-ink-muted)' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {isFullyEquipped ? <Check size={14} /> : <Sparkles size={14} />}
                  <span>{isFullyEquipped ? 'Đang mặc bộ này' : 'Mặc trọn bộ ngay'}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* INDIVIDUAL ITEMS VIEW */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--lq-surface-subtle)',
            padding: 4,
            borderRadius: 12,
            gap: 4,
            overflowX: 'auto'
          }}>
            {WARDROBE_CATEGORIES.map((c) => {
              const isSelected = selectedCategory === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isSelected ? 'var(--lq-surface)' : 'transparent',
                    color: isSelected ? 'var(--lq-ink)' : 'var(--lq-ink-muted)',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>

          {/* Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filteredItems.map((item) => {
              const isEquipped = item.equipped

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px',
                    position: 'relative',
                    border: isEquipped ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)',
                    background: isEquipped ? 'var(--lq-bg-elevated)' : 'var(--lq-surface)'
                  }}
                >
                  {isEquipped && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'var(--lq-accent)',
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4
                    }}>
                      ĐANG MẶC
                    </span>
                  )}

                  <div>
                    {/* Real Bespoke Vector Icon */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <CosmeticPreviewThumb
                        kind={item.iconKind}
                        palette={item.palette}
                        size={52}
                      />
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--lq-ink)', marginBottom: 2, lineHeight: 1.25 }}>
                      {item.displayNameVi}
                    </div>

                    <div style={{ fontSize: 9, color: 'var(--lq-ink-muted)', marginBottom: 4 }}>
                      {item.subtitleVi}
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lq-accent)', marginBottom: 8 }}>
                      {item.buffText}
                    </div>
                  </div>

                  {item.unlocked ? (
                    <button
                      onClick={() => equipItem(item)}
                      disabled={isEquipped}
                      style={{
                        width: '100%',
                        padding: '7px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isEquipped ? 'var(--lq-surface-subtle)' : 'var(--lq-primary)',
                        color: isEquipped ? 'var(--lq-ink-muted)' : '#FFFFFF'
                      }}
                    >
                      {isEquipped ? 'Đang mặc' : 'Mặc ngay'}
                    </button>
                  ) : (
                    <button
                      onClick={() => buyItem(item)}
                      style={{
                        width: '100%',
                        padding: '7px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: player.coins >= item.price
                          ? 'linear-gradient(135deg, #F6C85F 0%, #E5A93C 100%)'
                          : 'var(--lq-surface-subtle)',
                        color: player.coins >= item.price ? '#5C3E00' : 'var(--lq-ink-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <Coins size={12} />
                      <span>{item.price} Vàng</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
