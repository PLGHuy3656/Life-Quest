import prisma from '../../config/database.js'


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
  findUserByEmail,
  findUserByUsername,
  findExistingUser,
  createUser
}