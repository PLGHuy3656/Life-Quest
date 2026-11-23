import prisma from '../../config/database.js'


// Tìm user bằng email
const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email }
  })
}


// Tạo user + user_profile + user_settings + user_gamification trong 1 transaction
const createUserWithRelations = async (userData) => {
  return await prisma.$transaction(async (tx) => {
    // Tạo user
    const user = await tx.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        passwordHash: userData.passwordHash
      }
    })

    // Tạo user_profile mặc định
    await tx.userProfile.create({
      data: {
        userId: user.id,
        displayName: user.username,
        bio: null,
        avatarUrl: null
      }
    })

    // Tạo user_settings mặc định
    await tx.userSettings.create({
      data: {
        userId: user.id,
        language: 'vi',
        theme: 'light',
        emailNotifications: true
      }
    })

    // Tạo user_gamification mặc định
    await tx.userGamification.create({
      data: {
        userId: user.id,
        level: 1,
        currentXp: 0,
        totalXp: 0
      }
    })

    return user
  })
}


// Cập nhật last_login_at khi đăng nhập thành công
const updateLastLogin = async (userId) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  })
}


// Tạo session mới (lưu refresh token hash)
const createSession = async (sessionData) => {
  return await prisma.session.create({
    data: {
      id: sessionData.id,
      userId: sessionData.userId,
      refreshTokenHash: sessionData.refreshTokenHash,
      deviceId: sessionData.deviceId || null,
      ipAddress: sessionData.ipAddress || null,
      userAgent: sessionData.userAgent || null,
      expiresAt: sessionData.expiresAt
    }
  })
}


// Tìm session theo id chưa bị revoke và chưa hết hạn
const findActiveSessionById = async (sessionId) => {
  return await prisma.session.findFirst({
    where: {
      id: sessionId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  })
}


// Tìm tất cả session active của user
const findActiveSessionsByUserId = async (userId) => {
  return await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  })
}


// Revoke session (đặt revoked_at = now)
const revokeSession = async (sessionId) => {
  return await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() }
  })
}


export const authRepository = {
  findUserByEmail,
  createUserWithRelations,
  updateLastLogin,
  createSession,
  findActiveSessionById,
  findActiveSessionsByUserId,
  revokeSession
}
