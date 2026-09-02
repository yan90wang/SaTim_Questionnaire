-- AlterTable
ALTER TABLE "adaptiveAnswer" ADD COLUMN     "quizFinished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "answer" ADD COLUMN     "quizFinished" BOOLEAN NOT NULL DEFAULT false;
