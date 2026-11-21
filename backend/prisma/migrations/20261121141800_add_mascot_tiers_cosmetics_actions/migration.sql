-- CreateEnum
CREATE TYPE "AccessTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "CosmeticSlot" AS ENUM ('ATT_HAT', 'ATT_GLASSES', 'ATT_SCARF', 'ATT_BACKPACK', 'ATT_HAND_L', 'ATT_HAND_R');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MascotPlacement" ADD VALUE 'FOCUS';
ALTER TYPE "MascotPlacement" ADD VALUE 'SHOP';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MascotTriggerType" ADD VALUE 'EMPTY_STATE';
ALTER TYPE "MascotTriggerType" ADD VALUE 'FOCUS_INTERRUPTED';

-- AlterTable
ALTER TABLE "MascotDialogue" ADD COLUMN     "actionType" TEXT,
ADD COLUMN     "requiredTier" "AccessTier" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "MascotModel" ADD COLUMN     "requiredTier" "AccessTier" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planType" "AccessTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MascotAction" (
    "id" TEXT NOT NULL,
    "mascotModelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clipName" TEXT NOT NULL,
    "mood" TEXT,
    "requiredTier" "AccessTier" NOT NULL DEFAULT 'FREE',
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MascotAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MascotCosmetic" (
    "id" TEXT NOT NULL,
    "mascotModelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" "CosmeticSlot" NOT NULL,
    "assetKey" TEXT NOT NULL,
    "coinPrice" INTEGER NOT NULL DEFAULT 0,
    "requiredTier" "AccessTier" NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MascotCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMascotCosmetic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cosmeticId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "equippedAt" TIMESTAMP(3),
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMascotCosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MascotAction_code_key" ON "MascotAction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MascotCosmetic_code_key" ON "MascotCosmetic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserMascotCosmetic_userId_cosmeticId_key" ON "UserMascotCosmetic"("userId", "cosmeticId");

-- AddForeignKey
ALTER TABLE "MascotAction" ADD CONSTRAINT "MascotAction_mascotModelId_fkey" FOREIGN KEY ("mascotModelId") REFERENCES "MascotModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MascotCosmetic" ADD CONSTRAINT "MascotCosmetic_mascotModelId_fkey" FOREIGN KEY ("mascotModelId") REFERENCES "MascotModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMascotCosmetic" ADD CONSTRAINT "UserMascotCosmetic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMascotCosmetic" ADD CONSTRAINT "UserMascotCosmetic_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "MascotCosmetic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
