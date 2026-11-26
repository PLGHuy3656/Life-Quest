import React, { useState } from 'react'
import { useStore } from '../store/questStore'
import { Sparkles, Coins, Check, Lock, ShoppingBag } from 'lucide-react'
import { WardrobeItem } from '../types'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' }}>
      {/* Dressing Room Showcase Stage */}
      <div className="card" style={{
        background: 'linear-gradient(180deg, #FAF9F6 0%, #FFFFFF 100%)',
        textAlign: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(246, 200, 95, 0.4)'
      }}>
        {/* Glow behind */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246, 200, 95, 0.3) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Fox Avatar in Stage */}
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, #FFF4E0 0%, #FAF9F6 70%)',
          borderRadius: 36,
          border: '2px solid rgba(242, 107, 58, 0.3)',
          boxShadow: '0 8px 24px rgba(22, 50, 74, 0.08)',
          margin: '0 auto 12px'
        }}>
          {equippedHat && (
            <div style={{ position: 'absolute', top: 4, fontSize: 32, zIndex: 4 }}>
              {equippedHat.icon}
            </div>
          )}
          <div className="animate-mascot" style={{ fontSize: 64, zIndex: 2 }}>
            🦊
          </div>
          {equippedAccessory && (
            <div style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 24, zIndex: 4 }}>
              {equippedAccessory.icon}
            </div>
          )}
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          {fox.name} Phiêu Lưu Ký
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginTop: 2 }}>
          {equippedOutfit ? `Đang khoác: ${equippedOutfit.name}` : 'Trang phục cơ bản'}
        </p>

        {/* Active buffs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          flexWrap: 'wrap',
          marginTop: 10
        }}>
          {equippedHat?.bonusText && (
            <span className="badge badge-gold" style={{ fontSize: 11 }}>
              <Sparkles size={11} /> {equippedHat.bonusText}
            </span>
          )}
          {equippedOutfit?.bonusText && (
            <span className="badge badge-accent" style={{ fontSize: 11 }}>
              <Sparkles size={11} /> {equippedOutfit.bonusText}
            </span>
          )}
          {equippedAccessory?.bonusText && (
            <span className="badge badge-success" style={{ fontSize: 11 }}>
              <Sparkles size={11} /> {equippedAccessory.bonusText}
            </span>
          )}
        </div>
      </div>

      {/* Category selector */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-subtle)',
        padding: 4,
        borderRadius: 14,
        gap: 4
      }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'hat', label: '👒 Mũ / Nón' },
          { id: 'outfit', label: '🥋 Trang phục' },
          { id: 'accessory', label: '🦯 Phụ kiện' }
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              background: selectedCategory === c.id ? '#FFFFFF' : 'transparent',
              color: selectedCategory === c.id ? 'var(--primary)' : 'var(--ink-secondary)',
              boxShadow: selectedCategory === c.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              whiteSpace: 'nowrap'
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Wardrobe Items Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12
      }}>
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
                padding: '14px',
                position: 'relative',
                border: isEquipped ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isEquipped ? '#FFFDF9' : '#FFFFFF'
              }}
            >
              {isEquipped && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6
                }}>
                  ĐANG MẶC
                </span>
              )}

              {/* Item Icon & Info */}
              <div>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 10
                }}>
                  {item.icon}
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                  {item.name}
                </h4>
                <p style={{ fontSize: 11, color: 'var(--ink-secondary)', lineHeight: 1.35, marginBottom: 6 }}>
                  {item.description}
                </p>

                {item.bonusText && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>
                    {item.bonusText}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {item.unlocked ? (
                <button
                  onClick={() => equipItem(item)}
                  disabled={isEquipped}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    background: isEquipped ? 'var(--bg-subtle)' : 'var(--primary)',
                    color: isEquipped ? 'var(--ink-muted)' : '#FFFFFF',
                    cursor: isEquipped ? 'default' : 'pointer'
                  }}
                >
                  {isEquipped ? 'Đang trang bị' : 'Mặc ngay'}
                </button>
              ) : (
                <button
                  onClick={() => buyItem(item)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    background: player.coins >= item.price
                      ? 'linear-gradient(135deg, #F6C85F 0%, #E5A93C 100%)'
                      : 'var(--bg-subtle)',
                    color: player.coins >= item.price ? '#5C3E00' : 'var(--ink-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  <Coins size={14} />
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
