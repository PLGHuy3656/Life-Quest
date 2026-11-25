import {
  COSMETIC_CATALOG,
  OUTFIT_LIBRARY,
  OUTFIT_PRESETS,
  SLOT_DEFAULTS,
  type CosmeticItemDef,
  type CosmeticItemId,
  type CosmeticSlot,
  type OutfitId
} from '@/mascot/cosmetics/cosmeticContract'

/**
 * Primary Claude-reference categories mapped strictly to real Gate I Fox V2 slots.
 * No unsupported slots are invented.
 */
export type WardrobeCategoryId = 'ALL' | 'HAT' | 'SCARF' | 'BACKPACK' | 'OUTFIT' | 'ACCESSORY'

export interface WardrobeCategoryDef {
  id: WardrobeCategoryId
  label: string
  slots: readonly CosmeticSlot[]
  description: string
}

export const WARDROBE_CATEGORIES: readonly WardrobeCategoryDef[] = [
  {
    id: 'ALL',
    label: 'Tất cả',
    slots: ['HEAD', 'NECK', 'BACK', 'BODY', 'FACE', 'HAND_RIGHT', 'FEET'],
    description: 'Toàn bộ vật phẩm Gate I H1/H2 đã xác thực trên Fox V2'
  },
  {
    id: 'HAT',
    label: 'Mũ',
    slots: ['HEAD'],
    description: 'Mũ và băng đô gắn lên khớp HEAD / ATT_HAT'
  },
  {
    id: 'SCARF',
    label: 'Khăn',
    slots: ['NECK'],
    description: 'Khăn quàng cổ (hiện sử dụng khăn đỏ mặc định của Fox V2)'
  },
  {
    id: 'BACKPACK',
    label: 'Balo',
    slots: ['BACK'],
    description: 'Balo, áo choàng và cuộn bí kíp thay thế balo mặc định'
  },
  {
    id: 'OUTFIT',
    label: 'Trang phục',
    slots: ['BODY'],
    description: 'Áo khoác, áo đấu, võ phục và áo dài theo khung xương thân Fox'
  },
  {
    id: 'ACCESSORY',
    label: 'Phụ kiện',
    slots: ['FACE', 'HAND_RIGHT', 'FEET'],
    description: 'Kính mắt, phụ kiện cầm tay và giày thể thao'
  }
]

export const SLOT_DISPLAY_LABELS: Record<CosmeticSlot, string> = {
  HEAD: 'Mũ / Đầu (HEAD)',
  FACE: 'Mặt (FACE)',
  NECK: 'Khăn / Cổ (NECK)',
  BODY: 'Trang phục (BODY)',
  BACK: 'Balo / Lưng (BACK)',
  HAND_LEFT: 'Tay trái (HAND_LEFT)',
  HAND_RIGHT: 'Tay phải (HAND_RIGHT)',
  FEET: 'Giày / Chân (FEET)',
  TAIL: 'Đuôi (TAIL)'
}

export type CosmeticOwnershipStatus = 'DEFAULT_INCLUDED' | 'UNVERIFIED_PENDING_API'
export type CosmeticPriceStatus = 'UNAVAILABLE_PENDING_API'

export interface WardrobeCatalogItem {
  id: CosmeticItemId
  def: CosmeticItemDef
  displayNameVi: string
  subtitleVi: string
  category: Exclude<WardrobeCategoryId, 'ALL'>
  slot: CosmeticSlot
  slotLabelVi: string
  outfitThemeId: OutfitId | null
  outfitThemeVi: string | null
  palette: readonly [string, string, string]
  iconKind:
    | 'cap'
    | 'headband'
    | 'safari'
    | 'mage_hat'
    | 'ninja_band'
    | 'khan_dong'
    | 'glasses'
    | 'jacket'
    | 'jersey'
    | 'ninja_gi'
    | 'ao_dai'
    | 'backpack'
    | 'capelet'
    | 'scroll'
    | 'magnifier'
    | 'wand'
    | 'lixi'
    | 'sneakers'
  replacesDefault: string | null
  ownershipStatus: CosmeticOwnershipStatus
  priceStatus: CosmeticPriceStatus
  unlockRequirementStatus: CosmeticPriceStatus
}

interface ItemMetadataOverride {
  displayNameVi: string
  subtitleVi: string
  category: Exclude<WardrobeCategoryId, 'ALL'>
  outfitThemeId: OutfitId | null
  palette: readonly [string, string, string]
  iconKind: WardrobeCatalogItem['iconKind']
  replacesDefault?: string
}

const OUTFIT_VI_NAMES: Record<OutfitId, string> = {
  outfit_student: 'Học sinh',
  outfit_sports: 'Thể thao',
  outfit_explorer: 'Thám hiểm',
  outfit_mage: 'Pháp sư',
  outfit_ninja: 'Ninja',
  outfit_tet: 'Tết'
}

const ITEM_METADATA: Partial<Record<CosmeticItemId, ItemMetadataOverride>> = {
  student_cap: {
    displayNameVi: 'Mũ lưỡi trai Học sinh',
    subtitleVi: 'Gắn khớp ATT_HAT • Che chỏm tóc mái',
    category: 'HAT',
    outfitThemeId: 'outfit_student',
    palette: ['#24406B', '#F26B3A', '#FFF4E8'],
    iconKind: 'cap'
  },
  sports_headband: {
    displayNameVi: 'Băng đô Thể thao',
    subtitleVi: 'Gắn khớp HEAD • Gọn gàng dưới tai cáo',
    category: 'HAT',
    outfitThemeId: 'outfit_sports',
    palette: ['#168C78', '#FAFAFA', '#1F6FD1'],
    iconKind: 'headband'
  },
  explorer_hat: {
    displayNameVi: 'Mũ Safari Thám hiểm',
    subtitleVi: 'Gắn khớp ATT_HAT • Vành rộng năng động',
    category: 'HAT',
    outfitThemeId: 'outfit_explorer',
    palette: ['#D8C08A', '#5E7A3A', '#8B5E34'],
    iconKind: 'safari'
  },
  mage_hat: {
    displayNameVi: 'Mũ Chóp Pháp sư',
    subtitleVi: 'Gắn khớp ATT_HAT • Chóp tím đính sao vàng',
    category: 'HAT',
    outfitThemeId: 'outfit_mage',
    palette: ['#4B2E83', '#F2C14E', '#6D49B3'],
    iconKind: 'mage_hat'
  },
  ninja_headband: {
    displayNameVi: 'Băng trán Ninja',
    subtitleVi: 'Gắn khớp HEAD • Đai xanh đậm kèm mảnh thép',
    category: 'HAT',
    outfitThemeId: 'outfit_ninja',
    palette: ['#1D2433', '#94A3B8', '#E0533A'],
    iconKind: 'ninja_band'
  },
  tet_khan_dong: {
    displayNameVi: 'Khăn đóng Tết',
    subtitleVi: 'Gắn khớp ATT_HAT • Đỏ son viền nhũ vàng',
    category: 'HAT',
    outfitThemeId: 'outfit_tet',
    palette: ['#C1121F', '#E9B949', '#FFF1D0'],
    iconKind: 'khan_dong'
  },
  explorer_backpack: {
    displayNameVi: 'Balo Thám hiểm',
    subtitleVi: 'Gắn khớp ATT_BACKPACK • Kèm bình nước & huy hiệu',
    category: 'BACKPACK',
    outfitThemeId: 'outfit_explorer',
    palette: ['#5E7A3A', '#C89B5E', '#D8C08A'],
    iconKind: 'backpack',
    replacesDefault: 'Balo mặc định'
  },
  mage_capelet: {
    displayNameVi: 'Áo choàng Pháp sư',
    subtitleVi: 'Phủ vai theo xương thân • Viền ánh vàng',
    category: 'BACKPACK',
    outfitThemeId: 'outfit_mage',
    palette: ['#5B3A9C', '#F2C14E', '#3A1F6B'],
    iconKind: 'capelet',
    replacesDefault: 'Balo mặc định'
  },
  ninja_scroll: {
    displayNameVi: 'Cuộn Bí kíp Ninja',
    subtitleVi: 'Gắn khớp ATT_BACKPACK • Đeo chéo sau lưng',
    category: 'BACKPACK',
    outfitThemeId: 'outfit_ninja',
    palette: ['#E9DEC9', '#6B4423', '#1D2433'],
    iconKind: 'scroll',
    replacesDefault: 'Balo mặc định'
  },
  simple_jacket: {
    displayNameVi: 'Áo khoác Xanh ngọc',
    subtitleVi: 'Trang phục thân trên • Khớp sẵn dây balo',
    category: 'OUTFIT',
    outfitThemeId: 'outfit_student',
    palette: ['#1E7F8C', '#24406B', '#E6F5F3'],
    iconKind: 'jacket'
  },
  sports_jersey: {
    displayNameVi: 'Áo đấu Thể thao',
    subtitleVi: 'Cổ chữ V năng động • Xanh dương viền vàng',
    category: 'OUTFIT',
    outfitThemeId: 'outfit_sports',
    palette: ['#1F6FD1', '#FAFAFA', '#F2C14E'],
    iconKind: 'jersey'
  },
  ninja_gi: {
    displayNameVi: 'Võ phục Ninja',
    subtitleVi: 'Áo than chì kèm đai lưng Obi',
    category: 'OUTFIT',
    outfitThemeId: 'outfit_ninja',
    palette: ['#2B2F3A', '#E0533A', '#1D2433'],
    iconKind: 'ninja_gi'
  },
  tet_ao_dai: {
    displayNameVi: 'Áo dài Tết',
    subtitleVi: 'Tay lỡ đỏ thắm • Họa tiết hoa mai vàng',
    category: 'OUTFIT',
    outfitThemeId: 'outfit_tet',
    palette: ['#C1121F', '#E9B949', '#FFE5B4'],
    iconKind: 'ao_dai'
  },
  student_glasses: {
    displayNameVi: 'Kính mắt Học sinh',
    subtitleVi: 'Gắn khớp ATT_GLASSES • Gọng tròn tri thức',
    category: 'ACCESSORY',
    outfitThemeId: 'outfit_student',
    palette: ['#24406B', '#A8DADC', '#1D3557'],
    iconKind: 'glasses'
  },
  explorer_magnifier: {
    displayNameVi: 'Kính lúp Thám hiểm',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Tự ẩn khi tay bận',
    category: 'ACCESSORY',
    outfitThemeId: 'outfit_explorer',
    palette: ['#8B5E34', '#D4A373', '#CBE8F6'],
    iconKind: 'magnifier'
  },
  mage_wand: {
    displayNameVi: 'Đũa phép Ngôi sao',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Đỉnh sao vàng',
    category: 'ACCESSORY',
    outfitThemeId: 'outfit_mage',
    palette: ['#6B4423', '#F2C14E', '#5B3A9C'],
    iconKind: 'wand'
  },
  tet_lixi: {
    displayNameVi: 'Bao Lì xì Tết',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Đỏ may mắn',
    category: 'ACCESSORY',
    outfitThemeId: 'outfit_tet',
    palette: ['#D0021B', '#E9B949', '#FFF1D0'],
    iconKind: 'lixi'
  },
  sports_sneakers: {
    displayNameVi: 'Giày Thể thao',
    subtitleVi: 'Khớp chân FOOT_L/R • Đế bám chuẩn sàn',
    category: 'ACCESSORY',
    outfitThemeId: 'outfit_sports',
    palette: ['#FAFAFA', '#168C78', '#1F6FD1'],
    iconKind: 'sneakers'
  }
}

export interface DefaultFoxAccessory {
  id: string
  slot: CosmeticSlot
  category: Exclude<WardrobeCategoryId, 'ALL'>
  displayNameVi: string
  subtitleVi: string
  palette: readonly [string, string, string]
  meshes: readonly string[]
}

/** Built-in default accessories on the approved Fox V2 model (visible when their slot is empty). */
export const DEFAULT_FOX_ACCESSORIES: readonly DefaultFoxAccessory[] = [
  {
    id: SLOT_DEFAULTS.NECK?.id ?? 'default_scarf',
    slot: 'NECK',
    category: 'SCARF',
    displayNameVi: 'Khăn quàng đỏ mặc định',
    subtitleVi: 'Phụ kiện nguyên bản của Fox V2 • Luôn được giữ trong bộ H1/H2',
    palette: ['#E0533A', '#F26B3A', '#FFF4E8'],
    meshes: SLOT_DEFAULTS.NECK?.meshes ?? []
  },
  {
    id: SLOT_DEFAULTS.BACK?.id ?? 'default_backpack',
    slot: 'BACK',
    category: 'BACKPACK',
    displayNameVi: 'Balo hành trình mặc định',
    subtitleVi: 'Phụ kiện nguyên bản của Fox V2 • Tự ẩn khi thử món ở ô BACK',
    palette: ['#24406B', '#D8C08A', '#F26B3A'],
    meshes: SLOT_DEFAULTS.BACK?.meshes ?? []
  }
]

/** Verified non-fixture Gate I H1/H2 cosmetic catalog items (18 real GLBs). */
export const WARDROBE_CATALOG_ITEMS: readonly WardrobeCatalogItem[] = (
  Object.values(COSMETIC_CATALOG) as CosmeticItemDef[]
)
  .filter((item) => !item.fixture)
  .map((def) => {
    const id = def.id as CosmeticItemId
    const meta = ITEM_METADATA[id]
    const category: Exclude<WardrobeCategoryId, 'ALL'> =
      meta?.category ??
      (def.slot === 'HEAD'
        ? 'HAT'
        : def.slot === 'NECK'
          ? 'SCARF'
          : def.slot === 'BACK'
            ? 'BACKPACK'
            : def.slot === 'BODY'
              ? 'OUTFIT'
              : 'ACCESSORY')

    return {
      id,
      def,
      displayNameVi: meta?.displayNameVi ?? def.name,
      subtitleVi: meta?.subtitleVi ?? `Khớp ${def.socket ?? def.slot}`,
      category,
      slot: def.slot,
      slotLabelVi: SLOT_DISPLAY_LABELS[def.slot],
      outfitThemeId: meta?.outfitThemeId ?? null,
      outfitThemeVi: meta?.outfitThemeId ? OUTFIT_VI_NAMES[meta.outfitThemeId] : null,
      palette: meta?.palette ?? ['#16324A', '#F26B3A', '#FFF4E8'],
      iconKind: meta?.iconKind ?? 'cap',
      replacesDefault: meta?.replacesDefault ?? null,
      ownershipStatus: 'UNVERIFIED_PENDING_API',
      priceStatus: 'UNAVAILABLE_PENDING_API',
      unlockRequirementStatus: 'UNAVAILABLE_PENDING_API'
    }
  })

export interface WardrobeOutfitPresetInfo {
  id: OutfitId
  name: string
  nameVi: string
  palette: readonly string[]
  slots: Partial<Record<CosmeticSlot, CosmeticItemId>>
  itemCount: number
}

export const WARDROBE_OUTFIT_PRESETS: readonly WardrobeOutfitPresetInfo[] = (
  Object.keys(OUTFIT_LIBRARY) as OutfitId[]
).map((id) => {
  const lib = OUTFIT_LIBRARY[id]
  const slots = OUTFIT_PRESETS[id] as Partial<Record<CosmeticSlot, CosmeticItemId>>
  return {
    id,
    name: lib.name,
    nameVi: OUTFIT_VI_NAMES[id],
    palette: lib.palette,
    slots,
    itemCount: Object.keys(slots).length
  }
})

export function filterCatalogByCategory(
  items: readonly WardrobeCatalogItem[],
  category: WardrobeCategoryId
): WardrobeCatalogItem[] {
  if (category === 'ALL') return [...items]
  return items.filter((item) => item.category === category)
}

export function getCatalogItemById(id: CosmeticItemId): WardrobeCatalogItem | undefined {
  return WARDROBE_CATALOG_ITEMS.find((item) => item.id === id)
}
