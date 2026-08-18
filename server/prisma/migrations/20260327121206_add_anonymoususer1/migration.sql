/*
  Warnings:

  - You are about to drop the `AnonymousUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "AnonymousUser";

-- CreateTable
CREATE TABLE "anonymousUser" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymousUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymousUser_externalId_key" ON "anonymousUser"("externalId");
