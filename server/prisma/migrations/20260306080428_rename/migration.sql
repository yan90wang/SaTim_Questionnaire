/*
  Warnings:

  - You are about to drop the `BookletQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuestionSolvingSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BookletQuestion" DROP CONSTRAINT "BookletQuestion_bookletId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BookletQuestion" DROP CONSTRAINT "BookletQuestion_questionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QuestionSolvingSession" DROP CONSTRAINT "QuestionSolvingSession_questionAnswerId_fkey";

-- DropTable
DROP TABLE "public"."BookletQuestion";

-- DropTable
DROP TABLE "public"."QuestionSolvingSession";

-- CreateTable
CREATE TABLE "bookletQuestion" (
    "bookletId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "bookletQuestion_pkey" PRIMARY KEY ("bookletId","questionId")
);

-- CreateTable
CREATE TABLE "questionSolvingSession" (
    "id" SERIAL NOT NULL,
    "questionAnswerId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),

    CONSTRAINT "questionSolvingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookletQuestion_bookletId_position_key" ON "bookletQuestion"("bookletId", "position");

-- CreateIndex
CREATE INDEX "questionSolvingSession_questionAnswerId_idx" ON "questionSolvingSession"("questionAnswerId");

-- AddForeignKey
ALTER TABLE "bookletQuestion" ADD CONSTRAINT "bookletQuestion_bookletId_fkey" FOREIGN KEY ("bookletId") REFERENCES "booklet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookletQuestion" ADD CONSTRAINT "bookletQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionSolvingSession" ADD CONSTRAINT "questionSolvingSession_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "questionAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
