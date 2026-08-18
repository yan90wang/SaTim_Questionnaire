-- CreateEnum
CREATE TYPE "survey_status" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'FINISHED');

-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "status" "survey_status" NOT NULL DEFAULT 'IN_PROGRESS';
