/*
  Warnings:

  - You are about to drop the column `freeParam` on the `survey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "survey" DROP COLUMN "freeParam";

-- AlterTable
ALTER TABLE "surveyInstance" ADD COLUMN     "freeParam" TEXT;
