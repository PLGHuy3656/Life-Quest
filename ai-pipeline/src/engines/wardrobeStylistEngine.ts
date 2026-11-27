import type {
  CosmeticSuggestionItem,
  DataSource,
  OutfitThemeId,
  WardrobeStylistRequest,
  WardrobeStylistResponse
} from '../domain/types.js'
import {
  FOX_COSMETIC_SHOP_CATALOG,
  getMockWardrobeProfile
} from '../mock/wardrobeCosmeticFixtures.js'

const THEME_BY_CATEGORY: Record<string, OutfitThemeId> = {
  study: 'outfit_student',
  coding: 'outfit_mage',
  sports: 'outfit_sports',
  explorer: 'outfit_explorer',
  general: 'outfit_tet'
}

/**
 * AI Mascot Wardrobe Stylist:
 * Scores real Fox V2 Gate H1/H2 cosmetics based on:
 * 1) Completing an almost-finished outfit set (2/3 owned -> highest bonus)
 * 2) Matching the user's dominant 14-day quest behavior (study/sports/coding/explorer)
 * 3) Filling currently empty Fox cosmetic slots (FACE, HEAD, BODY, BACK, FEET, HAND_RIGHT)
 * 4) Coin affordability (instant buy vs small motivational coinGap)
 */
export function recommendWardrobeCosmetics(req: WardrobeStylistRequest): WardrobeStylistResponse {
  const hasRealInput =
    Array.isArray(req.ownedItemIds) ||
    typeof req.coinBalance === 'number' ||
    (Array.isArray(req.dominantCategories) && req.dominantCategories.length > 0)

  const mock = getMockWardrobeProfile()
  const useMock = !hasRealInput && (req.useMockIfEmpty ?? true)
  const dataSource: DataSource = useMock ? 'MOCK' : 'LIVE'

  const ownedSet = new Set(useMock ? mock.ownedItemIds : (req.ownedItemIds ?? []))
  const equipped = useMock ? mock.equippedSlots : (req.equippedSlots ?? {})
  const coinBalance = useMock ? mock.coinBalance : (req.coinBalance ?? 0)
  const userLevel = useMock ? mock.userLevel : (req.userLevel ?? 1)
  const dominantCategories =
    (useMock ? mock.dominantCategories : req.dominantCategories) ?? ['study']

  // Count how many items per outfit set the user already owns
  const ownedByOutfit = new Map<OutfitThemeId, number>()
  const totalByOutfit = new Map<OutfitThemeId, number>()
  for (const item of FOX_COSMETIC_SHOP_CATALOG) {
    totalByOutfit.set(item.outfitThemeId, (totalByOutfit.get(item.outfitThemeId) ?? 0) + 1)
    if (ownedSet.has(item.itemId)) {
      ownedByOutfit.set(item.outfitThemeId, (ownedByOutfit.get(item.outfitThemeId) ?? 0) + 1)
    }
  }

  const primaryCategory = dominantCategories[0] ?? 'study'
  const dominantTheme: OutfitThemeId =
    primaryCategory === 'coding' && userLevel < 5
      ? 'outfit_student'
      : (THEME_BY_CATEGORY[primaryCategory] ?? 'outfit_student')

  const candidates: CosmeticSuggestionItem[] = []

  for (const item of FOX_COSMETIC_SHOP_CATALOG) {
    if (ownedSet.has(item.itemId)) continue

    let score = 55
    const reasons: string[] = []

    const ownedInSet = ownedByOutfit.get(item.outfitThemeId) ?? 0
    const totalInSet = totalByOutfit.get(item.outfitThemeId) ?? 3
    const completesOutfitSet = ownedInSet === totalInSet - 1

    if (completesOutfitSet) {
      score += 24
      reasons.push(`chỉ thiếu món này để hoàn thiện trọn bộ ${item.outfitThemeVi} (${ownedInSet}/${totalInSet})`)
    } else if (ownedInSet > 0) {
      score += 10
      reasons.push(`phối cùng ${ownedInSet} món ${item.outfitThemeVi} bạn đang sở hữu`)
    }

    const matchesPrimary = item.behaviorTags.includes(primaryCategory)
    const matchesAny = item.behaviorTags.some((t) => dominantCategories.includes(t))
    if (matchesPrimary) {
      score += 14
      reasons.push('rất hợp phong cách nhiệm vụ nổi trội 14 ngày qua của bạn')
    } else if (matchesAny) {
      score += 7
      reasons.push('hợp với thói quen phụ gần đây của bạn')
    }

    if (!equipped[item.slot]) {
      score += 8
      reasons.push(`vị trí ${item.slot} trên Fox hiện đang trống`)
    }

    const coinGap = Math.max(0, item.priceCoin - coinBalance)
    const canAffordNow = coinGap === 0 && userLevel >= item.requiredLevel

    if (canAffordNow) {
      score += 10
      reasons.push(`bạn đang có ${coinBalance} Coin (đủ mua ngay với giá ${item.priceCoin} Coin)`)
    } else if (coinGap > 0 && coinGap <= 80 && userLevel >= item.requiredLevel) {
      score += 4
      reasons.push(`chỉ còn thiếu ${coinGap} Coin — làm thêm 2 nhiệm vụ hôm nay là mở khóa được`)
    } else if (userLevel < item.requiredLevel) {
      score -= 12
      reasons.push(`mở khóa khi đạt Cấp ${item.requiredLevel} (hiện Cấp ${userLevel})`)
    }

    const reasonText =
      reasons.length > 0
        ? `Fox gợi ý ${item.displayNameVi}: ${reasons.slice(0, 2).join('; ')}.`
        : `Phụ kiện ${item.displayNameVi} thuộc ${item.outfitThemeVi} giúp làm mới diện mạo Fox.`

    candidates.push({
      itemId: item.itemId,
      displayNameVi: item.displayNameVi,
      slot: item.slot,
      outfitThemeId: item.outfitThemeId,
      outfitThemeVi: item.outfitThemeVi,
      priceCoin: item.priceCoin,
      coinGap,
      canAffordNow,
      completesOutfitSet,
      score: Math.min(99, Math.max(10, score)),
      reason: reasonText,
      targetRoute: '/wardrobe/shop'
    })
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 4)
  const lead = top[0]
  const foxSummary = lead
    ? lead.canAffordNow
      ? `Fox chọn "${lead.displayNameVi}" (${lead.priceCoin} Coin) là món đáng mua nhất hôm nay cho bạn!`
      : `Mục tiêu trang trí tiếp theo cho Fox: "${lead.displayNameVi}" (thiếu ${lead.coinGap} Coin).`
    : 'Bạn đã sưu tập trọn bộ trang phục Fox V2 hiện có rồi!'

  return {
    dominantTheme,
    coinBalance,
    dataSource,
    foxSummary,
    suggestions: top
  }
}
