-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "bookletMappingExcelUrl" TEXT;

-- CreateTable
CREATE TABLE "booklet" (
    "id" SERIAL NOT NULL,
    "bookletId" INTEGER NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "questionIds" INTEGER[],
    "excelFileUrl" TEXT NOT NULL,
    "assignedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "booklet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booklet_surveyId_idx" ON "booklet"("surveyId");

-- AddForeignKey
ALTER TABLE "booklet" ADD CONSTRAINT "booklet_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booklet" ADD CONSTRAINT "booklet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
