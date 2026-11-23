import prisma from "../../config/database.js";

// Tìm kiếm Schedule theo ID (kèm thông tin Quest để kiểm tra quyền sở hữu)
const findScheduleById = async (scheduleId, tx) => {
  const db = tx || prisma;
  return await db.questSchedule.findUnique({
    where: {
      id: scheduleId
    },
    include: {
      quest: true
    }
  });
};

// Lấy danh sách Schedule của một Quest theo bộ lọc (ví dụ isActive)
const findSchedulesByQuestId = async (questId, filters = {}, tx) => {
  const db = tx || prisma;
  const where = {
    questId
  };
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }
  return await db.questSchedule.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });
};

// Tạo mới một Schedule
const createSchedule = async (scheduleData, tx) => {
  const db = tx || prisma;
  return await db.questSchedule.create({
    data: {
      questId: scheduleData.questId,
      scheduleType: scheduleData.scheduleType,
      timezone: scheduleData.timezone,
      startAt: scheduleData.startAt,
      endAt: scheduleData.endAt || null,
      recurrenceRule: scheduleData.recurrenceRule || null,
      isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true
    }
  });
};

// Cập nhật thông tin Schedule
const updateSchedule = async (scheduleId, updateData, tx) => {
  const db = tx || prisma;
  return await db.questSchedule.update({
    where: {
      id: scheduleId
    },
    data: updateData
  });
};

// Vô hiệu hóa Schedule (soft deactivate)
const deactivateSchedule = async (scheduleId, tx) => {
  const db = tx || prisma;
  return await db.questSchedule.update({
    where: {
      id: scheduleId
    },
    data: {
      isActive: false
    }
  });
};

// Vô hiệu hóa toàn bộ Schedule đang active của một Quest (dùng khi Quest bị Archive)
const deactivateSchedulesByQuestId = async (questId, tx) => {
  const db = tx || prisma;
  return await db.questSchedule.updateMany({
    where: {
      questId,
      isActive: true
    },
    data: {
      isActive: false
    }
  });
};
export const schedulesRepository = {
  findScheduleById,
  findSchedulesByQuestId,
  createSchedule,
  updateSchedule,
  deactivateSchedule,
  deactivateSchedulesByQuestId
};