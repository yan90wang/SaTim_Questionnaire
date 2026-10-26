/*
  Warnings:

  - Made the column `team_id` on table `survey` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "survey" DROP CONSTRAINT "survey_team_id_fkey";

-- AlterTable
ALTER TABLE "survey" ALTER COLUMN "team_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "survey" ADD CONSTRAINT "survey_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
