/*
  Warnings:

  - You are about to drop the `userAnswer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."userAnswer" DROP CONSTRAINT "userAnswer_answerId_fkey";

-- DropTable
DROP TABLE "public"."userAnswer";

-- CreateTable
CREATE TABLE "questionAnswer" (
    "id" SERIAL NOT NULL,
    "answerId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answerJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvedTime" TIMESTAMP(3),
    "solvingTimeStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "solvingTimeEnd" TIMESTAMP(3),

    CONSTRAINT "questionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AskedQuestions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AskedQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "questionAnswer_answerId_questionId_key" ON "questionAnswer"("answerId", "questionId");

-- CreateIndex
CREATE INDEX "_AskedQuestions_B_index" ON "_AskedQuestions"("B");

-- AddForeignKey
ALTER TABLE "questionAnswer" ADD CONSTRAINT "questionAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AskedQuestions" ADD CONSTRAINT "_AskedQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AskedQuestions" ADD CONSTRAINT "_AskedQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
