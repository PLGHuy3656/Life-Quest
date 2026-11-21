import prisma from "../../config/database.js";

// Lấy danh sách bài viết cho Feed theo cursor pagination
const findFeedPosts = async ({
  currentUserId,
  friendIds,
  limit = 20,
  cursorPost = null
}) => {
  const whereConditions = {
    deletedAt: null,
    OR: [
    // Bài viết của chính mình (mọi visibility)
    {
      authorId: currentUserId
    },
    // Bài viết của bạn bè (FRIENDS hoặc PUBLIC)
    {
      authorId: {
        in: friendIds
      },
      visibility: {
        in: ['FRIENDS', 'PUBLIC']
      }
    }]
  };
  if (cursorPost) {
    whereConditions.AND = [{
      OR: [{
        createdAt: {
          lt: cursorPost.createdAt
        }
      }, {
        createdAt: cursorPost.createdAt,
        id: {
          lt: cursorPost.id
        }
      }]
    }];
  }
  const posts = await prisma.socialPost.findMany({
    where: whereConditions,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      reactions: {
        select: {
          id: true,
          userId: true,
          type: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          comments: {
            where: {
              deletedAt: null
            }
          },
          reactions: true
        }
      }
    },
    orderBy: [{
      createdAt: 'desc'
    }, {
      id: 'desc'
    }],
    take: limit + 1
  });
  let nextCursor = null;
  let items = posts;
  if (posts.length > limit) {
    const nextItem = posts[limit];
    nextCursor = nextItem.id;
    items = posts.slice(0, limit);
  }
  return {
    items: items.map(p => ({
      id: p.id,
      authorId: p.authorId,
      author: p.author,
      content: p.content,
      mediaUrl: p.mediaUrl,
      sourceType: p.sourceType,
      sourceId: p.sourceId,
      visibility: p.visibility,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      reactions: p.reactions,
      reactionCount: p._count.reactions,
      commentCount: p._count.comments
    })),
    nextCursor
  };
};
const findPostById = async postId => {
  return await prisma.socialPost.findUnique({
    where: {
      id: postId
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      },
      reactions: {
        select: {
          id: true,
          userId: true,
          type: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          comments: {
            where: {
              deletedAt: null
            }
          },
          reactions: true
        }
      }
    }
  });
};
const createPost = async data => {
  return await prisma.socialPost.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
};
const updatePost = async (postId, data) => {
  return await prisma.socialPost.update({
    where: {
      id: postId
    },
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
};
const softDeletePost = async postId => {
  return await prisma.socialPost.update({
    where: {
      id: postId
    },
    data: {
      deletedAt: new Date()
    }
  });
};
const upsertReaction = async (postId, userId, type) => {
  return await prisma.postReaction.upsert({
    where: {
      postId_userId: {
        postId,
        userId
      }
    },
    update: {
      type
    },
    create: {
      postId,
      userId,
      type
    }
  });
};
const deleteReaction = async (postId, userId) => {
  return await prisma.postReaction.deleteMany({
    where: {
      postId,
      userId
    }
  });
};
const findCommentsByPostId = async postId => {
  return await prisma.postComment.findMany({
    where: {
      postId,
      deletedAt: null
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
};
const findCommentById = async commentId => {
  return await prisma.postComment.findUnique({
    where: {
      id: commentId
    }
  });
};
const createComment = async data => {
  return await prisma.postComment.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });
};
const softDeleteComment = async commentId => {
  return await prisma.postComment.update({
    where: {
      id: commentId
    },
    data: {
      deletedAt: new Date()
    }
  });
};
const findLatestPoke = async (senderId, receiverId) => {
  return await prisma.poke.findFirst({
    where: {
      senderId,
      receiverId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};
const createPoke = async data => {
  return await prisma.poke.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          username: true
        }
      },
      receiver: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });
};
export const socialRepository = {
  findFeedPosts,
  findPostById,
  createPost,
  updatePost,
  softDeletePost,
  upsertReaction,
  deleteReaction,
  findCommentsByPostId,
  findCommentById,
  createComment,
  softDeleteComment,
  findLatestPoke,
  createPoke
};