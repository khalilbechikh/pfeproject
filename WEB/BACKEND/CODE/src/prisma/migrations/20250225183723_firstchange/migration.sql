-- AlterTable
ALTER TABLE "repository" ADD COLUMN     "forked_at" TIMESTAMP(6),
ADD COLUMN     "parent_id" INTEGER;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
