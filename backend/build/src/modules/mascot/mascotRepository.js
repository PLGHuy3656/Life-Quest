import prisma from "../../config/database.js";
const findAllModels = async () => {
  return await prisma.mascotModel.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      assetPath: true,
      requiredTier: true,
      sleepStartHour: true,
      sleepEndHour: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
};
const findModelByCode = async code => {
  return await prisma.mascotModel.findUnique({
    where: {
      code
    }
  });
};
const findModelWithDetails = async (code, placement = 'DASHBOARD') => {
  return await prisma.mascotModel.findUnique({
    where: {
      code
    },
    include: {
      dialogues: {
        where: {
          placement
        },
        select: {
          id: true,
          triggerType: true,
          placement: true,
          requiredTier: true,
          actionType: true,
          content: true,
          clipName: true,
          activity: true,
          mood: true
        }
      },
      actions: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          clipName: true,
          mood: true,
          requiredTier: true,
          cooldownSeconds: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
};
const findEquippedCosmetics = async (userId, mascotModelId) => {
  if (!userId) return [];
  const equipped = await prisma.userMascotCosmetic.findMany({
    where: {
      userId,
      isEquipped: true,
      cosmetic: {
        mascotModelId
      }
    },
    include: {
      cosmetic: {
        select: {
          code: true,
          name: true,
          slot: true,
          assetKey: true,
          requiredTier: true
        }
      }
    }
  });
  return equipped.map(item => ({
    code: item.cosmetic.code,
    name: item.cosmetic.name,
    slot: item.cosmetic.slot,
    assetKey: item.cosmetic.assetKey,
    requiredTier: item.cosmetic.requiredTier,
    equippedAt: item.equippedAt
  }));
};
const findCosmeticsByModelCode = async modelCode => {
  return await prisma.mascotCosmetic.findMany({
    where: {
      mascotModel: {
        code: modelCode
      },
      isActive: true
    },
    select: {
      id: true,
      mascotModelId: true,
      code: true,
      name: true,
      slot: true,
      assetKey: true,
      coinPrice: true,
      requiredTier: true,
      isActive: true,
      createdAt: true
    },
    orderBy: [{
      slot: 'asc'
    }, {
      coinPrice: 'asc'
    }]
  });
};
const findUserCosmetics = async (userId, mascotModelId) => {
  if (!userId) return [];
  return await prisma.userMascotCosmetic.findMany({
    where: {
      userId,
      cosmetic: {
        mascotModelId
      }
    }
  });
};
const findCosmeticByCode = async code => {
  return await prisma.mascotCosmetic.findUnique({
    where: {
      code
    },
    include: {
      mascotModel: true
    }
  });
};
const findUserCosmetic = async (userId, cosmeticId) => {
  return await prisma.userMascotCosmetic.findUnique({
    where: {
      userId_cosmeticId: {
        userId,
        cosmeticId
      }
    }
  });
};
const equipCosmeticInSlot = async (userId, cosmetic) => {
  return await prisma.$transaction(async tx => {
    // 1. Tìm tất cả các món cùng slot của model này
    const sameSlotCosmetics = await tx.mascotCosmetic.findMany({
      where: {
        mascotModelId: cosmetic.mascotModelId,
        slot: cosmetic.slot
      },
      select: {
        id: true
      }
    });
    const sameSlotIds = sameSlotCosmetics.map(c => c.id);

    // 2. Tháo trang bị tất cả các món cùng slot đang mặc
    await tx.userMascotCosmetic.updateMany({
      where: {
        userId,
        cosmeticId: {
          in: sameSlotIds
        },
        isEquipped: true
      },
      data: {
        isEquipped: false,
        equippedAt: null
      }
    });

    // 3. Đeo món mới (upsert đảm bảo nếu user đã sở hữu hay mới cấp đều đeo được)
    return await tx.userMascotCosmetic.upsert({
      where: {
        userId_cosmeticId: {
          userId,
          cosmeticId: cosmetic.id
        }
      },
      update: {
        isEquipped: true,
        equippedAt: new Date()
      },
      create: {
        userId,
        cosmeticId: cosmetic.id,
        isEquipped: true,
        equippedAt: new Date()
      },
      include: {
        cosmetic: true
      }
    });
  });
};
const unequipCosmetic = async (userId, cosmeticId) => {
  return await prisma.userMascotCosmetic.updateMany({
    where: {
      userId,
      cosmeticId,
      isEquipped: true
    },
    data: {
      isEquipped: false,
      equippedAt: null
    }
  });
};
const findActionByCode = async code => {
  return await prisma.mascotAction.findUnique({
    where: {
      code
    },
    include: {
      mascotModel: true
    }
  });
};
export const mascotRepository = {
  findAllModels,
  findModelByCode,
  findModelWithDetails,
  findEquippedCosmetics,
  findCosmeticsByModelCode,
  findUserCosmetics,
  findCosmeticByCode,
  findUserCosmetic,
  equipCosmeticInSlot,
  unequipCosmetic,
  findActionByCode
};