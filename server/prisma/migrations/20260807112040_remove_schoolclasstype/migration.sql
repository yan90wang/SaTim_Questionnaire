/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `student` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `schoolClass` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "schoolClass" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SchoolClassType";

-- CreateIndex
CREATE UNIQUE INDEX "student_email_key" ON "student"("email");
