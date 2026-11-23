import { StatusCodes } from 'http-status-codes';
import { authService } from "./authService.js";

// Đăng ký tài khoản mới
const register = async (req, res, next) => {
  try {
    const {
      email,
      username,
      password
    } = req.body;
    const user = await authService.register({
      email,
      username,
      password
    });
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Đăng nhập
const login = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;

    // Lấy metadata từ request
    const requestMeta = {
      ipAddress: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.headers['user-agent'] || null,
      deviceId: req.headers['x-device-id'] || null
    };
    const result = await authService.login({
      email,
      password
    }, requestMeta);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Làm mới access token bằng refresh token
const refresh = async (req, res, next) => {
  try {
    const {
      refreshToken
    } = req.body;
    const result = await authService.refresh(refreshToken);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Đăng xuất
const logout = async (req, res, next) => {
  try {
    const {
      refreshToken
    } = req.body;
    const result = await authService.logout(refreshToken);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Quên mật khẩu - placeholder
const forgotPassword = async (req, res, next) => {
  try {
    const {
      email
    } = req.body;
    const result = await authService.forgotPassword(email);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Đặt lại mật khẩu - placeholder
const resetPassword = async (req, res, next) => {
  try {
    const {
      token,
      newPassword
    } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
export const authController = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
};