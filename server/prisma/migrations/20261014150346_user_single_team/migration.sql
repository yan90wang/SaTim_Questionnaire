/*
  Warnings:

  - You are about to drop the `team_access` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "team_access" DROP CONSTRAINT "team_access_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_access" DROP CONSTRAINT "team_access_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "team_id" INTEGER;

-- DropTable
DROP TABLE "team_access";

-- CreateIndex
CREATE INDEX "users_team_id_idx" ON "users"("team_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
