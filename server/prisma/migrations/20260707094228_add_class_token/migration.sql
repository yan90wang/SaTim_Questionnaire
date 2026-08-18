/*
  Warnings:

  - A unique constraint covering the columns `[registrationToken]` on the table `schoolClass` will be added. If there are existing duplicate values, this will fail.
  - The required column `registrationToken` was added to the `schoolClass` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "schoolClass" ADD COLUMN     "registrationToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "schoolClass_registrationToken_key" ON "schoolClass"("registrationToken");
