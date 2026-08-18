/*
  Warnings:

  - Added the required column `content` to the `question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."question" ADD COLUMN     "content" JSONB NOT NULL;
