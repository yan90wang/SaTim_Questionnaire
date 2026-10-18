-- AlterTable
ALTER TABLE "adaptiveAnswer" ADD COLUMN     "adaptiveProbsBinary" BYTEA;

-- AlterTable
ALTER TABLE "survey" ADD COLUMN     "knowledgeSpaceBinary" BYTEA,
ADD COLUMN     "ksNumberOfItems" INTEGER,
ADD COLUMN     "ksNumberOfStates" INTEGER;
