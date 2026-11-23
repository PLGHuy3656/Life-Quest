import { useMemo, useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useCompanion } from '@/features/mascot/CompanionProvider'
import { FoxCompanionView } from '@/features/mascot/FoxCompanionView'
import {
  COSMETIC_CATALOG,
  COSMETIC_SLOTS,
  OUTFIT_LIBRARY,
  type CosmeticItemId,
  type CosmeticSlot,
  type OutfitId
} from '@/mascot/cosmetics/cosmeticContract'
import styles from './WardrobePage.module.css'

const SLOT_LABELS: Record<CosmeticSlot | 'ALL', string> = {
  ALL: 'Tất cả',
  HEAD: 'Đầu (HEAD)',
  FACE: 'Mặt (FACE)',
  NECK: 'Cổ (NECK)',
  BODY: 'Thân (BODY)',
  BACK: 'Lưng (BACK)',
  HAND_LEFT: 'Tay trái',
  HAND_RIGHT: 'Tay phải',
  FEET: 'Chân (FEET)',
  TAIL: 'Đuôi (TAIL)'
}

export function WardrobePage() {
  const companion = useCompanion()
  const [selectedSlot, setSelectedSlot] = useState<CosmeticSlot | 'ALL'>('ALL')

  const catalogItems = useMemo(
    () =>
      (Object.values(COSMETIC_CATALOG) as (typeof COSMETIC_CATALOG)[CosmeticItemId][]).filter(
        (item) => !item.fixture
      ),
    []
  )

  const filteredItems = useMemo(
    () =>
      selectedSlot === 'ALL'
        ? catalogItems
        : catalogItems.filter((item) => item.slot === selectedSlot),
    [catalogItems, selectedSlot]
  )

  const equippedCount = Object.keys(companion.equippedCosmetics).length

  return (
    <div className={styles.stack}>
      <div className={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={22} color="#F26B3A" aria-hidden="true" />
          <h1 className={styles.heading}>Tủ đồ Fox V2 (H1/H2)</h1>
          <Chip tone="reward">PREVIEW ONLY</Chip>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={companion.resetCosmetics}
          disabled={equippedCount === 0}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Khôi phục mặc định ({equippedCount})</span>
        </Button>
      </div>

      <div className={styles.previewBanner} role="note">
        <strong>Chế độ xem trước 3D (Preview-Only):</strong> Backend <code>develop</code> chưa hợp
        nhất API lưu trang phục (<code>feature/friends-and-social</code>). Thay đổi trang phục tại
        đây dùng đúng điểm gắn kết H1/H2 nhưng chưa lưu vĩnh viễn hay thực hiện mua/mở khóa.
      </div>

      <div className={styles.layout}>
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Xem trước 3D tương tác</h2>
          <FoxCompanionView
            presentation="full"
            label="Xem trước tủ đồ Fox V2 3D"
            orbit
          />
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--lq-ink-secondary)' }}>
            Kéo để xoay 360° • Đang thử {equippedCount} món phụ kiện trên khung xương chuẩn Fox V2.
          </p>
        </Card>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Bộ trang phục H2</h2>
          <div className={styles.presets} aria-label="Bộ trang phục gợi ý">
            {(Object.keys(OUTFIT_LIBRARY) as OutfitId[]).map((outfitId) => (
              <Button
                key={outfitId}
                variant="subtle"
                size="sm"
                onClick={() => companion.applyOutfit(outfitId)}
              >
                {OUTFIT_LIBRARY[outfitId].name}
              </Button>
            ))}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
            Danh mục phụ kiện ({filteredItems.length})
          </h2>

          <div className={styles.slotBar} role="tablist" aria-label="Lọc theo vị trí gắn">
            {(['ALL', ...COSMETIC_SLOTS] as const)
              .filter(
                (slot) =>
                  slot === 'ALL' || catalogItems.some((item) => item.slot === slot)
              )
              .map((slot) => (
                <button
                  key={slot}
                  type="button"
                  role="tab"
                  aria-selected={selectedSlot === slot}
                  className={`${styles.slotBtn} ${selectedSlot === slot ? styles.slotBtnActive : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {SLOT_LABELS[slot]}
                </button>
              ))}
          </div>

          <div className={styles.catalogGrid} data-testid="wardrobe-catalog-grid">
            {filteredItems.map((item) => {
              const itemId = item.id as CosmeticItemId
              const isEquipped = companion.equippedCosmetics[item.slot] === itemId
              return (
                <div
                  key={item.id}
                  className={`${styles.itemCard} ${isEquipped ? styles.itemEquipped : ''}`}
                  data-testid="wardrobe-item-card"
                >
                  <div>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      Slot: {item.slot} {item.socket ? `• Socket: ${item.socket}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip tone={isEquipped ? 'success' : 'neutral'}>
                      {isEquipped ? 'Đang thử' : 'Xem trước'}
                    </Chip>
                    <Button
                      variant={isEquipped ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() =>
                        isEquipped
                          ? companion.unequipSlot(item.slot)
                          : companion.equipCosmetic(itemId)
                      }
                    >
                      {isEquipped ? 'Tháo' : 'Thử ngay'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
