-- AlterTable
ALTER TABLE "booklet" ALTER COLUMN "version" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "survey" ALTER COLUMN "bookletVersion" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "surveyInstance" ALTER COLUMN "bookletVersion" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "answer" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "instanceId" INTEGER NOT NULL,
    "bookletId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "surveyInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_bookletId_fkey" FOREIGN KEY ("bookletId") REFERENCES "booklet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
