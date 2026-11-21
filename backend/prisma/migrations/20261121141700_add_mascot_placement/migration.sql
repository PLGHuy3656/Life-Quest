-- CreateEnum
CREATE TYPE "MascotPlacement" AS ENUM ('DASHBOARD', 'AUTH', 'PROFILE', 'ADMIN', 'SOCIAL');

-- AlterEnum
ALTER TYPE "MascotTriggerType" ADD VALUE 'ON_ENTER';

-- AlterTable
ALTER TABLE "MascotDialogue" ADD COLUMN     "placement" "MascotPlacement" NOT NULL DEFAULT 'DASHBOARD';
