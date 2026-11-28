import type { CosmeticItemId } from '@/mascot/cosmetics/cosmeticContract'
import type { CoinTransactionRecord } from '@/services/api/gamificationApi'

export type ShopCategoryId = 'fox' | 'profile' | 'messages' | 'album'

export type ShopItemOwnership = 'OWNED' | 'EQUIPPED' | 'AVAILABLE'

export type PurchaseUiState =
  | 'preview'
  | 'confirm'
  | 'insufficient_coins'
  | 'level_locked'
  | 'owned'
  | 'equipped'
  | 'success_simulated'
  | 'failed'
  | 'api_unavailable'

export interface ShopCatalogPreviewMeta {
  priceCoin: number
  requiredLevel: number
  previewOwnership: ShopItemOwnership
}

const DEFAULT_FOX_SHOP_META: ShopCatalogPreviewMeta = {
  priceCoin: 200,
  requiredLevel: 1,
  previewOwnership: 'AVAILABLE',
}

/**
 * Preview-only price & level metadata mapped strictly to verified Gate I Fox V2 items.
 * Real prices and ownership remain authoritative on Backend once R1-R3 are resolved.
 */
export const FOX_SHOP_PREVIEW_META: Partial<Record<CosmeticItemId, ShopCatalogPreviewMeta>> = {
  student_cap: { priceCoin: 120, requiredLevel: 1, previewOwnership: 'OWNED' },
  student_glasses: { priceCoin: 90, requiredLevel: 1, previewOwnership: 'EQUIPPED' },
  simple_jacket: { priceCoin: 260, requiredLevel: 2, previewOwnership: 'AVAILABLE' },
  sports_headband: { priceCoin: 110, requiredLevel: 1, previewOwnership: 'OWNED' },
  sports_jersey: { priceCoin: 280, requiredLevel: 3, previewOwnership: 'AVAILABLE' },
  sports_sneakers: { priceCoin: 220, requiredLevel: 3, previewOwnership: 'AVAILABLE' },
  explorer_hat: { priceCoin: 240, requiredLevel: 4, previewOwnership: 'EQUIPPED' },
  explorer_backpack: { priceCoin: 320, requiredLevel: 4, previewOwnership: 'OWNED' },
  explorer_magnifier: { priceCoin: 190, requiredLevel: 5, previewOwnership: 'AVAILABLE' },
  mage_hat: { priceCoin: 420, requiredLevel: 8, previewOwnership: 'AVAILABLE' },
  mage_capelet: { priceCoin: 480, requiredLevel: 10, previewOwnership: 'AVAILABLE' },
  mage_wand: { priceCoin: 360, requiredLevel: 8, previewOwnership: 'AVAILABLE' },
  ninja_headband: { priceCoin: 300, requiredLevel: 6, previewOwnership: 'AVAILABLE' },
  ninja_gi: { priceCoin: 520, requiredLevel: 12, previewOwnership: 'AVAILABLE' },
  ninja_scroll: { priceCoin: 340, requiredLevel: 7, previewOwnership: 'AVAILABLE' },
  tet_khan_dong: { priceCoin: 560, requiredLevel: 15, previewOwnership: 'AVAILABLE' },
  tet_ao_dai: { priceCoin: 680, requiredLevel: 15, previewOwnership: 'AVAILABLE' },
  tet_lixi: { priceCoin: 250, requiredLevel: 5, previewOwnership: 'AVAILABLE' },
}

export function getFoxShopMeta(id: CosmeticItemId): ShopCatalogPreviewMeta {
  return FOX_SHOP_PREVIEW_META[id] ?? DEFAULT_FOX_SHOP_META
}

export interface AvatarFrameItem {
  id: string
  name: string
  description: string
  priceCoin: number
  requiredLevel: number
  previewOwnership: ShopItemOwnership
  ringGradient: string
  accentHex: string
  badgeGlyph: string
}

export const PROFILE_AVATAR_FRAMES: readonly AvatarFrameItem[] = [
  {
    id: 'frame-forest-compass',
    name: 'Khung La Bàn Rừng Xanh',
    description: 'Viền xanh ngọc tĩnh kèm điểm nhấn vàng đồng nhẹ nhàng.',
    priceCoin: 150,
    requiredLevel: 1,
    previewOwnership: 'EQUIPPED',
    ringGradient: 'linear-gradient(135deg, #168C78 0%, #2EC4A6 55%, #D99B1E 100%)',
    accentHex: '#168C78',
    badgeGlyph: '✦',
  },
  {
    id: 'frame-sunrise-trail',
    name: 'Khung Bình Minh Săn Quest',
    description: 'Tông cam ấm chuyển sắc lấy cảm hứng từ cung đường sáng sớm.',
    priceCoin: 220,
    requiredLevel: 3,
    previewOwnership: 'OWNED',
    ringGradient: 'linear-gradient(135deg, #F26B3A 0%, #FFB057 55%, #FFE3A3 100%)',
    accentHex: '#F26B3A',
    badgeGlyph: '☀',
  },
  {
    id: 'frame-navy-journal',
    name: 'Khung Bìa Sổ Nhật Ký',
    description: 'Viền xanh navy cổ điển với đường chỉ khâu kem tinh tế.',
    priceCoin: 260,
    requiredLevel: 5,
    previewOwnership: 'AVAILABLE',
    ringGradient: 'linear-gradient(135deg, #16324A 0%, #34628A 60%, #FBF7EF 100%)',
    accentHex: '#16324A',
    badgeGlyph: '❖',
  },
  {
    id: 'frame-starlight-plum',
    name: 'Khung Đêm Sao Pháp Sư',
    description: 'Sắc tím mận tĩnh lặng điểm sao vàng cho hành trình học tập tối.',
    priceCoin: 460,
    requiredLevel: 10,
    previewOwnership: 'AVAILABLE',
    ringGradient: 'linear-gradient(135deg, #4A3A5C 0%, #8668AD 55%, #F7C96B 100%)',
    accentHex: '#4A3A5C',
    badgeGlyph: '★',
  },
  {
    id: 'frame-golden-lantern',
    name: 'Khung Đèn Lồng Mùa Xuân',
    description: 'Viền đỏ đất ấm và ánh kim sang trọng, không hoạt ảnh gây rối.',
    priceCoin: 620,
    requiredLevel: 15,
    previewOwnership: 'AVAILABLE',
    ringGradient: 'linear-gradient(135deg, #8E4A30 0%, #F26B3A 50%, #F7C96B 100%)',
    accentHex: '#8E4A30',
    badgeGlyph: '✿',
  },
]

export interface DecorativeTitleItem {
  id: string
  titleText: string
  description: string
  priceCoin: number
  requiredLevel: number
  previewOwnership: ShopItemOwnership
  toneBg: string
  toneColor: string
  /** Mandatory: decorative titles NEVER impersonate earned Achievement Badges */
  isDecorative: true
}

export const PROFILE_DECORATIVE_TITLES: readonly DecorativeTitleItem[] = [
  {
    id: 'title-maple-explorer',
    titleText: 'Nhà thám hiểm rừng phong',
    description: 'Danh hiệu trang trí hiển thị dưới tên trên trang cá nhân.',
    priceCoin: 140,
    requiredLevel: 1,
    previewOwnership: 'EQUIPPED',
    toneBg: '#FFF4E5',
    toneColor: '#8F4A07',
    isDecorative: true,
  },
  {
    id: 'title-dawn-runner',
    titleText: 'Người giữ nhịp bình minh',
    description: 'Tôn vinh thói quen khởi đầu ngày mới nhẹ nhàng cùng Fox.',
    priceCoin: 180,
    requiredLevel: 2,
    previewOwnership: 'OWNED',
    toneBg: '#E6F6F2',
    toneColor: '#0E695A',
    isDecorative: true,
  },
  {
    id: 'title-quiet-scholar',
    titleText: 'Kẻ lữ hành lặng lẽ',
    description: 'Phong cách điềm tĩnh dành cho các phiên tập trung sâu.',
    priceCoin: 260,
    requiredLevel: 5,
    previewOwnership: 'AVAILABLE',
    toneBg: '#EDF3F8',
    toneColor: '#16324A',
    isDecorative: true,
  },
  {
    id: 'title-story-collector',
    titleText: 'Người sưu tầm kỷ niệm',
    description: 'Dành cho những cuốn Sổ lưu niệm đầy ắp dấu chân hành trình.',
    priceCoin: 380,
    requiredLevel: 8,
    previewOwnership: 'AVAILABLE',
    toneBg: '#F4EEFA',
    toneColor: '#4A3A5C',
    isDecorative: true,
  },
  {
    id: 'title-golden-fox-ally',
    titleText: 'Tri kỷ của Fox V2',
    description: 'Danh hiệu trang trí đặc biệt (không thay thế huy hiệu thành tích).',
    priceCoin: 580,
    requiredLevel: 14,
    previewOwnership: 'AVAILABLE',
    toneBg: '#FFF1EB',
    toneColor: '#B84317',
    isDecorative: true,
  },
]

export interface Phase2ComingSoonItem {
  id: string
  category: ShopCategoryId
  subType: string
  name: string
  description: string
  accentGradient: string
}

/**
 * Phase 2 categories — explicitly labelled "Sắp ra mắt", NO purchase controls, NO food/toys.
 */
export const PHASE2_COMING_SOON_ITEMS: readonly Phase2ComingSoonItem[] = [
  {
    id: 'p2-chat-bg-meadow',
    category: 'messages',
    subType: 'Hình nền khung chat',
    name: 'Nền Thảo Nguyên Hoàng Hôn',
    description: 'Hình nền trò chuyện dịu mắt đồng bộ tông ấm cùng bạn đồng hành.',
    accentGradient: 'linear-gradient(135deg, #FFE8C8 0%, #F5A978 100%)',
  },
  {
    id: 'p2-chat-bg-starlight',
    category: 'messages',
    subType: 'Hình nền khung chat',
    name: 'Nền Trại Đêm Lấp Lánh',
    description: 'Không gian trò chuyện ban đêm yên tĩnh bên ánh lửa trại Fox.',
    accentGradient: 'linear-gradient(135deg, #1C3A54 0%, #3E6385 100%)',
  },
  {
    id: 'p2-chat-bubble-paper',
    category: 'messages',
    subType: 'Kiểu bong bóng chat',
    name: 'Bong Bóng Giấy Nhật Ký',
    description: 'Bo góc mềm kiểu giấy viết tay kèm viền chỉ mảnh tinh tế.',
    accentGradient: 'linear-gradient(135deg, #FBF7EF 0%, #E7DEC9 100%)',
  },
  {
    id: 'p2-chat-bubble-teal',
    category: 'messages',
    subType: 'Kiểu bong bóng chat',
    name: 'Bong Bóng Ngọc Bích',
    description: 'Sắc xanh ngọc trong trẻo cho nhóm cùng chạy Quest.',
    accentGradient: 'linear-gradient(135deg, #C7EFE6 0%, #168C78 100%)',
  },
  {
    id: 'p2-album-frame-polaroid',
    category: 'album',
    subType: 'Khung ảnh Album / Moment',
    name: 'Khung Polaroid Tem Bưu Chính',
    description: 'Đóng khung kỷ niệm kèm dấu tem hành trình cổ điển.',
    accentGradient: 'linear-gradient(135deg, #FBF7EF 0%, #F2C9A0 100%)',
  },
  {
    id: 'p2-album-frame-botanical',
    category: 'album',
    subType: 'Khung ảnh Album / Moment',
    name: 'Khung Lá Phong Mùa Thu',
    description: 'Viền lá ép khô thanh lịch cho trang sổ và bài đăng Moment.',
    accentGradient: 'linear-gradient(135deg, #FCE3D2 0%, #D47746 100%)',
  },
  {
    id: 'p2-profile-pose-stargaze',
    category: 'profile',
    subType: 'Tư thế trưng bày Hồ sơ',
    name: 'Tư Thế Fox Ngắm Sao',
    description: 'Tạo dáng Fox đặc biệt trên thẻ Hồ sơ cá nhân (Giai đoạn 2).',
    accentGradient: 'linear-gradient(135deg, #284664 0%, #5B4B78 100%)',
  },
  {
    id: 'p2-fox-fx-fireflies',
    category: 'fox',
    subType: 'Hiệu ứng Fox',
    name: 'Đom Đóm Rừng Đêm',
    description: 'Hạt sáng nhẹ nhàng bay quanh Fox (tự tắt khi bật Giảm chuyển động).',
    accentGradient: 'linear-gradient(135deg, #14594F 0%, #F7C96B 100%)',
  },
]

export const PREVIEW_WALLET_TRANSACTIONS: readonly CoinTransactionRecord[] = [
  {
    id: 'preview-tx-1',
    amount: 20,
    type: 'EARNED',
    reason: 'Hoàn thành nhiệm vụ ưu tiên Trung bình: Ôn tập Reading IELTS',
    refType: 'QUEST_EXECUTION',
    createdAt: '2026-11-28T08:15:00.000Z',
  },
  {
    id: 'preview-tx-2',
    amount: 15,
    type: 'EARNED',
    reason: 'Hoàn thành nhiệm vụ ưu tiên Cao: Chạy bộ 5km công viên',
    refType: 'QUEST_EXECUTION',
    createdAt: '2026-11-27T17:40:00.000Z',
  },
  {
    id: 'preview-tx-3',
    amount: -140,
    type: 'SPENT',
    reason: 'Đổi danh hiệu trang trí: Nhà thám hiểm rừng phong (Mẫu xem trước)',
    refType: 'REWARD_ITEM',
    createdAt: '2026-11-25T14:20:00.000Z',
  },
  {
    id: 'preview-tx-4',
    amount: 50,
    type: 'REFUNDED',
    reason: 'Hoàn xu giao dịch mẫu bị hủy do gián đoạn kết nối',
    refType: 'REFUND',
    createdAt: '2026-11-22T10:05:00.000Z',
  },
]
