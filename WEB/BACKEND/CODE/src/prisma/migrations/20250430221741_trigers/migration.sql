-- AlterTable
ALTER TABLE "repository" ADD COLUMN     "forks_count" INTEGER DEFAULT 0,
ADD COLUMN     "pull_requests_count" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "confirmed" BOOLEAN DEFAULT false,
ADD COLUMN     "contribution_count" INTEGER DEFAULT 0;
