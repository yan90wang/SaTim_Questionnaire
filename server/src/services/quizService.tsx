import prisma from "../config/prismaClient.js";
import type {Prisma} from "@prisma/client";
import type {survey, surveyInstance} from "@prisma/client";
import * as XLSX from "xlsx";
import {bayesianUpdate, halfsplitQuestion} from "./assessmentService.js";
import {evaluateAnswersService} from "./solverService.js";

export interface QuizQuestion {
    id: number;
    contentJson?: any;
    contentHtml?: string | null;
    correctAnswers?: any;
}

export interface NextQuestion {
    surveyId: number;
    surveyTitle: string;
    instanceId: number;
    bookletId: number;
    question: QuizQuestion | null;
    answerId: number;
    totalQuestions: number;
    answeredQuestions: number;
    questionIds: number[];
    answeredQuestionIds: number[];
    previousAnswer?: any;
    skipped: boolean;
    skippedQuestions: number[];
    isTwoTier: boolean;
    feedback?: Record<string, string> | null;
    solved: boolean;
    isAdaptive: boolean;
}

export async function getQuiz(instanceId: string, userId: string, questionId?: number, nextQuestionId?: number, freeParam?: string): Promise<NextQuestion> {
    const instance = await prisma.surveyInstance.findUnique({
        where: {id: Number(instanceId)},
    });
    if (!instance) throw new Error("Testlauf nicht gefunden.");
    const now = new Date();
    if (now < instance.validFrom || now > instance.validTo) {
        throw new Error("NOT_ACTIVE")
    }
    const survey = await prisma.survey.findUnique({
        where: {id: instance.surveyId},
    });
    if (!survey) throw new Error("Test nicht gefunden.");
    if (survey.mode === "ADAPTIV") {
        return getAdaptiveQuiz(survey, instance, userId, questionId, nextQuestionId, freeParam);
    }
    return getDesignQuiz(survey, instance, userId, questionId, nextQuestionId, freeParam);
}

const getAdaptiveQuiz = async (survey: survey, instance: surveyInstance, userId: string, questionId?: number, nextQuestionId?: number, freeParam?: string): Promise<NextQuestion> => {
    let adaptiveAnswer = await prisma.adaptiveAnswer.findUnique({
        where: {
            surveyId_surveyInstanceId_userId: {
                surveyId: survey.id,
                surveyInstanceId: instance.id,
                userId,
            },
        },
        include: {
            questionsAnswers: {
                include: {
                    feedbackAnswer: true,
                },
            },
        },
    });

    if (!adaptiveAnswer) {
        if (!survey.knowledgeSpaceFileUrl) {
            throw new Error("KNOWLEDGE_SPACE_NOT_FOUND");
        }
        if (!survey.probabilityDistributionFileUrl) {
            throw new Error("Prob_file_NOT_FOUND");
        }
        const {ks, itemColumns} = await fetchKnowledgeSpace(survey.knowledgeSpaceFileUrl);
        const initialProbs = await fetchProbabilityDistribution(survey.probabilityDistributionFileUrl);
        adaptiveAnswer = await prisma.adaptiveAnswer.create({
            data: {
                surveyId: survey.id,
                surveyInstanceId: instance.id,
                userId,
                knowledgeSpace: ks,
                adaptiveProbs: initialProbs,
                freeParam: freeParam ?? null,
                questionIds: [],
                itemColumns: itemColumns
            },
            include: {
                questionsAnswers: {
                    include: {
                        feedbackAnswer: true,
                    },
                },
            },
        });
    }
    if (!adaptiveAnswer) {throw new Error("adaptive answer should exist");}

    const ks = adaptiveAnswer.knowledgeSpace as number[][];
    const itemColumns = adaptiveAnswer.itemColumns as number[];
    const questionIds = adaptiveAnswer.questionIds;
    const probs = adaptiveAnswer.adaptiveProbs as number[];
    let nextQuestion: QuizQuestion | null = null;
    const threshold = survey.adaptiveThreshold;
    if (threshold !== null && probs.some(prob => prob >= threshold)) {
        await prisma.adaptiveAnswer.update({
            where: {
                id: adaptiveAnswer.id,
            },
            data: {
                quizFinished: true
            },
        });
        return {
            surveyId: survey.id,
            surveyTitle: survey.title,
            instanceId: instance.id,
            question: null,
            answerId: adaptiveAnswer.id,
            bookletId: 99999,
            totalQuestions: adaptiveAnswer.questionIds.length,
            answeredQuestions: adaptiveAnswer.questionsAnswers
                .filter(qa => qa.solved || qa.skipped)
                .length,
            questionIds: adaptiveAnswer.questionIds,
            answeredQuestionIds: adaptiveAnswer.questionsAnswers
                .filter(qa => qa.solved || qa.skipped)
                .map(qa => qa.questionId),
            skipped: false,
            solved: false,
            previousAnswer: null,
            skippedQuestions: adaptiveAnswer.questionsAnswers
                .filter(qa => qa.skipped)
                .map(qa => qa.questionId),
            isTwoTier: survey.isTwoTier,
            feedback: null,
            isAdaptive: true,
        };
    }
    const selectedItemIndex  = await halfsplitQuestion(probs, ks);
    const selectedQuestionId = itemColumns[selectedItemIndex-1];
    if (selectedQuestionId === undefined) {throw new Error(`No question ID found for item index ${selectedItemIndex}`);}
    nextQuestion = await prisma.question.findUnique({
        where: {
            id: selectedQuestionId,
        }
    });

    if (nextQuestion) {
        await prisma.questionAnswer.upsert({
            where: {
                adaptiveAnswerId_questionId: {
                    adaptiveAnswerId: adaptiveAnswer.id,
                    questionId: nextQuestion.id,
                },
            },
            create: {
                adaptiveAnswerId: adaptiveAnswer.id,
                questionId: nextQuestion.id,
            },
            update: {},
        });
        if (!questionIds.includes(nextQuestion.id)) {
            questionIds.push(nextQuestion.id);

            await prisma.adaptiveAnswer.update({
                where: {
                    id: adaptiveAnswer.id,
                },
                data: {
                    questionIds,
                    currentQuestionId: nextQuestion.id,
                },
            });
        }
    }
    const cleanNextQuestion: QuizQuestion | null = nextQuestion ? {
        id: nextQuestion.id,
        contentJson: nextQuestion.contentJson,
    } : null;
    return {
        surveyId: survey.id,
        surveyTitle: survey.title,
        instanceId: instance.id,
        question: cleanNextQuestion,
        answerId: adaptiveAnswer.id,
        bookletId: 99999,
        totalQuestions: 0,
        answeredQuestions: 0,
        questionIds: questionIds,
        answeredQuestionIds: [],
        skipped: false,
        solved: false,
        previousAnswer: null,
        skippedQuestions: [],
        isTwoTier: survey.isTwoTier,
        feedback: null,
        isAdaptive: true
    };
};

const getDesignQuiz = async (survey: survey, instance: surveyInstance, userId: string, questionId?: number, nextQuestionId?: number, freeParam?: string): Promise<NextQuestion> => {
    let answerRecord = await prisma.answer.findFirst({
        where: {surveyId: survey.id, instanceId: instance.id, userId},
        include: {
            questionsAnswers: {include: {feedbackAnswer: true},},
            booklet: {include: {bookletQuestion: {orderBy: {position: "asc"}}}}
        },
    });
    if (!answerRecord) {
        const booklet = await assignBookletToUser(survey.id);
        answerRecord = await prisma.answer.create({
            data: {
                surveyId: survey.id,
                instanceId: instance.id,
                bookletId: booklet.id,
                userId,
                freeParam: freeParam ? freeParam : null,
                questionIds: booklet.bookletQuestion.map(bq => bq.question.id),
            },
            include: {
                questionsAnswers: {include: {feedbackAnswer: true},},
                booklet: {include: {bookletQuestion: true}}
            },
        });
    }
    let nextQuestion: QuizQuestion | null = null;
    if (questionId !== undefined) {
        nextQuestion = await prisma.question.findUnique({where: {id: questionId}});
    } else {
        if (nextQuestionId !== undefined) {
            const i = answerRecord.questionIds.indexOf(nextQuestionId);
            const nextId = answerRecord.questionIds[i + 1];
            if (nextId) {
                nextQuestion = await prisma.question.findUnique({where: {id: nextId},});
            }
        } else {
            const firstId = answerRecord.questionIds[0];
            if (firstId) {
                nextQuestion = await prisma.question.findUnique({where: {id: firstId},});
            }
        }
    }
    let previousFeedback;
    let previousAnswer;
    if (nextQuestion) {
        previousAnswer = answerRecord.questionsAnswers.find(qa => qa.questionId === nextQuestion.id);
        if (!previousAnswer) {
            await prisma.questionAnswer.create({
                data: {
                    answerId: answerRecord.id,
                    questionId: nextQuestion.id,
                },
            });
        }
        const qaRecord = await prisma.questionAnswer.upsert({
            where: {
                answerId_questionId: {
                    answerId: answerRecord.id,
                    questionId: nextQuestion.id,
                },
            },
            create: {
                answerId: answerRecord.id,
                questionId: nextQuestion.id,
            },
            update: {},
        });
        if (previousAnswer?.feedbackAnswer) {
            previousFeedback = Object.fromEntries(
                previousAnswer.feedbackAnswer.map(f => [
                    f.questionKey,
                    f.selectedOption,
                ])
            );
        }
        previousAnswer = qaRecord;
    }
    const answeredQuestionIds = answerRecord.questionsAnswers
        .filter(qa => qa.solved || qa.skipped)
        .map(qa => qa.questionId);
    const skippedQuestionIds = answerRecord.questionsAnswers
        .filter(qa => qa.skipped === true)
        .map(qa => qa.questionId);
    const totalQuestions = answerRecord.questionIds.length;
    const answeredQuestions = answeredQuestionIds.length;
    let cleanNextQuestion: QuizQuestion | null = nextQuestion ? {
        id: nextQuestion?.id,
        contentJson: nextQuestion?.contentJson
    } : null;
    if (totalQuestions === answeredQuestionIds.length) {
        await prisma.answer.update({
            where: {
                id: answerRecord.id,
            },
            data: {
                quizFinished: true
            },
        });
    }
    return {
        isAdaptive: false,
        surveyId: survey.id,
        surveyTitle: survey.title,
        instanceId: instance.id,
        bookletId: answerRecord.bookletId,
        question: cleanNextQuestion,
        answerId: answerRecord.id,
        totalQuestions,
        answeredQuestions,
        questionIds: answerRecord.questionIds,
        answeredQuestionIds: answeredQuestionIds,
        skipped: previousAnswer ? previousAnswer.skipped : false,
        solved: previousAnswer ? previousAnswer.solved : false,
        previousAnswer: previousAnswer ? previousAnswer.answerJson : null,
        skippedQuestions: skippedQuestionIds,
        isTwoTier: survey.isTwoTier,
        feedback: previousFeedback ? previousFeedback : null
    };
}

export async function submitQuizAnswer(userId: string, questionId: number, instanceId: number, answerJson: Prisma.InputJsonValue, isSolved: boolean) {
    const surveyInstance = await prisma.surveyInstance.findUnique({
        where: {
            id: instanceId,
        },
        include: {
            survey: {
                select: {
                    mode: true,
                    betaEtaFileUrl: true,
                },
            },
        },
    });

    if (!surveyInstance) {
        throw new Error("SURVEY_INSTANCE_NOT_FOUND");
    }

    const isAdaptive = surveyInstance.survey.mode === "ADAPTIV";
    if (isAdaptive) {
        const adaptiveAnswer = await prisma.adaptiveAnswer.findUnique({
            where: {
                surveyId_surveyInstanceId_userId: {
                    surveyId: surveyInstance.surveyId,
                    surveyInstanceId: instanceId,
                    userId,
                },
            },
            include: {
                questionsAnswers: true,
            },
        });
        if (!adaptiveAnswer) {
            throw new Error("ADAPTIVE_ANSWER_RECORD_NOT_FOUND");
        }
        const questionAnswer = adaptiveAnswer.questionsAnswers.find(qa => qa.questionId === questionId);
        if (!questionAnswer) {
            throw new Error("ADAPTIVE_ANSWER_QUESTION_RECORD_NOT_FOUND");
        }
        const answerArray = Array.isArray(answerJson) ? answerJson as any[] : [];
        const input = answerArray.map(a => ({key: a.key, value: a.value, m: a.m, c: a.c}));
        const probs = adaptiveAnswer.adaptiveProbs as number[];
        const ks = adaptiveAnswer.knowledgeSpace as number[][];
        const itemColumns = adaptiveAnswer.itemColumns as number[];
        const evaluation = await evaluateAnswersService(questionId, input);
        if (!evaluation) {throw new Error("ANSWER_EVALUATION_FAILED");}
        const result: 0 | 1 = evaluation.score.length > 0 && evaluation.score.every(score => score === 1) ? 1 : 0;
        const itemIndex = itemColumns.indexOf(questionId) + 1;
        if (itemIndex <= 0) {throw new Error(`Question ID ${questionId} not found in knowledge-space itemColumns`);}

        if (!surveyInstance.survey.betaEtaFileUrl) {throw new Error("BETA_ETA_FILE_NOT_FOUND");}
        const { beta, eta } = await fetchBetaEta(surveyInstance.survey.betaEtaFileUrl, itemColumns);
        const bayesianResult = await bayesianUpdate(probs, ks, beta, eta, itemIndex, result);
        await prisma.adaptiveAnswer.update({
            where: {
                id: adaptiveAnswer.id,
            },
            data: {
                adaptiveProbs: bayesianResult,
            },
        });
        return prisma.questionAnswer.update({
            where: {
                id: questionAnswer.id,
            },
            data: {
                answerJson,
                skipped: isSolved ? false : questionAnswer.skipped,
                solved: isSolved,
                solvingTimeEnd: new Date(),
            },
        });
    }

    const answerRecord = await prisma.answer.findFirst({
        where: {userId, instanceId,},
        include: {questionsAnswers: true,},
    });
    if (!answerRecord) {
        throw new Error("ANSWER_RECORD_NOT_FOUND");
    }
    let questionAnswer = answerRecord.questionsAnswers.find(
        qa => qa.questionId === questionId
    );
    if (!questionAnswer) {
        throw new Error("ANSWER_QUESTIONS_RECORD_NOT_FOUND");
    }
    const updatedQA = await prisma.questionAnswer.update({
        where: {
            id: questionAnswer.id,
        },
        data: {
            answerJson,
            skipped: isSolved ? false : questionAnswer.skipped,
            solved: isSolved,
            solvingTimeEnd: new Date()
        },
    });

    return updatedQA;
}

async function assignBookletToUser(surveyId: number) {
    return prisma.$transaction(async tx => {

        const booklets = await tx.booklet.findMany({
            where: {surveyId},
            include: {
                bookletQuestion: {
                    orderBy: {position: "asc"},
                    include: {
                        question: true,
                    },
                },
                answer: {
                    select: {id: true},
                },
            },
        });

        if (booklets.length === 0) {
            throw new Error("No booklets found");
        }

        const grouped = new Map<number, { totalAssigned: number; latestVersion: typeof booklets[number]; }>();

        for (const booklet of booklets) {
            const assignmentCount = booklet.answer.length;
            const existing = grouped.get(booklet.bookletId);
            if (existing) {
                existing.totalAssigned += assignmentCount;
                if (booklet.version > existing.latestVersion.version) {
                    existing.latestVersion = booklet;
                }
            } else {
                grouped.set(booklet.bookletId, {
                    totalAssigned: assignmentCount,
                    latestVersion: booklet,
                });
            }
        }
        const minAssigned = Math.min(...Array.from(grouped.values()).map(g => g.totalAssigned));

        const leastAssigned = Array.from(grouped.values()).filter(g => g.totalAssigned === minAssigned);

        const selected =
            leastAssigned[
                Math.floor(Math.random() * leastAssigned.length)
                ]?.latestVersion;

        if (!selected) {
            throw new Error("No selected booklet");
        }
        return selected;
    });
}

export async function skipQuestion(userId: string, questionId: number, instanceId: number) {
    const answerRecord = await prisma.answer.findFirst({
        where: {userId, instanceId},
        include: {questionsAnswers: true},
    });
    if (!answerRecord) {
        throw new Error("ANSWER_RECORD_NOT_FOUND");
    }
    const qa = answerRecord.questionsAnswers.find(
        q => q.questionId === questionId
    );
    if (!qa) {
        throw new Error("ANSWER_QUESTIONS_RECORD_NOT_FOUND");
    }
    return prisma.questionAnswer.update({
        where: {id: qa.id},
        data: {
            skipped: true,
            solved: false,
            solvingTimeEnd: new Date()
        },
    });
}

export async function trackQuestionTime(userId: string, questionId: number, instanceId: number, seconds: number) {
    const answer = await prisma.answer.findFirst({
        where: {
            userId,
            instanceId,
            questionIds: {
                has: questionId
            }
        }
    })
    if (!answer) return
    await prisma.questionAnswer.update({
        where: {
            answerId_questionId: {
                answerId: answer.id,
                questionId
            }
        },
        data: {
            solvedTime: {
                increment: seconds
            }
        }
    })
}

export async function startQuestionSession(userId: string, questionId: number, instanceId: number) {
    const answer = await prisma.answer.findFirst({
        where: {userId, instanceId}
    });
    if (!answer) return;
    const qa = await prisma.questionAnswer.findUnique({
        where: {
            answerId_questionId: {
                answerId: answer.id,
                questionId
            }
        }
    });
    if (!qa) return;
    const openSession = await prisma.questionSolvingSession.findFirst({
        where: {
            questionAnswerId: qa.id,
            endTime: null
        }
    });
    if (!openSession) {
        await prisma.questionSolvingSession.create({
            data: {
                questionAnswerId: qa.id,
                startTime: new Date()
            }
        });
    } else {
        await prisma.questionSolvingSession.update({
            where: {id: openSession.id},
            data: {endTime: new Date()}
        });
    }
}

export async function endQuestionSession(userId: string, questionId: number, instanceId: number) {
    const answer = await prisma.answer.findFirst({
        where: {userId, instanceId}
    });
    if (!answer) return;
    const qa = await prisma.questionAnswer.findUnique({
        where: {
            answerId_questionId: {
                answerId: answer.id,
                questionId
            }
        }
    });
    if (!qa) return;
    const openSession = await prisma.questionSolvingSession.findFirst({
        where: {
            questionAnswerId: qa.id,
            endTime: null
        }
    });
    if (!openSession) return;
    const now = new Date();
    await prisma.questionSolvingSession.update({
        where: {id: openSession.id},
        data: {endTime: now}
    });
    const duration =
        (now.getTime() - openSession.startTime.getTime()) / 1000;
    await prisma.questionAnswer.update({
        where: {id: qa.id},
        data: {
            solvedTime: {increment: duration}
        }
    });
}

export async function endQuizSession(userId: string, instanceId: number) {
    const answer = await prisma.answer.findFirst({
        where: {userId, instanceId}
    });
    if (!answer) return;
    await prisma.answer.update({
        where: {id: answer.id},
        data: {
            endedAt: new Date(),
        },
    });
}

export const saveFeedback = async ({instanceId, questionId, userId, feedback,}: {
    instanceId: number;
    questionId: number;
    userId: string;
    feedback: Record<string, string>;
}) => {
    const answerRecord = await prisma.answer.findFirst({
        where: {userId, instanceId,},
        include: {questionsAnswers: true,},
    });
    if (!answerRecord) {
        throw new Error("ANSWER_RECORD_NOT_FOUND");
    }
    let questionAnswer = answerRecord.questionsAnswers.find(
        qa => qa.questionId === questionId
    );
    if (!questionAnswer) {
        throw new Error("ANSWER_QUESTIONS_RECORD_NOT_FOUND");
    }
    const operations = Object.entries(feedback).map(([key, value]) =>
        prisma.feedbackAnswer.upsert({
            where: {
                questionAnswerId_questionKey: {
                    questionAnswerId: questionAnswer.id,
                    questionKey: key,
                },
            },
            update: {
                selectedOption: value,
            },
            create: {
                questionAnswerId: questionAnswer.id,
                questionKey: key,
                selectedOption: value,
            },
        })
    );

    await prisma.$transaction(operations);

    return {success: true};
};

export const syncAnonymousUser = async (externalId: string) => {
    const user = await prisma.anonymousUser.upsert({
        where: {externalId},
        update: {},
        create: {
            externalId,
        },
    });
    return user;
};

async function fetchKnowledgeSpace(knowledgeSpaceFileUrl: string): Promise<{ ks: number[][]; itemColumns: number[]; }> {
    const response = await fetch(knowledgeSpaceFileUrl);
    if (!response.ok) {
        throw new Error(`Knowledge Space konnte nicht geladen werden: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), {type: "buffer",});
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("Knowledge Space Excel-Datei enthält kein Tabellenblatt.");
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Das Tabellenblatt "${sheetName}" konnte nicht gefunden werden.`);
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {defval: null,});
    if (rows.length === 0) {
        throw new Error("Knowledge Space Excel-Datei ist leer.");
    }
    const firstRow = rows[0];
    if (!firstRow) {
        throw new Error("Knowledge Space Excel-Datei ist leer.");
    }
    const columns = Object.keys(firstRow).filter(
        (column) => column !== "" && !column.startsWith("__EMPTY")
    );
    if (columns.length < 2) {
        throw new Error("Knowledge Space muss mindestens eine Zustands-Spalte und eine Aufgaben-Spalte enthalten.");
    }
    const itemColumns: number[] = columns.map((column) => {
        const id = Number(column);
        if (Number.isNaN(id)) {throw new Error(`Ungültige Question-ID: "${column}"`);}
        return id;
    });

    const ks = rows.map((row, rowIndex) => {
        return columns.map((column) => {
            const value = row[column];
            if (value !== 0 && value !== 1) {throw new Error(`Ungültiger Wert in Zeile ${rowIndex + 2}, Spalte "${column}".`);}
            return Number(value);
        });
    });

    return {ks, itemColumns,};
}

async function fetchProbabilityDistribution(
    probabilityFileUrl: string
): Promise<number[]> {
    const response = await fetch(probabilityFileUrl);

    if (!response.ok) {
        throw new Error(`Probability Distribution konnte nicht geladen werden: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), {
        type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("Probability Distribution Excel-Datei enthält kein Tabellenblatt.");
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Das Tabellenblatt "${sheetName}" konnte nicht gefunden werden.`);
    }
    const rows = XLSX.utils.sheet_to_json<{ ID: number; Probability: number; }>(sheet, {defval: null,});
    if (rows.length === 0) {
        throw new Error("Probability Distribution Excel-Datei ist leer.");
    }
    const probabilities = rows.map((row, index) => {
        if (row.Probability < 0) {
            throw new Error(`Wahrscheinlichkeit darf nicht negativ sein in Zeile ${index + 2}.`);
        }
        return row.Probability;
    });

    const sum = probabilities.reduce((sum, probability) => sum + probability, 0);

    if (sum <= 0) {
        throw new Error("Die Wahrscheinlichkeitsverteilung muss eine positive Summe haben."
        );
    }

    return probabilities.map(probability => probability / sum);
}



async function fetchBetaEta(
    betaEtaFileUrl: string,
    itemColumns: number[]
): Promise<{
    beta: number[];
    eta: number[];
}> {
    const response = await fetch(betaEtaFileUrl);

    if (!response.ok) {
        throw new Error(`Beta/Eta-Datei konnte nicht geladen werden: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), {type: "buffer",});
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("BETA_ETA_FILE_HAS_NO_SHEET");
    }
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        throw new Error("BETA_ETA_FILE_HAS_NO_worksheet");
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
    if (rows.length === 0) {
        throw new Error("BETA_ETA_FILE_IS_EMPTY");
    }

    const betaEtaByItem = new Map<number, { beta: number; eta: number; }>();

    for (const row of rows) {
        const itemId = Number(row.itemId);
        const beta = Number(row.beta);
        const eta = Number(row.eta);

        if (!Number.isInteger(itemId)) {
            throw new Error(`INVALID_ITEM_ID_IN_BETA_ETA_FILE: ${row.itemId}`);
        }

        if (!Number.isFinite(beta)) {
            throw new Error(`INVALID_BETA_FOR_ITEM: ${itemId}`);
        }

        if (!Number.isFinite(eta)) {
            throw new Error(`INVALID_ETA_FOR_ITEM: ${itemId}`);
        }

        if (betaEtaByItem.has(itemId)) {
            throw new Error(`DUPLICATE_ITEM_ID_IN_BETA_ETA_FILE: ${itemId}`);
        }
        betaEtaByItem.set(itemId, { beta, eta });
    }

    const missingIds = itemColumns.filter(itemId => !betaEtaByItem.has(itemId));

    if (missingIds.length > 0) {throw new Error(`BETA_ETA_ITEMS_MISSING: ${missingIds.join(", ")}`);}
    const expectedIds = new Set(itemColumns);
    const extraIds = Array.from(betaEtaByItem.keys()).filter(itemId => !expectedIds.has(itemId));

    if (extraIds.length > 0) {throw new Error(`BETA_ETA_ITEMS_UNKNOWN: ${extraIds.join(", ")}`);}

    const beta = itemColumns.map(itemId => betaEtaByItem.get(itemId)!.beta);

    const eta = itemColumns.map(itemId => betaEtaByItem.get(itemId)!.eta);

    return {
        beta,
        eta,
    };
}