import { usersService } from "./usersService.js";
import { StatusCodes } from 'http-status-codes';

// Lấy thông tin cá nhân của user đang đăng nhập (bao gồm profile)
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await usersService.getMe(userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin profile của user đang đăng nhập
const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    const updatedProfile = await usersService.updateMe(userId, updateData);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

// Lấy cài đặt của user đang đăng nhập
const getMySettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settings = await usersService.getMySettings(userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật cài đặt của user đang đăng nhập
const updateMySettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;
    const updatedSettings = await usersService.updateMySettings(userId, settingsData);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin public của một user khác theo userId (không cần đăng nhập)
const getUserById = async (req, res, next) => {
  try {
    const {
      userId
    } = req.params;
    const user = await usersService.getUserById(userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
export const usersController = {
  getMe,
  updateMe,
  getMySettings,
  updateMySettings,
  getUserById
};