import ApiError from "../errors/ApiError.js";

/**
 * Tính toán quyền hạn (Entitlement) của người dùng:
 * - Hỗ trợ gói FREE, PREMIUM
 * - Hỗ trợ thời gian dùng thử (Trial 3 ngày từ ngày tạo hoặc trialEndsAt)
 */
export const resolveEntitlement = user => {
  if (!user) {
    return {
      planType: 'FREE',
      effectiveTier: 'FREE',
      isTrial: false,
      trialEndsAt: null
    };
  }
  const now = new Date();
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

  // Đang trong thời gian trial nếu trialEndsAt còn hiệu lực và chưa nâng cấp PREMIUM
  const isTrial = Boolean(trialEndsAt && now < trialEndsAt && user.planType !== 'PREMIUM');

  // effectiveTier được hưởng quyền PREMIUM nếu đã mua gói PREMIUM hoặc đang trong thời gian Trial
  const effectiveTier = user.planType === 'PREMIUM' || isTrial ? 'PREMIUM' : 'FREE';
  return {
    planType: user.planType || 'FREE',
    effectiveTier,
    isTrial,
    trialEndsAt
  };
};

/**
 * Kiểm tra quyền hạn truy cập gói tính năng
 * Ném lỗi 403 PREMIUM_REQUIRED nếu tính năng yêu cầu PREMIUM mà user chỉ có quyền FREE
 */
export const assertTierAccess = (entitlement, requiredTier) => {
  if (requiredTier === 'PREMIUM' && entitlement.effectiveTier !== 'PREMIUM') {
    throw new ApiError(403, 'Tính năng này yêu cầu gói LifeQuest Premium', 'PREMIUM_REQUIRED');
  }
};