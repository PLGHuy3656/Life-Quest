import type { CosmeticSlot, OutfitThemeId, WardrobeProfileSnapshot } from '../domain/types.js'

export interface FoxCosmeticCatalogItem {
  itemId: string
  displayNameVi: string
  slot: CosmeticSlot
  outfitThemeId: OutfitThemeId
  outfitThemeVi: string
  priceCoin: number
  requiredLevel: number
  behaviorTags: Array<'study' | 'sports' | 'explorer' | 'coding' | 'general'>
}

/**
 * 1:1 aligned with real Fox V2 Gate H1/H2 cosmetics in
 * front-end/src/mascot/cosmetics/cosmeticContract.ts & wardrobeCatalog.ts
 */
export const FOX_COSMETIC_SHOP_CATALOG: readonly FoxCosmeticCatalogItem[] = [
  // Outfit: Student (Học Giả)
  {
    itemId: 'student_cap',
    displayNameVi: 'Mũ Học Sinh',
    slot: 'HEAD',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Bộ Học Giả (Student)',
    priceCoin: 100,
    requiredLevel: 1,
    behaviorTags: ['study', 'coding']
  },
  {
    itemId: 'student_glasses',
    displayNameVi: 'Kính Học Giả',
    slot: 'FACE',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Bộ Học Giả (Student)',
    priceCoin: 120,
    requiredLevel: 1,
    behaviorTags: ['study', 'coding']
  },
  {
    itemId: 'simple_jacket',
    displayNameVi: 'Áo Khoác Sinh Viên',
    slot: 'BODY',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Bộ Học Giả (Student)',
    priceCoin: 180,
    requiredLevel: 2,
    behaviorTags: ['study', 'general']
  },

  // Outfit: Sports (Thể Thao)
  {
    itemId: 'sports_headband',
    displayNameVi: 'Băng Đô Thể Thao',
    slot: 'HEAD',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Bộ Năng Động (Sports)',
    priceCoin: 90,
    requiredLevel: 1,
    behaviorTags: ['sports']
  },
  {
    itemId: 'sports_jersey',
    displayNameVi: 'Áo Đấu Thể Thao',
    slot: 'BODY',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Bộ Năng Động (Sports)',
    priceCoin: 160,
    requiredLevel: 2,
    behaviorTags: ['sports']
  },
  {
    itemId: 'sports_sneakers',
    displayNameVi: 'Giày Chạy Bộ Fox',
    slot: 'FEET',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Bộ Năng Động (Sports)',
    priceCoin: 140,
    requiredLevel: 2,
    behaviorTags: ['sports']
  },

  // Outfit: Explorer (Thám Hiểm)
  {
    itemId: 'explorer_hat',
    displayNameVi: 'Mũ Safari Thám Hiểm',
    slot: 'HEAD',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Bộ Thám Hiểm (Explorer)',
    priceCoin: 150,
    requiredLevel: 3,
    behaviorTags: ['explorer', 'general']
  },
  {
    itemId: 'explorer_backpack',
    displayNameVi: 'Balo Thám Hiểm',
    slot: 'BACK',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Bộ Thám Hiểm (Explorer)',
    priceCoin: 200,
    requiredLevel: 3,
    behaviorTags: ['explorer', 'study']
  },
  {
    itemId: 'explorer_magnifier',
    displayNameVi: 'Kính Lúp Trinh Thám',
    slot: 'HAND_RIGHT',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Bộ Thám Hiểm (Explorer)',
    priceCoin: 130,
    requiredLevel: 3,
    behaviorTags: ['explorer', 'coding']
  },

  // Outfit: Mage (Pháp Sư Tri Thức)
  {
    itemId: 'mage_hat',
    displayNameVi: 'Mũ Pháp Sư Tri Thức',
    slot: 'HEAD',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Bộ Pháp Sư (Mage)',
    priceCoin: 260,
    requiredLevel: 5,
    behaviorTags: ['coding', 'study']
  },
  {
    itemId: 'mage_capelet',
    displayNameVi: 'Áo Choàng Pháp Sư',
    slot: 'BACK',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Bộ Pháp Sư (Mage)',
    priceCoin: 280,
    requiredLevel: 5,
    behaviorTags: ['coding', 'study']
  },
  {
    itemId: 'mage_wand',
    displayNameVi: 'Quyền Trượng Tập Trung',
    slot: 'HAND_RIGHT',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Bộ Pháp Sư (Mage)',
    priceCoin: 240,
    requiredLevel: 5,
    behaviorTags: ['coding']
  },

  // Outfit: Ninja (Tốc Độ)
  {
    itemId: 'ninja_headband',
    displayNameVi: 'Băng Đô Ninja',
    slot: 'HEAD',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Bộ Ninja Tập Trung',
    priceCoin: 220,
    requiredLevel: 4,
    behaviorTags: ['coding', 'sports']
  },
  {
    itemId: 'ninja_gi',
    displayNameVi: 'Võ Phục Ninja',
    slot: 'BODY',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Bộ Ninja Tập Trung',
    priceCoin: 260,
    requiredLevel: 4,
    behaviorTags: ['sports', 'coding']
  },
  {
    itemId: 'ninja_scroll',
    displayNameVi: 'Cuộn Bí Kíp Kỷ Luật',
    slot: 'BACK',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Bộ Ninja Tập Trung',
    priceCoin: 210,
    requiredLevel: 4,
    behaviorTags: ['coding', 'study']
  },

  // Outfit: Tet (Lễ Hội)
  {
    itemId: 'tet_khan_dong',
    displayNameVi: 'Khăn Đóng Tết',
    slot: 'HEAD',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Bộ Áo Dài Tết',
    priceCoin: 190,
    requiredLevel: 1,
    behaviorTags: ['general']
  },
  {
    itemId: 'tet_ao_dai',
    displayNameVi: 'Áo Dài Tết Fox',
    slot: 'BODY',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Bộ Áo Dài Tết',
    priceCoin: 300,
    requiredLevel: 1,
    behaviorTags: ['general']
  },
  {
    itemId: 'tet_lixi',
    displayNameVi: 'Bao Lì Xì May Mắn',
    slot: 'HAND_RIGHT',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Bộ Áo Dài Tết',
    priceCoin: 110,
    requiredLevel: 1,
    behaviorTags: ['general']
  }
]

/**
 * Realistic mock wardrobe profile: user already owns 2/3 of `outfit_student`
 * (`student_cap`, `simple_jacket`), has 320 Coins, level 4, and strong Study/Focus + Sports habits.
 * Triggers high-value set-completion recommendation for `student_glasses` (FACE slot empty!).
 */
export function getMockWardrobeProfile(): WardrobeProfileSnapshot {
  return {
    ownedItemIds: ['student_cap', 'simple_jacket'],
    equippedSlots: {
      HEAD: 'student_cap',
      BODY: 'simple_jacket'
    },
    coinBalance: 320,
    userLevel: 4,
    dominantCategories: ['study', 'coding', 'sports']
  }
}
