/*
  Warnings:

  - The `status` column on the `pull_request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `source_repository_id` to the `pull_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_repository_id` to the `pull_request` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PullRequestStatus" AS ENUM ('OPEN', 'CLOSED', 'MERGED');

-- AlterTable
ALTER TABLE "pull_request" ADD COLUMN     "merged_at" TIMESTAMP(6),
ADD COLUMN     "source_repository_id" INTEGER NOT NULL,
ADD COLUMN     "target_repository_id" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PullRequestStatus" NOT NULL DEFAULT 'OPEN';

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_source_repository_id_fkey" FOREIGN KEY ("source_repository_id") REFERENCES "repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_target_repository_id_fkey" FOREIGN KEY ("target_repository_id") REFERENCES "repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
