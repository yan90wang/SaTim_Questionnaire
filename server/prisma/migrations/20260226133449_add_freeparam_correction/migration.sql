/*
  Warnings:

  - You are about to drop the column `freeParam` on the `surveyInstance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "answer" ADD COLUMN     "freeParam" TEXT;

-- AlterTable
ALTER TABLE "surveyInstance" DROP COLUMN "freeParam";
