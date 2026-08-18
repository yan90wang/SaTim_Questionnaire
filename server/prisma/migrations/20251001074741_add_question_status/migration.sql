/*
  Warnings:

  - Added the required column `status` to the `question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."question_status" AS ENUM ('ACTIVE', 'FINISHED', 'DELETED');

-- AlterTable
ALTER TABLE "public"."question" ADD COLUMN     "status" "public"."question_status" NOT NULL;
