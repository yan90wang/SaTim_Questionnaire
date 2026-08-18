/*
  Warnings:

  - A unique constraint covering the columns `[adaptiveAnswerId,questionId]` on the table `questionAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "questionAnswer" DROP CONSTRAINT "questionAnswer_answerId_fkey";

-- AlterTable
ALTER TABLE "questionAnswer" ADD COLUMN     "adaptiveAnswerId" INTEGER,
ALTER COLUMN "answerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "adaptiveAnswer" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "surveyInstanceId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "questionIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "freeParam" TEXT,
    "adaptiveProbs" JSONB,
    "currentQuestionId" INTEGER,
    "knowledgeSpace" JSONB NOT NULL,

    CONSTRAINT "adaptiveAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adaptiveAnswer_userId_surveyInstanceId_idx" ON "adaptiveAnswer"("userId", "surveyInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "adaptiveAnswer_surveyId_surveyInstanceId_userId_key" ON "adaptiveAnswer"("surveyId", "surveyInstanceId", "userId");

-- CreateIndex
CREATE INDEX "questionAnswer_answerId_idx" ON "questionAnswer"("answerId");

-- CreateIndex
CREATE INDEX "questionAnswer_adaptiveAnswerId_idx" ON "questionAnswer"("adaptiveAnswerId");

-- CreateIndex
CREATE UNIQUE INDEX "questionAnswer_adaptiveAnswerId_questionId_key" ON "questionAnswer"("adaptiveAnswerId", "questionId");

-- AddForeignKey
ALTER TABLE "adaptiveAnswer" ADD CONSTRAINT "adaptiveAnswer_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adaptiveAnswer" ADD CONSTRAINT "adaptiveAnswer_surveyInstanceId_fkey" FOREIGN KEY ("surveyInstanceId") REFERENCES "surveyInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionAnswer" ADD CONSTRAINT "questionAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionAnswer" ADD CONSTRAINT "questionAnswer_adaptiveAnswerId_fkey" FOREIGN KEY ("adaptiveAnswerId") REFERENCES "adaptiveAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
