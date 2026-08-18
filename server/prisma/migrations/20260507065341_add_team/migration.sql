/*
  Warnings:

  - You are about to drop the column `group_id` on the `question` table. All the data in the column will be lost.
  - You are about to drop the `group_access` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_access" DROP CONSTRAINT "group_access_user_id_fkey";

-- AlterTable
ALTER TABLE "question" DROP COLUMN "group_id",
ADD COLUMN     "team_id" INTEGER;

-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "team_id" INTEGER;

-- AlterTable
ALTER TABLE "surveyInstance" ADD COLUMN     "team_id" INTEGER;

-- DropTable
DROP TABLE "group_access";

-- CreateTable
CREATE TABLE "team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_access" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "team_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_name_key" ON "team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_access_team_id_user_id_key" ON "team_access"("team_id", "user_id");

-- AddForeignKey
ALTER TABLE "team_access" ADD CONSTRAINT "team_access_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_access" ADD CONSTRAINT "team_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveyInstance" ADD CONSTRAINT "surveyInstance_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
