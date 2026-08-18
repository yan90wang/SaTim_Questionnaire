/*
  Warnings:

  - The `solvedTime` column on the `questionAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "questionAnswer" DROP COLUMN "solvedTime",
ADD COLUMN     "solvedTime" INTEGER;
