-- CreateTable
CREATE TABLE "QuestionSolvingSession" (
    "id" SERIAL NOT NULL,
    "questionAnswerId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "QuestionSolvingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionSolvingSession_questionAnswerId_idx" ON "QuestionSolvingSession"("questionAnswerId");

-- AddForeignKey
ALTER TABLE "QuestionSolvingSession" ADD CONSTRAINT "QuestionSolvingSession_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "questionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
