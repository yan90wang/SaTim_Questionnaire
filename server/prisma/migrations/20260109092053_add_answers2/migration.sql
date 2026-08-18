/*
  Warnings:

  - You are about to drop the `_AskedQuestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_AskedQuestions" DROP CONSTRAINT "_AskedQuestions_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_AskedQuestions" DROP CONSTRAINT "_AskedQuestions_B_fkey";

-- AlterTable
ALTER TABLE "answer" ADD COLUMN     "questionIds" INTEGER[];

-- DropTable
DROP TABLE "public"."_AskedQuestions";
