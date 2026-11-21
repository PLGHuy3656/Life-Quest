-- DropForeignKey
ALTER TABLE "MascotDialogue" DROP CONSTRAINT "MascotDialogue_mascotModelId_fkey";

-- DropForeignKey
ALTER TABLE "PostComment" DROP CONSTRAINT "PostComment_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostReaction" DROP CONSTRAINT "PostReaction_postId_fkey";

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MascotDialogue" ADD CONSTRAINT "MascotDialogue_mascotModelId_fkey" FOREIGN KEY ("mascotModelId") REFERENCES "MascotModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
