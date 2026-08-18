/*
  Warnings:

  - You are about to drop the column `questionIds` on the `booklet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booklet" DROP COLUMN "questionIds";

-- CreateTable
CREATE TABLE "_BookletQuestions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BookletQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BookletQuestions_B_index" ON "_BookletQuestions"("B");

-- AddForeignKey
ALTER TABLE "_BookletQuestions" ADD CONSTRAINT "_BookletQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "booklet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookletQuestions" ADD CONSTRAINT "_BookletQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
