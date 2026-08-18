-- AlterTable
ALTER TABLE "questionAnswer" ALTER COLUMN "solvedTime" SET DEFAULT 0.0;

-- CreateIndex
CREATE INDEX "answer_userId_instanceId_idx" ON "answer"("userId", "instanceId");
