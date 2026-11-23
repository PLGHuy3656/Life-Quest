import { StatusCodes } from 'http-status-codes';
import { schedulesService } from "./schedulesService.js";

// Lấy danh sách Schedule của một Quest
const getSchedulesByQuestId = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const questId = req.params.questId;
    const filters = req.query;
    const schedules = await schedulesService.getSchedulesByQuestId(userId, questId, filters);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// Tạo mới một Schedule cho Quest
const createSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const questId = req.params.questId;
    const scheduleData = req.body;
    const createdSchedule = await schedulesService.createSchedule(userId, questId, scheduleData);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin Schedule
const updateSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduleId = req.params.scheduleId;
    const updateData = req.body;
    const updatedSchedule = await schedulesService.updateSchedule(userId, scheduleId, updateData);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    next(error);
  }
};

// Vô hiệu hóa (Deactivate) Schedule
const deactivateSchedule = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduleId = req.params.scheduleId;
    const result = await schedulesService.deactivateSchedule(userId, scheduleId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: result.id,
        isActive: result.isActive,
        message: 'Schedule deactivated successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};
export const schedulesController = {
  getSchedulesByQuestId,
  createSchedule,
  updateSchedule,
  deactivateSchedule
};