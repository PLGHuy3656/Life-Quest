import prisma from '../../config/database.js'

// Lấy danh sách bạn bè chính thức (status = 'ACCEPTED')
const findFriends = async (userId) => {
  return await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { receiverId: userId, status: 'ACCEPTED' }
      ]
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          profile: true,
          gamification: {
            select: { level: true, totalXp: true }
          }
        }
      },
      receiver: {
        select: {
          id: true,
          username: true,
          profile: true,
          gamification: {
            select: { level: true, totalXp: true }
          }
        }
      }
    },
    orderBy: { acceptedAt: 'desc' }
  })
}

// Tìm kiếm người dùng theo username/displayName
const searchUsers = async (queryText, currentUserId) => {
  return await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      deletedAt: null,
      status: 'ACTIVE',
      OR: [
        { username: { contains: queryText, mode: 'insensitive' } },
        { email: { contains: queryText, mode: 'insensitive' } },
        {
          profile: {
            displayName: { contains: queryText, mode: 'insensitive' }
          }
        }
      ]
    },
    select: {
      id: true,
      username: true,
      profile: true,
      gamification: {
        select: { level: true }
      }
    },
    take: 20
  })
}

// Lấy danh sách yêu cầu kết bạn
const findFriendRequests = async (userId, type = 'incoming') => {
  const where = {
    status: 'PENDING'
  }

  if (type === 'incoming') {
    where.receiverId = userId
  } else {
    where.requesterId = userId
  }

  return await prisma.friendship.findMany({
    where,
    include: {
      requester: {
        select: { id: true, username: true, profile: true }
      },
      receiver: {
        select: { id: true, username: true, profile: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Tìm kiếm mối quan hệ giữa 2 người dùng
const findRelationshipBetween = async (userId1, userId2) => {
  return await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId1, receiverId: userId2 },
        { requesterId: userId2, receiverId: userId1 }
      ]
    }
  })
}

// Tìm quan hệ theo ID
const findFriendshipById = async (id) => {
  return await prisma.friendship.findUnique({
    where: { id },
    include: {
      requester: true,
      receiver: true
    }
  })
}

// Tạo lời mời kết bạn mới
const createFriendship = async (requesterId, receiverId) => {
  return await prisma.friendship.create({
    data: {
      requesterId,
      receiverId,
      status: 'PENDING'
    }
  })
}

// Cập nhật trạng thái quan hệ bạn bè
const updateFriendship = async (id, data) => {
  return await prisma.friendship.update({
    where: { id },
    data
  })
}

// Xóa quan hệ bạn bè
const deleteFriendship = async (id) => {
  return await prisma.friendship.delete({
    where: { id }
  })
}

// Tạo bản ghi Poke
const createPoke = async (senderId, receiverId) => {
  return await prisma.poke.create({
    data: {
      senderId,
      receiverId
    }
  })
}

// Tìm lượt poke gần nhất giữa 2 người
const findLastPoke = async (senderId, receiverId) => {
  return await prisma.poke.findFirst({
    where: {
      senderId,
      receiverId
    },
    orderBy: { createdAt: 'desc' }
  })
}

export const friendsRepository = {
  findFriends,
  searchUsers,
  findFriendRequests,
  findRelationshipBetween,
  findFriendshipById,
  createFriendship,
  updateFriendship,
  deleteFriendship,
  createPoke,
  findLastPoke
}
