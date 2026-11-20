-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('SIMPLE', 'QUANTITY', 'DURATION', 'PROGRESS', 'FOCUS');

-- CreateEnum
CREATE TYPE "ProofRequirement" AS ENUM ('NONE', 'OPTIONAL', 'REQUIRED');

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "coinReward" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDurationSeconds" INTEGER,
ADD COLUMN     "priority" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "proofRequirement" "ProofRequirement" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "startAt" TIMESTAMP(3),
ADD COLUMN     "targetUnit" VARCHAR(50),
ADD COLUMN     "targetValue" DECIMAL(12,2),
ADD COLUMN     "type" "QuestType" NOT NULL DEFAULT 'SIMPLE',
ADD COLUMN     "xpReward" INTEGER NOT NULL DEFAULT 0;
