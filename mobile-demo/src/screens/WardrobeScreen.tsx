import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { Sparkles, Coins, Check } from 'lucide-react'

export const WardrobeScreen: React.FC = () => {
  const { fox, wardrobe, player, buyItem, equipItem } = useStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const equippedHat = wardrobe.find((i) => i.id === fox.equippedHat)
  const equippedOutfit = wardrobe.find((i) => i.id === fox.equippedOutfit)
  const equippedAccessory = wardrobe.find((i) => i.id === fox.equippedAccessory)

  const filteredItems = wardrobe.filter((item) => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px' }}>
      {/* Dressing Room Showcase */}
      <div className="card" style={{
        textAlign: 'center',
        padding: '20px 14px',
        position: 'relative',
        background: 'linear-gradient(180deg, var(--lq-bg-elevated) 0%, var(--lq-surface) 100%)',
        border: '1px solid rgba(246, 200, 95, 0.4)'
      }}>
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 105,
          height: 105,
          background: 'radial-gradient(circle, rgba(242, 107, 58, 0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          margin: '0 auto 8px'
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

        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--lq-ink)' }}>
          Bé Cáo {fox.name}
        </h3>
        <p style={{ fontSize: 11, color: 'var(--lq-ink-muted)', marginTop: 2 }}>
          {equippedOutfit ? `Đang mặc: ${equippedOutfit.name}` : 'Trang phục tân thủ'}
        </p>

        {/* Buff tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {equippedHat?.buffText && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--lq-reward-soft)',
              color: 'var(--lq-reward-ink)',
              padding: '2px 8px',
              borderRadius: 6
            }}>
              {equippedHat.buffText}
            </span>
          )}
          {equippedOutfit?.buffText && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--lq-accent-soft)',
              color: 'var(--lq-accent)',
              padding: '2px 8px',
              borderRadius: 6
            }}>
              {equippedOutfit.buffText}
            </span>
          )}
        </div>
      </div>

      {/* Category selector */}
      <div style={{ display: 'flex', background: 'var(--lq-surface-subtle)', padding: 4, borderRadius: 12, gap: 4 }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'hat', label: '👒 Mũ' },
          { id: 'outfit', label: '🥋 Đồ' },
          { id: 'accessory', label: '🦯 Vũ khí' }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: selectedCategory === c.id ? 'var(--lq-surface)' : 'transparent',
              color: selectedCategory === c.id ? 'var(--lq-ink)' : 'var(--lq-ink-muted)',
              boxShadow: selectedCategory === c.id ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {c.label}
          </button>
        ))}
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
                border: isEquipped ? '2px solid var(--lq-accent)' : '1px solid var(--lq-border)'
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
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--lq-surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 8
                }}>
                  {item.icon}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lq-ink)', marginBottom: 2 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--lq-ink-muted)', lineHeight: 1.3, marginBottom: 6 }}>
                  {item.description}
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
                    gap: 3
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
  )
}
