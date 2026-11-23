import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID as uuidv4 } from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { authRepository } from "./authRepository.js";
import ApiError from "../../common/errors/ApiError.js";

// Lấy config JWT từ env
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_default';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_default';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Tạo access token JWT
const generateAccessToken = user => {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    username: user.username,
    status: user.status
  }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN
  });
};

// Tạo refresh token: UUID ngẫu nhiên (raw), hash bằng bcrypt để lưu DB,
// đóng gói sessionId + rawToken vào JWT để client lưu và gửi lại
const generateRefreshToken = async sessionId => {
  const rawToken = uuidv4();
  const tokenHash = await bcrypt.hash(rawToken, 10);
  // Tạo JWT chứa sessionId và rawToken để server có thể tìm đúng session
  const jwtToken = jwt.sign({
    sessionId,
    rawToken
  }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN
  });
  return {
    jwtToken,
    tokenHash
  };
};

// Tính thời gian hết hạn của refresh token
const getRefreshTokenExpiresAt = () => {
  const days = REFRESH_EXPIRES_IN.endsWith('d') ? parseInt(REFRESH_EXPIRES_IN) : 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

// Đăng ký tài khoản mới
const register = async userData => {
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await authRepository.findUserByEmail(userData.email);
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists', 'EMAIL_ALREADY_EXISTS');
  }

  // Hash mật khẩu
  const passwordHash = await bcrypt.hash(userData.password, 10);

  // Tạo user + profile + settings + gamification trong transaction
  let user;
  try {
    user = await authRepository.createUserWithRelations({
      email: userData.email,
      username: userData.username,
      passwordHash
    });
  } catch (error) {
    // Xử lý lỗi Prisma unique constraint
    if (error.code === 'P2002') {
      const duplicatedField = error.meta?.target;
      if (duplicatedField?.includes('email')) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email already exists', 'EMAIL_ALREADY_EXISTS');
      }
      if (duplicatedField?.includes('username')) {
        throw new ApiError(StatusCodes.CONFLICT, 'Username already exists', 'USERNAME_ALREADY_EXISTS');
      }
    }
    throw error;
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    createdAt: user.createdAt
  };
};

// Đăng nhập và trả về access token + refresh token
const login = async (loginData, requestMeta = {}) => {
  // Tìm user theo email
  const user = await authRepository.findUserByEmail(loginData.email);
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Kiểm tra user bị BAN
  if (user.status === 'BANNED') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been banned', 'ACCOUNT_BANNED');
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Tạo access token
  const accessToken = generateAccessToken(user);

  // Tạo UUID cho session trước để dùng trong refresh token
  const sessionId = uuidv4();
  const {
    jwtToken: refreshToken,
    tokenHash: refreshTokenHash
  } = await generateRefreshToken(sessionId);

  // Lưu session vào DB với id đã biết trước
  await authRepository.createSession({
    id: sessionId,
    userId: user.id,
    refreshTokenHash,
    deviceId: requestMeta.deviceId || null,
    ipAddress: requestMeta.ipAddress || null,
    userAgent: requestMeta.userAgent || null,
    expiresAt: getRefreshTokenExpiresAt()
  });

  // Cập nhật last_login_at
  await authRepository.updateLastLogin(user.id);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      status: user.status
    }
  };
};

// Làm mới access token bằng refresh token
const refresh = async refreshTokenRaw => {
  // Decode JWT để lấy sessionId và rawToken
  let payload;
  try {
    payload = jwt.verify(refreshTokenRaw, REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired', 'TOKEN_EXPIRED');
    }
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token', 'INVALID_TOKEN');
  }

  // Tìm session còn active
  const session = await authRepository.findActiveSessionById(payload.sessionId);
  if (!session) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Session not found or expired', 'SESSION_INVALID');
  }

  // Verify raw token với hash trong DB
  const isTokenValid = await bcrypt.compare(payload.rawToken, session.refreshTokenHash);
  if (!isTokenValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token', 'INVALID_TOKEN');
  }

  // Kiểm tra user còn active
  const user = session.user;
  if (user.status === 'BANNED') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Your account has been banned', 'ACCOUNT_BANNED');
  }

  // Tạo access token mới
  const accessToken = generateAccessToken(user);
  return {
    accessToken
  };
};

// Đăng xuất - revoke session
const logout = async refreshTokenRaw => {
  let payload;
  try {
    payload = jwt.verify(refreshTokenRaw, REFRESH_SECRET, {
      ignoreExpiration: true
    });
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token', 'INVALID_TOKEN');
  }

  // Tìm session và revoke
  const session = await authRepository.findActiveSessionById(payload.sessionId);
  if (session) {
    await authRepository.revokeSession(session.id);
  }
  return {
    message: 'Logged out successfully'
  };
};

// Quên mật khẩu - placeholder (chỉ return success, chưa implement gửi email)
const forgotPassword = async email => {
  // TODO: Implement gửi email reset password
  return {
    message: 'If this email exists, a reset link has been sent'
  };
};

// Đặt lại mật khẩu - placeholder
const resetPassword = async (token, newPassword) => {
  // TODO: Implement logic reset password bằng token
  return {
    message: 'Password reset successfully'
  };
};
export const authService = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
};