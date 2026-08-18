-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "teacherAssigned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "classTestInstance" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classTestInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "classTestInstance_classId_idx" ON "classTestInstance"("classId");

-- CreateIndex
CREATE INDEX "classTestInstance_surveyId_idx" ON "classTestInstance"("surveyId");

-- CreateIndex
CREATE UNIQUE INDEX "classTestInstance_surveyId_classId_key" ON "classTestInstance"("surveyId", "classId");

-- AddForeignKey
ALTER TABLE "classTestInstance" ADD CONSTRAINT "classTestInstance_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classTestInstance" ADD CONSTRAINT "classTestInstance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "schoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
