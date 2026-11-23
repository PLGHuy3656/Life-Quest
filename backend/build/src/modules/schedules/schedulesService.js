import { schedulesRepository } from "./schedulesRepository.js";
import { questsRepository } from "../quests/questsRepository.js";
import ApiError from "../../common/errors/ApiError.js";

// Lấy danh sách Schedule của một Quest
const getSchedulesByQuestId = async (userId, questId, filters = {}) => {
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access schedules for this quest', 'QUEST_ACCESS_DENIED');
  }
  return await schedulesRepository.findSchedulesByQuestId(questId, filters);
};

// Tạo mới một Schedule cho Quest
const createSchedule = async (userId, questId, scheduleData) => {
  const quest = await questsRepository.findQuestById(questId);
  if (!quest || quest.deletedAt) {
    throw new ApiError(404, 'Quest not found', 'QUEST_NOT_FOUND');
  }
  if (quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to create a schedule for this quest', 'QUEST_ACCESS_DENIED');
  }

  // Chỉ Quest đang ACTIVE mới được tạo Schedule
  if (quest.status !== 'ACTIVE') {
    throw new ApiError(400, 'Only active quests can have schedules created', 'QUEST_CANNOT_CREATE_SCHEDULE');
  }
  const startAt = new Date(scheduleData.startAt);
  const endAt = scheduleData.endAt ? new Date(scheduleData.endAt) : null;
  if (endAt && startAt >= endAt) {
    throw new ApiError(400, 'Start at must be before end at', 'INVALID_SCHEDULE_DATE_RANGE');
  }
  if (scheduleData.scheduleType === 'RECURRING' && !scheduleData.recurrenceRule) {
    throw new ApiError(400, 'Recurring schedule requires recurrence rule', 'RECURRENCE_RULE_REQUIRED');
  }
  if (scheduleData.scheduleType === 'ONE_TIME' && scheduleData.recurrenceRule) {
    throw new ApiError(400, 'One-time schedule cannot have recurrence rule', 'RECURRENCE_RULE_NOT_ALLOWED');
  }
  return await schedulesRepository.createSchedule({
    questId,
    scheduleType: scheduleData.scheduleType,
    timezone: scheduleData.timezone,
    startAt,
    endAt,
    recurrenceRule: scheduleData.recurrenceRule || null,
    isActive: true
  });
};

// Cập nhật thông tin Schedule
const updateSchedule = async (userId, scheduleId, updateData) => {
  const schedule = await schedulesRepository.findScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(404, 'Schedule not found', 'SCHEDULE_NOT_FOUND');
  }
  if (schedule.quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to update this schedule', 'SCHEDULE_ACCESS_DENIED');
  }
  if (schedule.quest.status === 'ARCHIVED') {
    throw new ApiError(400, 'Cannot update schedule of an archived quest', 'QUEST_ARCHIVED_CANNOT_UPDATE_SCHEDULE');
  }
  const finalScheduleType = updateData.scheduleType || schedule.scheduleType;
  const startAt = updateData.startAt ? new Date(updateData.startAt) : schedule.startAt;
  const endAt = updateData.endAt !== undefined ? updateData.endAt ? new Date(updateData.endAt) : null : schedule.endAt;
  if (endAt && startAt >= endAt) {
    throw new ApiError(400, 'Start at must be before end at', 'INVALID_SCHEDULE_DATE_RANGE');
  }
  if (finalScheduleType === 'RECURRING') {
    const recurrenceRule = updateData.recurrenceRule !== undefined ? updateData.recurrenceRule : schedule.recurrenceRule;
    if (!recurrenceRule) {
      throw new ApiError(400, 'Recurring schedule requires recurrence rule', 'RECURRENCE_RULE_REQUIRED');
    }
  }
  return await schedulesRepository.updateSchedule(scheduleId, {
    scheduleType: updateData.scheduleType,
    timezone: updateData.timezone,
    startAt: updateData.startAt ? new Date(updateData.startAt) : undefined,
    endAt: updateData.endAt !== undefined ? updateData.endAt ? new Date(updateData.endAt) : null : undefined,
    recurrenceRule: updateData.recurrenceRule,
    isActive: updateData.isActive
  });
};

// Vô hiệu hóa (Deactivate) Schedule
const deactivateSchedule = async (userId, scheduleId) => {
  const schedule = await schedulesRepository.findScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(404, 'Schedule not found', 'SCHEDULE_NOT_FOUND');
  }
  if (schedule.quest.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to deactivate this schedule', 'SCHEDULE_ACCESS_DENIED');
  }
  return await schedulesRepository.deactivateSchedule(scheduleId);
};
export const schedulesService = {
  getSchedulesByQuestId,
  createSchedule,
  updateSchedule,
  deactivateSchedule
};