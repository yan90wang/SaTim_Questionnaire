/*
  Warnings:

  - You are about to drop the column `content` on the `question` table. All the data in the column will be lost.
  - Added the required column `contentHtml` to the `question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentJson` to the `question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "question" DROP COLUMN "content",
ADD COLUMN     "contentHtml" TEXT NOT NULL,
ADD COLUMN     "contentJson" JSONB NOT NULL;
