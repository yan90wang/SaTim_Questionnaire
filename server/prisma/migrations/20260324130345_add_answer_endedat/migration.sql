/*
  Warnings:

  - You are about to drop the column `answered` on the `questionAnswer` table. All the data in the column will be lost.
  - You are about to drop the `quizUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "answer" ADD COLUMN     "endedAt" TIMESTAMP(3);
