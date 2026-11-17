import prisma from "../config/prismaClient.js";
import {binaryToProbs} from "../services/quizService.js";

async function updateMaxProbs() {
    const batchSize = 20;
    let lastId = 0;
    let updated = 0;
    let skipped = 0;

    while (true) {
        const answers = await prisma.adaptiveAnswer.findMany({
            where: {
                id: { gt: lastId },
                maxProb: null,
            },
            select: {
                id: true,
                adaptiveProbs: true,
                adaptiveProbsBinary: true,
            },
            orderBy: { id: "asc" },
            take: batchSize,
        });

        if (answers.length === 0) break;

        for (const answer of answers) {
            lastId = answer.id;

            try {
                let probs: number[];

                if (answer.adaptiveProbsBinary !== null) {
                    probs = binaryToProbs(
                        answer.adaptiveProbsBinary
                    );
                } else if (Array.isArray(answer.adaptiveProbs)) {
                    probs = answer.adaptiveProbs as number[];
                } else {
                    skipped++;
                    continue;
                }

                if (
                    probs.length === 0 ||
                    !probs.every(
                        p => Number.isFinite(p) && p >= 0
                    )
                ) {
                    skipped++;
                    continue;
                }

                let maxProb = 0;

                for (const prob of probs) {
                    if (prob > maxProb) {
                        maxProb = prob;
                    }
                }

                await prisma.adaptiveAnswer.update({
                    where: { id: answer.id },
                    data: { maxProb },
                });

                updated++;
                console.log(
                    `Updated ${answer.id}: ${maxProb.toFixed(6)}`
                );
            } catch (error) {
                skipped++;
                console.error(
                    `Failed ${answer.id}:`,
                    error
                );
            }
        }
    }

    console.log(`Finished: ${updated} updated, ${skipped} skipped`);
}

updateMaxProbs()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
