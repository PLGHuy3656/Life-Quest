import { CosmeticIconKind } from '../components/common/CosmeticPreviewThumb'

export type CosmeticSlot = 'HEAD' | 'FACE' | 'NECK' | 'BODY' | 'BACK' | 'HAND_RIGHT' | 'FEET'

export type WardrobeCategoryId = 'ALL' | 'HAT' | 'SCARF' | 'BACKPACK' | 'OUTFIT' | 'ACCESSORY'

export interface WardrobeCategoryDef {
  id: WardrobeCategoryId
  label: string
  description: string
}

export const WARDROBE_CATEGORIES: readonly WardrobeCategoryDef[] = [
  { id: 'ALL', label: 'Tất cả', description: 'Toàn bộ vật phẩm Gate I H1/H2 đã xác thực trên Fox V2' },
  { id: 'HAT', label: 'Mũ', description: 'Mũ và băng đô gắn lên khớp HEAD' },
  { id: 'SCARF', label: 'Khăn', description: 'Khăn quàng cổ nguyên bản của Fox V2' },
  { id: 'BACKPACK', label: 'Balo', description: 'Balo, áo choàng và cuộn bí kíp sau lưng' },
  { id: 'OUTFIT', label: 'Trang phục', description: 'Áo khoác, áo đấu, võ phục và áo dài' },
  { id: 'ACCESSORY', label: 'Phụ kiện', description: 'Kính mắt, vật phẩm cầm tay và giày thể thao' }
]

export type OutfitId = 'outfit_student' | 'outfit_sports' | 'outfit_explorer' | 'outfit_mage' | 'outfit_ninja' | 'outfit_tet'

export interface OutfitPreset {
  id: OutfitId
  nameVi: string
  theme: string
  palette: readonly [string, string, string]
  buff: string
  slots: Partial<Record<CosmeticSlot, string>>
}

export const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: 'outfit_student',
    nameVi: 'Bộ Học Sinh',
    theme: 'Trường học & Tri thức',
    palette: ['#24406B', '#1E7F8C', '#F26B3A'],
    buff: '+10% XP Học tập & Đọc sách',
    slots: { HEAD: 'student_cap', BODY: 'simple_jacket', FACE: 'student_glasses' }
  },
  {
    id: 'outfit_sports',
    nameVi: 'Bộ Thể Thao',
    theme: 'Vận động & Năng động',
    palette: ['#168C78', '#1F6FD1', '#FAFAFA'],
    buff: '+10% STR & Bền bỉ thể chất',
    slots: { HEAD: 'sports_headband', BODY: 'sports_jersey', FEET: 'sports_sneakers' }
  },
  {
    id: 'outfit_explorer',
    nameVi: 'Bộ Thám Hiểm',
    theme: 'Phiêu lưu & Khám phá',
    palette: ['#D8C08A', '#5E7A3A', '#C89B5E'],
    buff: '+15% Tốc độ Pomodoro',
    slots: { HEAD: 'explorer_hat', BACK: 'explorer_backpack', HAND_RIGHT: 'explorer_magnifier' }
  },
  {
    id: 'outfit_mage',
    nameVi: 'Bộ Pháp Sư',
    theme: 'Phép thuật & Tinh anh',
    palette: ['#4B2E83', '#5B3A9C', '#F2C14E'],
    buff: '+12% XP Toàn diện',
    slots: { HEAD: 'mage_hat', BACK: 'mage_capelet', HAND_RIGHT: 'mage_wand' }
  },
  {
    id: 'outfit_ninja',
    nameVi: 'Bộ Ninja',
    theme: 'Tập trung & Ẩn thân',
    palette: ['#1D2433', '#2B2F3A', '#E0533A'],
    buff: '+10% Sát thương Boss Trì Hoãn',
    slots: { HEAD: 'ninja_headband', BODY: 'ninja_gi', BACK: 'ninja_scroll' }
  },
  {
    id: 'outfit_tet',
    nameVi: 'Bộ Tết Cổ Truyền',
    theme: 'Tết Giáp Thìn - Việt Nam',
    palette: ['#C1121F', '#E9B949', '#D0021B'],
    buff: '+20% Vàng Thưởng mọi nhiệm vụ',
    slots: { HEAD: 'tet_khan_dong', BODY: 'tet_ao_dai', HAND_RIGHT: 'tet_lixi' }
  }
]

export interface WardrobeCatalogItem {
  id: string
  displayNameVi: string
  subtitleVi: string
  category: Exclude<WardrobeCategoryId, 'ALL'>
  slot: CosmeticSlot
  slotLabelVi: string
  outfitThemeId: OutfitId | null
  outfitThemeVi: string | null
  palette: readonly [string, string, string]
  iconKind: CosmeticIconKind
  price: number
  unlocked: boolean
  equipped: boolean
  buffText: string
}

export const EXACT_WARDROBE_CATALOG: WardrobeCatalogItem[] = [
  // --- MŨ (HAT) ---
  {
    id: 'student_cap',
    displayNameVi: 'Mũ lưỡi trai Học sinh',
    subtitleVi: 'Gắn khớp ATT_HAT • Che chỏm tóc mái',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Học sinh',
    palette: ['#24406B', '#F26B3A', '#FFF4E8'],
    iconKind: 'cap',
    price: 0,
    unlocked: true,
    equipped: true,
    buffText: '+5% XP học tập'
  },
  {
    id: 'sports_headband',
    displayNameVi: 'Băng đô Thể thao',
    subtitleVi: 'Gắn khớp HEAD • Gọn gàng dưới tai cáo',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Thể thao',
    palette: ['#168C78', '#FAFAFA', '#1F6FD1'],
    iconKind: 'headband',
    price: 120,
    unlocked: false,
    equipped: false,
    buffText: '+5% Năng lượng vận động'
  },
  {
    id: 'explorer_hat',
    displayNameVi: 'Mũ Safari Thám hiểm',
    subtitleVi: 'Gắn khớp ATT_HAT • Vành rộng năng động',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Thám hiểm',
    palette: ['#D8C08A', '#5E7A3A', '#8B5E34'],
    iconKind: 'safari',
    price: 150,
    unlocked: false,
    equipped: false,
    buffText: '+5% Kháng mỏi mệt'
  },
  {
    id: 'mage_hat',
    displayNameVi: 'Mũ Chóp Pháp sư',
    subtitleVi: 'Gắn khớp ATT_HAT • Chóp tím đính sao vàng',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Pháp sư',
    palette: ['#4B2E83', '#F2C14E', '#6D49B3'],
    iconKind: 'mage_hat',
    price: 250,
    unlocked: false,
    equipped: false,
    buffText: '+8% XP nhiệm vụ khó'
  },
  {
    id: 'ninja_headband',
    displayNameVi: 'Băng trán Ninja',
    subtitleVi: 'Gắn khớp HEAD • Đai xanh đậm kèm mảnh thép',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Ninja',
    palette: ['#1D2433', '#94A3B8', '#E0533A'],
    iconKind: 'ninja_band',
    price: 220,
    unlocked: false,
    equipped: false,
    buffText: '+5% Boss DMG'
  },
  {
    id: 'tet_khan_dong',
    displayNameVi: 'Khăn đóng Tết',
    subtitleVi: 'Gắn khớp ATT_HAT • Đỏ son viền nhũ vàng',
    category: 'HAT',
    slot: 'HEAD',
    slotLabelVi: 'Mũ / Đầu (HEAD)',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Tết',
    palette: ['#C1121F', '#E9B949', '#FFF1D0'],
    iconKind: 'khan_dong',
    price: 300,
    unlocked: false,
    equipped: false,
    buffText: '+10% Vàng thưởng'
  },

  // --- KHĂN (SCARF) ---
  {
    id: 'default_scarf',
    displayNameVi: 'Khăn quàng đỏ mặc định',
    subtitleVi: 'Phụ kiện nguyên bản của Fox V2 • Luôn giữ trong bộ H1/H2',
    category: 'SCARF',
    slot: 'NECK',
    slotLabelVi: 'Khăn / Cổ (NECK)',
    outfitThemeId: null,
    outfitThemeVi: null,
    palette: ['#E0533A', '#F26B3A', '#FFF4E8'],
    iconKind: 'default_scarf',
    price: 0,
    unlocked: true,
    equipped: true,
    buffText: 'Thương hiệu Kitsu'
  },

  // --- BALO (BACKPACK) ---
  {
    id: 'default_backpack',
    displayNameVi: 'Balo hành trình mặc định',
    subtitleVi: 'Phụ kiện nguyên bản của Fox V2 • Tự ẩn khi thử món ở ô BACK',
    category: 'BACKPACK',
    slot: 'BACK',
    slotLabelVi: 'Balo / Lưng (BACK)',
    outfitThemeId: null,
    outfitThemeVi: null,
    palette: ['#24406B', '#D8C08A', '#F26B3A'],
    iconKind: 'default_backpack',
    price: 0,
    unlocked: true,
    equipped: true,
    buffText: 'Sức chứa tiêu chuẩn'
  },
  {
    id: 'explorer_backpack',
    displayNameVi: 'Balo Thám hiểm',
    subtitleVi: 'Gắn khớp ATT_BACKPACK • Kèm bình nước & huy hiệu',
    category: 'BACKPACK',
    slot: 'BACK',
    slotLabelVi: 'Balo / Lưng (BACK)',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Thám hiểm',
    palette: ['#5E7A3A', '#C89B5E', '#D8C08A'],
    iconKind: 'backpack',
    price: 180,
    unlocked: false,
    equipped: false,
    buffText: '+10% Sức bền Pomodoro'
  },
  {
    id: 'mage_capelet',
    displayNameVi: 'Áo choàng Pháp sư',
    subtitleVi: 'Phủ vai theo xương thân • Viền ánh vàng',
    category: 'BACKPACK',
    slot: 'BACK',
    slotLabelVi: 'Balo / Lưng (BACK)',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Pháp sư',
    palette: ['#5B3A9C', '#F2C14E', '#3A1F6B'],
    iconKind: 'capelet',
    price: 240,
    unlocked: false,
    equipped: false,
    buffText: '+8% Tốc độ hồi phục Mana'
  },
  {
    id: 'ninja_scroll',
    displayNameVi: 'Cuộn Bí kíp Ninja',
    subtitleVi: 'Gắn khớp ATT_BACKPACK • Đeo chéo sau lưng',
    category: 'BACKPACK',
    slot: 'BACK',
    slotLabelVi: 'Balo / Lưng (BACK)',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Ninja',
    palette: ['#E9DEC9', '#6B4423', '#1D2433'],
    iconKind: 'scroll',
    price: 210,
    unlocked: false,
    equipped: false,
    buffText: '+5% Tỉ lệ bạo kích XP'
  },

  // --- TRANG PHỤC (OUTFIT) ---
  {
    id: 'simple_jacket',
    displayNameVi: 'Áo khoác Xanh ngọc',
    subtitleVi: 'Trang phục thân trên • Khớp sẵn dây balo',
    category: 'OUTFIT',
    slot: 'BODY',
    slotLabelVi: 'Trang phục (BODY)',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Học sinh',
    palette: ['#1E7F8C', '#24406B', '#E6F5F3'],
    iconKind: 'jacket',
    price: 0,
    unlocked: true,
    equipped: true,
    buffText: '+5% XP thói quen'
  },
  {
    id: 'sports_jersey',
    displayNameVi: 'Áo đấu Thể thao',
    subtitleVi: 'Cổ chữ V năng động • Xanh dương viền vàng',
    category: 'OUTFIT',
    slot: 'BODY',
    slotLabelVi: 'Trang phục (BODY)',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Thể thao',
    palette: ['#1F6FD1', '#FAFAFA', '#F2C14E'],
    iconKind: 'jersey',
    price: 180,
    unlocked: false,
    equipped: false,
    buffText: '+10% STR & Vận động'
  },
  {
    id: 'ninja_gi',
    displayNameVi: 'Võ phục Ninja',
    subtitleVi: 'Áo than chì kèm đai lưng Obi',
    category: 'OUTFIT',
    slot: 'BODY',
    slotLabelVi: 'Trang phục (BODY)',
    outfitThemeId: 'outfit_ninja',
    outfitThemeVi: 'Ninja',
    palette: ['#2B2F3A', '#E0533A', '#1D2433'],
    iconKind: 'ninja_gi',
    price: 260,
    unlocked: false,
    equipped: false,
    buffText: '+8% Khắc chế trì hoãn'
  },
  {
    id: 'tet_ao_dai',
    displayNameVi: 'Áo dài Tết',
    subtitleVi: 'Tay lỡ đỏ thắm • Họa tiết hoa mai vàng',
    category: 'OUTFIT',
    slot: 'BODY',
    slotLabelVi: 'Trang phục (BODY)',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Tết',
    palette: ['#C1121F', '#E9B949', '#FFE5B4'],
    iconKind: 'ao_dai',
    price: 350,
    unlocked: false,
    equipped: false,
    buffText: '+15% Vàng thưởng nhiệm vụ'
  },

  // --- PHỤ KIỆN (ACCESSORY) ---
  {
    id: 'student_glasses',
    displayNameVi: 'Kính mắt Học sinh',
    subtitleVi: 'Gắn khớp ATT_GLASSES • Gọng tròn tri thức',
    category: 'ACCESSORY',
    slot: 'FACE',
    slotLabelVi: 'Mặt (FACE)',
    outfitThemeId: 'outfit_student',
    outfitThemeVi: 'Học sinh',
    palette: ['#24406B', '#A8DADC', '#1D3557'],
    iconKind: 'glasses',
    price: 90,
    unlocked: true,
    equipped: true,
    buffText: '+5% Tập trung'
  },
  {
    id: 'explorer_magnifier',
    displayNameVi: 'Kính lúp Thám hiểm',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Tự ẩn khi tay bận',
    category: 'ACCESSORY',
    slot: 'HAND_RIGHT',
    slotLabelVi: 'Tay phải (HAND_RIGHT)',
    outfitThemeId: 'outfit_explorer',
    outfitThemeVi: 'Thám hiểm',
    palette: ['#8B5E34', '#D4A373', '#CBE8F6'],
    iconKind: 'magnifier',
    price: 130,
    unlocked: false,
    equipped: false,
    buffText: '+5% Tỉ lệ tìm đồ hiếm'
  },
  {
    id: 'mage_wand',
    displayNameVi: 'Đũa phép Ngôi sao',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Đỉnh sao vàng',
    category: 'ACCESSORY',
    slot: 'HAND_RIGHT',
    slotLabelVi: 'Tay phải (HAND_RIGHT)',
    outfitThemeId: 'outfit_mage',
    outfitThemeVi: 'Pháp sư',
    palette: ['#6B4423', '#F2C14E', '#5B3A9C'],
    iconKind: 'wand',
    price: 220,
    unlocked: false,
    equipped: false,
    buffText: '+8% Tăng trưởng XP'
  },
  {
    id: 'tet_lixi',
    displayNameVi: 'Bao Lì xì Tết',
    subtitleVi: 'Cầm tay phải ATT_HAND_R • Đỏ may mắn',
    category: 'ACCESSORY',
    slot: 'HAND_RIGHT',
    slotLabelVi: 'Tay phải (HAND_RIGHT)',
    outfitThemeId: 'outfit_tet',
    outfitThemeVi: 'Tết',
    palette: ['#D0021B', '#E9B949', '#FFF1D0'],
    iconKind: 'lixi',
    price: 100,
    unlocked: false,
    equipped: false,
    buffText: '+10% May mắn'
  },
  {
    id: 'sports_sneakers',
    displayNameVi: 'Giày Thể thao',
    subtitleVi: 'Khớp chân FOOT_L/R • Đế bám chuẩn sàn',
    category: 'ACCESSORY',
    slot: 'FEET',
    slotLabelVi: 'Giày / Chân (FEET)',
    outfitThemeId: 'outfit_sports',
    outfitThemeVi: 'Thể thao',
    palette: ['#FAFAFA', '#168C78', '#1F6FD1'],
    iconKind: 'sneakers',
    price: 160,
    unlocked: false,
    equipped: false,
    buffText: '+5% Tốc độ hoàn thành'
  }
]
