import prisma from "../../config/database.js";

// Lấy cài đặt người dùng (để xác định timezone)
const getUserSettings = async userId => {
  return await prisma.userSettings.findUnique({
    where: {
      userId
    }
  });
};

// Lấy danh sách Execution diễn ra hoặc được lên lịch trong khoảng thời gian ngày truy vấn
const getExecutionsByDateRange = async (userId, startOfDay, endOfDay) => {
  return await prisma.questExecution.findMany({
    where: {
      userId,
      OR: [{
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }, {
        startedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }, {
        completedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }]
    },
    include: {
      quest: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priority: true,
          targetValue: true,
          targetUnit: true,
          xpReward: true,
          coinReward: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
};

// Lấy toàn bộ Schedule đang active của các Quest đang active thuộc sở hữu của user
const getActiveSchedulesForUser = async userId => {
  return await prisma.questSchedule.findMany({
    where: {
      isActive: true,
      quest: {
        userId,
        status: 'ACTIVE',
        deletedAt: null
      }
    },
    include: {
      quest: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priority: true,
          xpReward: true,
          coinReward: true
        }
      }
    }
  });
};

// Lấy thông tin gamification của người dùng
const getUserGamification = async userId => {
  return await prisma.userGamification.findUnique({
    where: {
      userId
    }
  });
};
export const todayRepository = {
  getUserSettings,
  getExecutionsByDateRange,
  getActiveSchedulesForUser,
  getUserGamification
};