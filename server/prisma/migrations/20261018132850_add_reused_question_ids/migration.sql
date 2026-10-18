-- AlterTable
ALTER TABLE "adaptiveAnswer" ADD COLUMN     "reusedQuestionIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
