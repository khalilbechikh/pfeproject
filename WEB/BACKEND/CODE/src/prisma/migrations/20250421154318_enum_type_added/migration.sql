/*
  Warnings:

  - Changed the type of `access_level` on the `repository_access` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RepositoryAccess" AS ENUM ('view', 'edit');

-- AlterTable
ALTER TABLE "repository_access" DROP COLUMN "access_level",
ADD COLUMN     "access_level" "RepositoryAccess" NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_admin" BOOLEAN DEFAULT false;
