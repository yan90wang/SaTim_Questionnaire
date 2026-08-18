/*
  Warnings:

  - You are about to drop the `_BookletQuestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_BookletQuestions" DROP CONSTRAINT "_BookletQuestions_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_BookletQuestions" DROP CONSTRAINT "_BookletQuestions_B_fkey";

-- DropTable
DROP TABLE "public"."_BookletQuestions";

-- CreateTable
CREATE TABLE "BookletQuestion" (
    "bookletId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "BookletQuestion_pkey" PRIMARY KEY ("bookletId","questionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookletQuestion_bookletId_position_key" ON "BookletQuestion"("bookletId", "position");

-- AddForeignKey
ALTER TABLE "BookletQuestion" ADD CONSTRAINT "BookletQuestion_bookletId_fkey" FOREIGN KEY ("bookletId") REFERENCES "booklet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookletQuestion" ADD CONSTRAINT "BookletQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
