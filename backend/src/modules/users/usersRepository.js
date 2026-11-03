import prisma from '../../config/database.js'


const findUserById = async (userId) => {
  // Dùng để kiểm tra User tồn tại trước khi Goal Service tạo Goal
  return await prisma.user.findUnique({
    where: {
      id: userId
    }
  })
}

// Tìm 1 user bằng email
const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email
    }
  })
}


// Tìm 1 user bằng username
const findUserByUsername = async (username) => {
  return await prisma.user.findUnique({
    where: {
      username
    }
  })
}


// Tìm user bằng email hoặc username
const findExistingUser = async (email, username) => {
  return await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  })
}


const createUser = async (userData) => {
  return await prisma.user.create({
    data: {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash
    }
  })
}

export const usersRepository = {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findExistingUser,
  createUser
}