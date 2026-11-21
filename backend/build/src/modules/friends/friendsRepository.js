import prisma from "../../config/database.js";

// Lấy danh sách bạn bè đã ACCEPTED của một user
const findAcceptedFriends = async userId => {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{
        requesterId: userId
      }, {
        receiverId: userId
      }]
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          createdAt: true
        }
      },
      receiver: {
        select: {
          id: true,
          username: true,
          email: true,
          status: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      acceptedAt: 'desc'
    }
  });

  // Format trả về danh sách bạn (loại trừ chính userId)
  return friendships.map(f => {
    const friend = f.requesterId === userId ? f.receiver : f.requester;
    return {
      friendshipId: f.id,
      acceptedAt: f.acceptedAt,
      friend
    };
  });
};

// Tìm kiếm người dùng theo username/email
const searchUsers = async (query, currentUserId, blockedUserIds = []) => {
  const excludeIds = [currentUserId, ...blockedUserIds];
  return await prisma.user.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      id: {
        notIn: excludeIds
      },
      OR: [{
        username: {
          contains: query,
          mode: 'insensitive'
        }
      }, {
        email: {
          contains: query,
          mode: 'insensitive'
        }
      }]
    },
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      createdAt: true
    },
    take: 20
  });
};

// Lấy danh sách lời mời PENDING (cả gửi đến và gửi đi)
const findPendingFriendRequests = async userId => {
  const sent = await prisma.friendship.findMany({
    where: {
      requesterId: userId,
      status: 'PENDING'
    },
    include: {
      receiver: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const received = await prisma.friendship.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING'
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return {
    sent,
    received
  };
};

// Tìm quan hệ giữa 2 user theo bất kỳ chiều nào (u1 -> u2 hoặc u2 -> u1)
const findFriendshipBetween = async (u1, u2) => {
  return await prisma.friendship.findFirst({
    where: {
      OR: [{
        requesterId: u1,
        receiverId: u2
      }, {
        requesterId: u2,
        receiverId: u1
      }]
    }
  });
};
const findFriendshipById = async id => {
  return await prisma.friendship.findUnique({
    where: {
      id
    }
  });
};
const createFriendship = async data => {
  return await prisma.friendship.create({
    data
  });
};
const updateFriendship = async (id, data) => {
  return await prisma.friendship.update({
    where: {
      id
    },
    data
  });
};
const deleteFriendship = async id => {
  return await prisma.friendship.delete({
    where: {
      id
    }
  });
};

// Lấy danh sách ID các user bị block có liên quan tới user hiện tại
const findBlockedUserIds = async userId => {
  const blockedRecords = await prisma.friendship.findMany({
    where: {
      status: 'BLOCKED',
      OR: [{
        requesterId: userId
      }, {
        receiverId: userId
      }]
    },
    select: {
      requesterId: true,
      receiverId: true
    }
  });
  const ids = new Set();
  for (const b of blockedRecords) {
    if (b.requesterId !== userId) ids.add(b.requesterId);
    if (b.receiverId !== userId) ids.add(b.receiverId);
  }
  return Array.from(ids);
};
export const friendsRepository = {
  findAcceptedFriends,
  searchUsers,
  findPendingFriendRequests,
  findFriendshipBetween,
  findFriendshipById,
  createFriendship,
  updateFriendship,
  deleteFriendship,
  findBlockedUserIds
};