-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "isTwoTier" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "feedbackAnswer" (
    "id" SERIAL NOT NULL,
    "questionAnswerId" INTEGER NOT NULL,
    "questionKey" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbackAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedbackAnswer_questionAnswerId_questionKey_key" ON "feedbackAnswer"("questionAnswerId", "questionKey");

-- AddForeignKey
ALTER TABLE "feedbackAnswer" ADD CONSTRAINT "feedbackAnswer_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "questionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
