-- AlterTable
ALTER TABLE "booklet" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "bookletVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "surveyInstance" ADD COLUMN     "bookletVersion" INTEGER NOT NULL DEFAULT 1;
