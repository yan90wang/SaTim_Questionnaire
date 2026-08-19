-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "ksQuestionIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
