/*
  Warnings:

  - You are about to drop the column `answers` on the `answer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "answer" DROP COLUMN "answers";

-- CreateTable
CREATE TABLE "userAnswer" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "userAnswer" ADD CONSTRAINT "userAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
