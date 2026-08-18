/*
  Warnings:

  - Added the required column `type` to the `schoolClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthday` to the `sus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `sus` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SchoolClassType" AS ENUM ('KANTI_KURZ_1', 'KANTI_KURZ_2', 'KANTI_LANG_1', 'SEK_7', 'SEK_8', 'SEK_9');

-- AlterTable
ALTER TABLE "schoolClass" ADD COLUMN     "type" "SchoolClassType" NOT NULL;

-- AlterTable
ALTER TABLE "sus" ADD COLUMN     "birthday" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "schoolClass_teacherId_idx" ON "schoolClass"("teacherId");

-- CreateIndex
CREATE INDEX "sus_classId_idx" ON "sus"("classId");
