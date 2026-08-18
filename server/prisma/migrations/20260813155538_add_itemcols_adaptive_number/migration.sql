/*
  Warnings:

  - The `itemColumns` column on the `adaptiveAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "adaptiveAnswer" DROP COLUMN "itemColumns",
ADD COLUMN     "itemColumns" INTEGER[];
