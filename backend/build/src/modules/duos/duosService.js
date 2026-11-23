import { duosRepository } from "./duosRepository.js";
import { usersRepository } from "../users/usersRepository.js";
import { areFriends, isBlocked } from "../friends/friendsService.js";
import { resolveEntitlement } from "../../common/utils/entitlement.js";
import ApiError from "../../common/errors/ApiError.js";
import { eventBus } from "../../common/events/eventBus.js";
import { EVENT_TYPES } from "../../common/events/eventTypes.js";
import prisma from "../../config/database.js";
const inviteDuo = async (userId, {
  partnerId,
  title,
  questId,
  targetValue = 1,
  expiresInDays = 7
}) => {
  if (!partnerId || partnerId === userId) {
    throw new ApiError(400, 'Cannot invite yourself to a duo quest', 'CANNOT_INVITE_SELF');
  }

  // 1. Kiểm tra quan hệ bạn bè (bắt buộc ACCEPTED)
  const isFriend = await areFriends(userId, partnerId);
  if (!isFriend) {
    throw new ApiError(403, 'Chỉ có thể mời bạn bè tham gia nhiệm vụ đôi', 'NOT_FRIENDS');
  }

  // 2. Kiểm tra chặn
  const blocked = await isBlocked(userId, partnerId);
  if (blocked) {
    throw new ApiError(403, 'Không thể gửi lời mời tới người dùng này', 'USER_BLOCKED');
  }

  // 3. Kiểm tra hạn mức Entitlement (FREE tối đa 1 Duo ACTIVE)
  const user = await usersRepository.findUserById(userId);
  const entitlement = resolveEntitlement(user);
  if (entitlement.effectiveTier === 'FREE') {
    const activeCount = await duosRepository.countActiveDuosForUser(userId);
    if (activeCount >= 1) {
      throw new ApiError(403, 'Gói Free chỉ được tham gia tối đa 1 nhiệm vụ đôi cùng lúc. Nâng cấp Premium để không giới hạn!', 'PREMIUM_REQUIRED');
    }
  }
  const expiresAt = new Date(Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000);
  return await duosRepository.createDuo({
    user1Id: userId,
    user2Id: partnerId,
    title: title || 'Co-op Quest',
    questId: questId || null,
    targetValue: Math.max(1, targetValue || 1),
    status: 'PENDING',
    expiresAt
  });
};
const acceptDuo = async (userId, duoId) => {
  const duo = await duosRepository.findDuoById(duoId);
  if (!duo) {
    throw new ApiError(404, 'Duo partnership not found', 'DUO_NOT_FOUND');
  }
  if (duo.user2Id !== userId) {
    throw new ApiError(403, 'Only invited partner can accept this duo quest', 'FORBIDDEN_DUO_ACTION');
  }
  if (duo.status !== 'PENDING') {
    throw new ApiError(400, `Cannot accept duo quest in status ${duo.status}`, 'INVALID_DUO_STATUS');
  }
  if (new Date() > new Date(duo.expiresAt)) {
    throw new ApiError(400, 'Duo quest invitation has expired', 'DUO_EXPIRED');
  }

  // Kiểm tra quyền của người nhận lời mời
  const user = await usersRepository.findUserById(userId);
  const entitlement = resolveEntitlement(user);
  if (entitlement.effectiveTier === 'FREE') {
    const activeCount = await duosRepository.countActiveDuosForUser(userId);
    if (activeCount >= 1) {
      throw new ApiError(403, 'Gói Free chỉ được tham gia tối đa 1 nhiệm vụ đôi cùng lúc. Nâng cấp Premium để không giới hạn!', 'PREMIUM_REQUIRED');
    }
  }
  return await duosRepository.updateDuo(duoId, {
    status: 'ACTIVE'
  });
};
const rejectDuo = async (userId, duoId) => {
  const duo = await duosRepository.findDuoById(duoId);
  if (!duo) {
    throw new ApiError(404, 'Duo partnership not found', 'DUO_NOT_FOUND');
  }
  if (duo.user2Id !== userId && duo.user1Id !== userId) {
    throw new ApiError(403, 'You do not have permission to cancel this duo quest', 'FORBIDDEN_DUO_ACTION');
  }
  return await duosRepository.updateDuo(duoId, {
    status: 'CANCELLED'
  });
};
const getActiveDuos = async userId => {
  return await duosRepository.findActiveDuosForUser(userId);
};

/**
 * Tự động cập nhật tiến độ Duo Quest khi người dùng hoàn thành một nhiệm vụ
 */
const onQuestCompleted = async userId => {
  const now = new Date();
  const activeDuos = await duosRepository.findActiveExpiringDuosForUser(userId, now);
  for (const duo of activeDuos) {
    let p1 = duo.user1Progress;
    let p2 = duo.user2Progress;
    if (duo.user1Id === userId && p1 < duo.targetValue) {
      p1 = Math.min(p1 + 1, duo.targetValue);
    } else if (duo.user2Id === userId && p2 < duo.targetValue) {
      p2 = Math.min(p2 + 1, duo.targetValue);
    } else {
      continue;
    }

    // Nếu cả 2 bên cùng đạt chỉ tiêu -> Hoàn thành nhiệm vụ đôi
    if (p1 >= duo.targetValue && p2 >= duo.targetValue) {
      const doubleXp = duo.rewardXp * 2;
      const doubleCoins = duo.rewardCoins * 2;
      await prisma.$transaction(async tx => {
        await tx.duoPartnership.update({
          where: {
            id: duo.id
          },
          data: {
            user1Progress: p1,
            user2Progress: p2,
            status: 'COMPLETED',
            completedAt: now
          }
        });

        // Cộng thưởng gấp đôi an toàn bằng upsert cho cả 2 người dùng (Note 2)
        for (const uId of [duo.user1Id, duo.user2Id]) {
          await tx.userGamification.upsert({
            where: {
              userId: uId
            },
            update: {
              totalXp: {
                increment: doubleXp
              },
              coinBalance: {
                increment: doubleCoins
              }
            },
            create: {
              userId: uId,
              totalXp: BigInt(doubleXp),
              coinBalance: BigInt(doubleCoins),
              level: 1
            }
          });
        }
      });

      // Kích hoạt event DUO_CELEBRATE cho FoxDuoCoordinator
      eventBus.emit(EVENT_TYPES.DUO_CELEBRATE, {
        duoId: duo.id,
        user1Id: duo.user1Id,
        user2Id: duo.user2Id,
        completedAt: now
      });
    } else {
      // Chỉ cập nhật tiến độ
      await duosRepository.updateDuo(duo.id, {
        user1Progress: p1,
        user2Progress: p2
      });
    }
  }
};
export const duosService = {
  inviteDuo,
  acceptDuo,
  rejectDuo,
  getActiveDuos,
  onQuestCompleted
};
export default duosService;