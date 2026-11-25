import { usersRepository } from './usersRepository.js'
import ApiError from '../../common/errors/ApiError.js'


// Lấy thông tin cá nhân đầy đủ của user đang đăng nhập (bao gồm profile)
const getMe = async (userId) => {
  const user = await usersRepository.findUserWithProfile(userId)

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile
  }
}


// Cập nhật thông tin profile của user đang đăng nhập
const updateMe = async (userId, updateData) => {
  const user = await usersRepository.findUserWithProfile(userId)

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  const updatedProfile = await usersRepository.updateUserProfile(userId, {
    displayName: updateData.displayName,
    bio: updateData.bio,
    title: updateData.title
  })

  return updatedProfile
}


// Lấy cài đặt của user đang đăng nhập
const getMySettings = async (userId) => {
  const settings = await usersRepository.findUserSettings(userId)

  if (!settings) {
    throw new ApiError(404, 'Settings not found', 'SETTINGS_NOT_FOUND')
  }

  return settings
}


// Cập nhật cài đặt của user đang đăng nhập
const updateMySettings = async (userId, settingsData) => {
  const settings = await usersRepository.findUserSettings(userId)

  if (!settings) {
    throw new ApiError(404, 'Settings not found', 'SETTINGS_NOT_FOUND')
  }

  const updatedSettings = await usersRepository.updateUserSettings(userId, {
    timezone: settingsData.timezone,
    language: settingsData.language,
    privacyMode: settingsData.privacyMode,
    notificationEnabled: settingsData.notificationEnabled
  })

  return updatedSettings
}


// Lấy thông tin public của một user khác theo userId
const getUserById = async (userId) => {
  const user = await usersRepository.findPublicUserById(userId)

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  }

  return user
}

export const usersService = {
  getMe,
  updateMe,
  getMySettings,
  updateMySettings,
  getUserById
}
