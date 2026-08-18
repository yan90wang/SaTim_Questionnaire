/*
  Warnings:

  - A unique constraint covering the columns `[surveyId,instanceId,bookletId,userId]` on the table `answer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[answerId,questionId]` on the table `userAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "answer_surveyId_instanceId_bookletId_userId_key" ON "answer"("surveyId", "instanceId", "bookletId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "userAnswer_answerId_questionId_key" ON "userAnswer"("answerId", "questionId");
