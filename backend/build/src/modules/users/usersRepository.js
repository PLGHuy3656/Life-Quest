import prisma from "../../config/database.js";

// Tìm user theo ID
const findUserById = async userId => {
  return await prisma.user.findUnique({
    where: {
      id: userId
    }
  });
};

// Tìm 1 user bằng email
const findUserByEmail = async email => {
  return await prisma.user.findUnique({
    where: {
      email
    }
  });
};

// Tìm 1 user bằng username
const findUserByUsername = async username => {
  return await prisma.user.findUnique({
    where: {
      username
    }
  });
};

// Tìm user bằng email hoặc username
const findExistingUser = async (email, username) => {
  return await prisma.user.findFirst({
    where: {
      OR: [{
        email
      }, {
        username
      }]
    }
  });
};

// Tạo mới user
const createUser = async userData => {
  return await prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash
    }
  });
};

// Tìm user kèm profile để hiển thị thông tin cá nhân
const findUserWithProfile = async userId => {
  return await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      profile: true
    }
  });
};

// Tìm cài đặt của user theo userId
const findUserSettings = async userId => {
  return await prisma.userSettings.findUnique({
    where: {
      userId
    }
  });
};

// Cập nhật thông tin profile của user (displayName, bio, title)
const updateUserProfile = async (userId, data) => {
  return await prisma.userProfile.update({
    where: {
      userId
    },
    data
  });
};

// Cập nhật cài đặt của user (timezone, language, privacyMode, notificationEnabled)
const updateUserSettings = async (userId, data) => {
  return await prisma.userSettings.update({
    where: {
      userId
    },
    data
  });
};

// Tìm thông tin public của user theo ID (không bao gồm email, passwordHash)
const findPublicUserById = async userId => {
  return await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      username: true,
      status: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
          title: true,
          bio: true
        }
      }
    }
  });
};
export const usersRepository = {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findExistingUser,
  createUser,
  findUserWithProfile,
  findUserSettings,
  updateUserProfile,
  updateUserSettings,
  findPublicUserById
};