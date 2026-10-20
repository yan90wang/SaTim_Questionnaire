import prisma from "../config/prismaClient.js";
import {Prisma, question_status, type survey, survey_mode, survey_status, type surveyInstance} from "@prisma/client";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import {evaluateAnswersService, type UserAnswerInput} from "./solverService.js";
import {supabase} from "../supabaseClient.js";
import {Readable} from "node:stream";
import {type ExportAnswer, questionAnswerInclude, writeSurveyExport} from "./helper/surveyExportHelper.js";

/**
 * Interface for creating a new survey
 */
interface CreateSurveyInput {
    title: string;
    description?: string;
    mode: survey_mode;
    createdById: number;
    updatedById: number;
    status?: survey_status;
    instances?: {
        name: string;
        validFrom: Date;
        validTo: Date;
    }[];
    isTwoTier: boolean;
}

/**
 * Interface for updating a survey
 */
interface UpdateSurveyInput {
    title?: string;
    description?: string;
    mode?: survey_mode;
    updatedById: number;
    status?: survey_status;
    adaptiveThreshold?: number | null;
    feedbackSurveyUrl?: string;
}

/**
 * Create a new survey instance for an existing survey
 */
interface CreateSurveyInstanceInput {
    surveyId: number;
    name: string;
    validFrom: Date;
    validTo: Date;
    createdById: number;
    updatedById: number;
}

/**
 * Interface for updating a survey instance
 */
interface UpdateSurveyInstanceInput {
    name?: string;
    validFrom?: Date;
    validTo?: Date;
    updatedById: number;
}

/**
 * Create a new survey
 */
export const createSurvey = async (data: CreateSurveyInput, userId: number): Promise<survey> => {
    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
        throw new Error("Invalid userId");
    }
    const user = await prisma.users.findUnique({
        where: {
            id: parsedUserId,
        },
        select: {
            team_id: true,
        },
    });
    if (!user || user.team_id === null) {throw new Error("USER_OR_TEAM_NOT_FOUND");}
    const createData: any = {
        title: data.title,
        mode: data.mode,
        status: data.status ?? "IN_PROGRESS",
        createdById: data.createdById,
        updatedById: data.updatedById,
        isTwoTier: data.isTwoTier,
        team_id: user.team_id,
    };
    if (data.description !== undefined) createData.description = data.description;
    if (data.instances && data.instances.length > 0) {
        createData.instances = {
            create: data.instances.map((inst) => ({
                name: inst.name,
                validFrom: inst.validFrom,
                validTo: inst.validTo,
                createdById: data.createdById,
                updatedById: data.updatedById,
            })),
        };
    }

    return prisma.survey.create({
        data: createData,
        include: {instances: true},
    });
};

/**
 * Get all surveys
 */
export const getAllSurveys = async (userId: number): Promise<(Omit<survey, "knowledgeSpaceBinary"> & { missingKsQuestionIds: number[]; })[]> => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { team_id: true },
    });
    if (!user || user.team_id === null) {throw new Error("USER_OR_TEAM_NOT_FOUND");}
    const surveys = await prisma.survey.findMany({
        where: {
            team_id: user.team_id,
        },
        omit: {
            knowledgeSpaceBinary: true,
        },
        include: {
            createdBy: {select: {id: true, first_name: true, last_name: true}},
            updatedBy: {select: {id: true, first_name: true, last_name: true}},
            instances: true,
        },
        orderBy: {createdAt: "desc"},
    });
    const allKsQuestionIds = [...new Set(surveys.filter(s => s.mode === "ADAPTIV").flatMap(s => s.ksQuestionIds))];
    const existingQuestions = await prisma.question.findMany({
        where: {
            id: { in: allKsQuestionIds }
        },
        select: {
            id: true
        }
    });
    const existingQuestionIds = new Set(
        existingQuestions.map(q => q.id)
    );
    return surveys.map(s => ({
        ...s,
        missingKsQuestionIds: s.mode === "ADAPTIV" ? [...new Set(s.ksQuestionIds)].filter(id => !existingQuestionIds.has(id)) : []
    }));
};

/**
 * Get a single survey by ID
 */
export const getSurveyById = async (id: number) => {
    const survey = await prisma.survey.findUnique({
        where: {id},
        include: {
            createdBy: {select: {id: true, first_name: true, last_name: true}},
            updatedBy: {select: {id: true, first_name: true, last_name: true}},
            instances: true,
            booklet: {
                orderBy: {bookletId: "asc"},
            },
        },
    });

    if (!survey) throw new Error("Survey not found");

    const now = new Date();
    const hasActiveInstance = survey.instances?.some(
        inst => new Date(inst.validFrom) <= now && now <= new Date(inst.validTo)
    ) ?? false;

    const hasBooklet = (survey.booklet?.length ?? 0) > 0;

    return {
        ...survey,
        hasActiveInstance,
        booklet: survey.booklet ?? [],
        hasBooklet,
    };
};

/**
 * Update an existing survey by ID
 */
export const updateSurveyById = async (id: number, data: UpdateSurveyInput): Promise<survey> => {
    const updateData: any = {updatedById: data.updatedById};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.mode !== undefined) updateData.mode = data.mode;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.adaptiveThreshold !== undefined) updateData.adaptiveThreshold = data.adaptiveThreshold;
    if (data.feedbackSurveyUrl !== undefined) updateData.feedbackSurveyUrl = data.feedbackSurveyUrl;
    return prisma.survey.update({
        where: {id},
        data: updateData,
        include: {instances: true},
    });
};

/**
 * Delete a survey by ID
 */
export const deleteSurveyById = async (id: number): Promise<survey> => {
    return prisma.survey.delete({
        where: {id},
    });
};

export const createSurveyInstance = async (data: CreateSurveyInstanceInput): Promise<surveyInstance> => {
    const survey = await prisma.survey.findUnique({
        where: {id: data.surveyId},
        select: {bookletVersion: true}
    });

    if (!survey) {
        throw new Error("Survey not found");
    }

    return prisma.surveyInstance.create({
        data: {
            surveyId: data.surveyId,
            name: data.name,
            validFrom: data.validFrom,
            validTo: data.validTo,
            createdById: data.createdById,
            updatedById: data.updatedById,
            bookletVersion: survey.bookletVersion,
        },
    });
};

/**
 * Get all instances for a given survey
 */
export const getSurveyInstances = async (surveyId: number): Promise<surveyInstance[]> => {
    return prisma.surveyInstance.findMany({
        where: {surveyId},
        orderBy: {createdAt: "desc"},
        include: {
            createdBy: {select: {id: true, first_name: true, last_name: true}},
            updatedBy: {select: {id: true, first_name: true, last_name: true}},
        },
    });
};

/**
 * Update a specific survey instance
 */
export const updateSurveyInstanceById = async (
    id: number,
    data: UpdateSurveyInstanceInput
): Promise<surveyInstance> => {
    return prisma.surveyInstance.update({
        where: {id},
        data,
    });
};

/**
 * Delete a survey instance by ID
 */
export const deleteSurveyInstanceById = async (id: number): Promise<surveyInstance> => {
    return prisma.surveyInstance.delete({
        where: {id},
    });
};

/**
 * Get all booklets for a survey
 */
export const getBookletsBySurveyId = async (surveyId: number) => {
    const result = await prisma.booklet.aggregate({
        where: {surveyId},
        _max: {version: true},
    });

    const maxVersion = result._max.version ?? 0;
    if (maxVersion === 0) return [];

    return prisma.booklet.findMany({
        where: {surveyId, version: maxVersion},
        include: {
            bookletQuestion: {
                include: {question: true},
                orderBy: {position: "asc"},
            },
        },
        orderBy: {bookletId: "asc"},
    });
};

/**
 * Process uploaded survey Excel files
 * Creates new booklets or updates existing ones
 */
export const processSurveyExcels = async (surveyId: number, slotQuestionFile: Express.Multer.File, bookletSlotFile: Express.Multer.File, createdById: number) => {
    const slotToQuestionMap = readSlotToQuestionExcel(slotQuestionFile);
    const bookletMap = readBookletToSlotExcel(bookletSlotFile, slotToQuestionMap);
    const errors: any[] = [];
    for (const [bookletName, questionIdsRaw] of Object.entries(bookletMap)) {
        const bookletId = parseInt(bookletName.replace(/\D/g, "")) || 0;
        const questionIds = [...new Set(questionIdsRaw)];

        const validQuestions = await prisma.question.findMany({
            where: {id: {in: questionIds}},
            select: {id: true, status: true},
        });
        const validIds = validQuestions.map(q => q.id);
        const unfinishedIds = validQuestions.filter(q => q.status !== question_status.FINISHED).map(q => q.id);
        const missing = questionIds.filter(id => !validIds.includes(id));
//TODO enable again if (missing.length > 0 || unfinishedIds.length > 0) {
        if (missing.length > 0) {
            errors.push({
                bookletId,
                missingQuestionIds: missing,
                unfinishedQuestionIds: unfinishedIds
            });
        }
    }

    if (errors.length > 0) {
        const error: any = new Error("Excel validation failed");
        error.statusCode = 400;
        error.details = errors;
        throw error;
    }

    return prisma.$transaction(async (tx) => {
        const updatedSurvey = await tx.survey.update({
            where: {id: surveyId},
            data: {bookletVersion: {increment: 1}},
            select: {bookletVersion: true},
        });

        for (const [bookletName, questionIdsRaw] of Object.entries(bookletMap)) {
            const bookletId = parseInt(bookletName.replace(/\D/g, "")) || 0;
            const questionIds = [...new Set(questionIdsRaw)];
            if (!questionIds.length) continue;
            const newBooklet = await tx.booklet.create({
                data: {
                    bookletId,
                    surveyId,
                    excelFileUrl: "",
                    createdById,
                    version: updatedSurvey.bookletVersion,
                },
            });

            const bookletQuestionData = questionIds.map((questionId, index) => ({
                bookletId: newBooklet.id,
                questionId,
                position: index + 1,
            }));

            await tx.bookletQuestion.createMany({
                data: bookletQuestionData,
            });
        }
        return tx.survey.update({
            where: {id: surveyId},
            data: {
                bookletMappingExcelUrl: "",
                status: survey_status.PREPARED,
            },
        });
    });
};

export const getQuestionsByIds = async (ids: number[]) => {
    return prisma.question.findMany({
        where: {
            id: {
                in: ids
            }
        },
        select: {
            id: true,
            contentJson: true,
            contentHtml: true
        }
    });
};

export const getQuestionDetailsExport = async (ids: number[], surveyId: number, surveyTitle: string): Promise<Buffer> => {
    const questions = await prisma.question.findMany({
        where: {
            id: {
                in: ids
            }
        },
        include: {
            bookletQuestion: {
                where: {
                    booklet: {
                        surveyId
                    }
                },
                include: {
                    booklet: {
                        select: {
                            id: true,
                            bookletId: true,
                            version: true
                        }
                    }
                }
            }
        }
    });

    const answers = await prisma.answer.findMany({
        where: {
            surveyId,
            questionsAnswers: {
                some: {
                    questionId: {
                        in: ids
                    }
                }
            }
        },
        include: {
            questionsAnswers: true
        }
    });
    const metadataMaps = questions.map(q => extractMetadataMap(q.metadata));
    const allHeaders = Array.from(new Set(metadataMaps.flatMap(m => Object.keys(m))));
    const rows = await Promise.all(
        questions.map(async (question, index) => {
            const meta = extractMetadataMap(question.metadata as any);
            let total = 0;
            let fullScoreCount = 0;
            const maxPoints = extractAnswerTypes(question.contentJson).length;
            for (const answer of answers) {
                for (const qa of answer.questionsAnswers) {
                    const qid = qa.questionId;
                    if (question.id !== qid) continue;
                    total = total + 1;
                    if (qa.solved) {
                        const answerArray = Array.isArray(qa.answerJson) ? qa.answerJson as any[] : [];
                        const userAnswerInput: UserAnswerInput[] = answerArray.map(a => ({
                            key: a.key,
                            value: a.value,
                            m: a.m,
                            c: a.c
                        }));
                        const result = await evaluateAnswersService(qid, userAnswerInput);
                        const achievedScore = Array.isArray(result?.score) ? result.score.reduce((sum, num) => sum + num, 0) : 0;
                        const correct = achievedScore === maxPoints;
                        if (correct) fullScoreCount = fullScoreCount + 1;
                    }
                }
            }
            const row: any = {
                Downloaded: surveyTitle,
                ID: question.id,
                Booklet: [...new Set(question.bookletQuestion.map(bq => bq.booklet.bookletId))].join(", "),
                "Antwort Formate": [...new Set(extractAnswerTypes(question.contentJson).map(type => ANSWER_TYPE_LABELS[type] ?? type))].join(", "),
                "Max Points": maxPoints,
                "Richtige Antworten": fullScoreCount,
                "% Correct": total ? ((fullScoreCount / total) * 100).toFixed(2) + "% (von total " + total + ")" : "0" + "% (von total " + total + ")",
                ...meta,
            };
            for (const key of allHeaders) {
                row[key] = meta?.[key] ?? "";
            }
            return row;
        }));
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "QuestionDetails"
    );
    return XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });
};

export const getAdaptiveQuestionDetailsExportService = async (surveyId: number, surveyTitle: string): Promise<Buffer> => {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: {
            mode: true,
            ksQuestionIds: true,
        },
    });
    if (!survey) {throw new Error("Survey not found");}
    if (survey.mode !== "ADAPTIV") {throw new Error("Survey is not adaptive");}
    const ids = survey.ksQuestionIds;
    if (ids.length === 0) {throw new Error("No questions found for adaptive survey");}
    const questions = await prisma.question.findMany({
        where: {id: { in: ids },},
    });
    const answers = await prisma.adaptiveAnswer.findMany({
        where: {
            surveyId,
            questionsAnswers: {
                some: {
                    questionId: { in: ids },
                },
            },
        },
        include: {
            questionsAnswers: {
                where: {
                    questionId: { in: ids },
                },
            },
        },
    });

    const metadataMaps = questions.map(q => extractMetadataMap(q.metadata));
    const allHeaders = Array.from(new Set(metadataMaps.flatMap(m => Object.keys(m))));
    const rows = await Promise.all(
        questions.map(async (question) => {
            const meta = extractMetadataMap(question.metadata as any);
            let total = 0;
            let fullScoreCount = 0;
            const maxPoints = extractAnswerTypes(question.contentJson).length;
            for (const answer of answers) {
                for (const qa of answer.questionsAnswers) {
                    const qid = qa.questionId;
                    if (question.id !== qid) continue;
                    total++;
                    if (qa.solved) {
                        const answerArray = Array.isArray(qa.answerJson) ? qa.answerJson as any[] : [];
                        const userAnswerInput: UserAnswerInput[] = answerArray.map(a => ({key: a.key, value: a.value, m: a.m, c: a.c,}));
                        const result = await evaluateAnswersService(qid, userAnswerInput);
                        const achievedScore = Array.isArray(result?.score) ? result.score.reduce((sum, num) => sum + num, 0) : 0;
                        if (achievedScore === maxPoints) {
                            fullScoreCount++;
                        }
                    }
                }
            }

            const row: Record<string, any> = {
                Downloaded: surveyTitle,
                ID: question.id,
                "Antwort Formate": [...new Set(extractAnswerTypes(question.contentJson).map(type => ANSWER_TYPE_LABELS[type] ?? type)),].join(", "),
                "Max Points": maxPoints,
                "Richtige Antworten": fullScoreCount,
                "% Correct": total ? ((fullScoreCount / total) * 100).toFixed(2) + "% (von total " + total + ")" : "0% (von total 0)",
                ...meta,
            };
            for (const key of allHeaders) {
                row[key] = meta?.[key] ?? "";
            }
            return row;
        })
    );

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "QuestionDetails");
    return XLSX.write(workbook, {type: "buffer", bookType: "xlsx",});
};

/**
 * Export survey answers for selected instances, including question scores
 */
export const getSurveyExport = async (surveyId: number, instanceIds: number[]): Promise<string> => {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: {
            mode: true,
        },
    });
    if (!survey) {
        throw new Error("Survey not found");
    }
    if (survey.mode === "ADAPTIV") {
        return getAdaptiveSurveyExport(surveyId, instanceIds);
    }
    return getDesignSurveyExport(surveyId, instanceIds);
};


export const getDesignSurveyExport = async (surveyId: number, instanceIds: number[]): Promise<string> => {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        include: {
            booklet: {
                include: {
                    bookletQuestion: true,
                },
            },
        },
    });
    if (!survey) {
        throw new Error("Survey not found");
    }
    const allQuestionIds = [...new Set(survey.booklet.flatMap(booklet => booklet.bookletQuestion.map(q => q.questionId))),];
    const answers = await prisma.answer.findMany({
        where: {
            surveyId,
            instanceId: { in: instanceIds },
        },
        include: {
            questionsAnswers: {
                include: questionAnswerInclude,
            },
            booklet: {
                include: {
                    bookletQuestion: true,
                },
            },
        },
    });

    const exportAnswers: ExportAnswer[] = answers.map(
        answer => ({
            userId: answer.userId,
            instanceId: answer.instanceId,
            freeParam: answer.freeParam,
            endedAt: answer.endedAt,
            questionsAnswers: answer.questionsAnswers,
            assignedQuestionIds: answer.booklet.bookletQuestion.map(q => q.questionId),
            positionMap: new Map(answer.booklet.bookletQuestion.map(q => [q.questionId, q.position,])),
            additionalColumns: {
                Booklet_ID: answer.booklet.bookletId,
                Booklet_Version: answer.booklet.version,
            },
        })
    );
    return writeSurveyExport(surveyId, instanceIds, allQuestionIds, exportAnswers, "DESIGN");
};


export const getAdaptiveSurveyExport = async (surveyId: number, instanceIds: number[]): Promise<string> => {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        select: {
            ksQuestionIds: true,
        },
    });
    if (!survey) {
        throw new Error("Survey not found");
    }
    const allQuestionIds = survey.ksQuestionIds;
    if (allQuestionIds.length === 0) {
        throw new Error("Keine KS-Fragen vorhanden.");
    }
    const answers = await prisma.adaptiveAnswer.findMany({
        where: {
            surveyId,
            surveyInstanceId: { in: instanceIds },
        },
        include: {
            questionsAnswers: {
                include: questionAnswerInclude,
            },
        },
    });

    const exportAnswers: ExportAnswer[] = answers.map(
        answer => {
            const probabilities: number[] = Array.isArray(answer.adaptiveProbs) ? answer.adaptiveProbs.filter((value): value is number => typeof value === "number" && Number.isFinite(value)) : [];
            const highestProbability = probabilities.length > 0 ? Math.max(...probabilities) : "";
            const highestProbabilityStateIndex = highestProbability !== "" ? probabilities.indexOf(highestProbability) : -1;
            return {
                userId: answer.userId,
                instanceId: answer.surveyInstanceId,
                freeParam: answer.freeParam,
                endedAt: answer.endedAt,
                questionsAnswers: answer.questionsAnswers,
                assignedQuestionIds: answer.questionIds,
                positionMap: new Map(answer.questionIds.map((id, index) => [id, index + 1,])),
                additionalColumns: {
                    "Gefragte Items": answer.questionIds.join(", "),
                    "Finale Probabilities": probabilities.map(p => Number.isFinite(p) ? String(p) : "").join(", "),
                    "Höchste Probability - Wert": highestProbability,
                    "Höchste Probability - KS-Zustand": highestProbabilityStateIndex >= 0 ? highestProbabilityStateIndex + 1 : "",
                },
            };
        }
    );
    return writeSurveyExport(surveyId, instanceIds, allQuestionIds, exportAnswers, "ADAPTIV");
};

function readSlotToQuestionExcel(slotQuestionFile: Express.Multer.File) {
    const slotQuestionWorkbook = XLSX.read(slotQuestionFile.buffer, {type: "buffer"});

    if (slotQuestionWorkbook.SheetNames.length === 0) {
        throw new Error("Slot-Question Excel file has no sheets");
    }
    const slotQuestionSheetName = slotQuestionWorkbook.SheetNames[0]!;
    const slotQuestionSheet = slotQuestionWorkbook.Sheets[slotQuestionSheetName];
    if (!slotQuestionSheet) {
        throw new Error(`Sheet "${slotQuestionSheetName}" not found in Slot-Question Excel file`);
    }
    const slotQuestionData = XLSX.utils.sheet_to_json<Record<string, string>>(slotQuestionSheet, {defval: ""});
    const slotToQuestionMap: Record<string, number> = {};
    for (let rawRow of slotQuestionData) {
        const row = Object.fromEntries(
            Object.entries(rawRow).filter(
                ([key, value]) => !key.startsWith("__EMPTY") && value !== ""
            )
        );
        const keys = Object.keys(row);
        if (keys.length !== 2) {
            throw new Error(`Expected 2 columns per row, found ${keys.length}: ${JSON.stringify(row)}`);
        }
        const [questionIdCol, slotCodeCol] = keys as [string, string];
        const questionId = Number(row[questionIdCol]);
        const slotCode = row[slotCodeCol]?.toString().trim();
        if (isNaN(questionId)) throw new Error(`Invalid question ID "${row[questionIdCol]}" in row: ${JSON.stringify(row)}`);
        if (!slotCode) throw new Error(`Empty slot code for question ID "${questionId}" in row: ${JSON.stringify(row)}`);
        if (slotToQuestionMap[slotCode]) {
            throw new Error(`Duplicate slot code "${slotCode}" found in Slot-Question Excel`);
        }
        slotToQuestionMap[slotCode] = questionId;
    }
    return slotToQuestionMap;
}

function readBookletToSlotExcel(bookletSlotFile: Express.Multer.File, slotToQuestionMap: Record<string, number>) {
    const workbook = XLSX.read(bookletSlotFile.buffer, {type: "buffer"});

    if (workbook.SheetNames.length === 0) {
        throw new Error("Booklet-Slot Excel file has no sheets");
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]!];
    if (!sheet) {
        throw new Error(`Sheet "${workbook.SheetNames[0]}" not found`);
    }
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {header: 1, defval: "",});
    if (rows.length === 0) {
        throw new Error("Booklet-Slot Excel file is empty");
    }
    if (!rows.length || !rows[0]) {
        throw new Error("Booklet-Slot Excel file has no rows or header row is empty");
    }
    const headerRow = rows[0];
    const bookletMap: Record<string, number[]> = {};
    for (let col = 0; col < headerRow.length; col++) {
        const bookletName = headerRow[col]?.trim();
        if (!bookletName) continue;
        bookletMap[bookletName] = [];

        for (let row = 1; row < rows.length; row++) {
            const slotCode = rows[row]?.[col]?.toString().trim();
            if (!slotCode) continue;
            const questionId = slotToQuestionMap[slotCode];
            if (questionId === undefined) {
                throw new Error(
                    `Slot code "${slotCode}" in booklet "${bookletName}" does not exist in Slot-Question mapping`
                );
            }
            bookletMap[bookletName].push(questionId);
        }
        if (bookletMap[bookletName].length === 0) {
            throw new Error(`Booklet "${bookletName}" has no slot codes`);
        }
    }
    return bookletMap;
}

const extractAnswerTypes = (contentJson: any): string[] => {
    if (!contentJson) return [];
    const allowedTypes = new Set(["algebra", "mcChoice", "numericInput", "freeText", "singleChoice", "freeTextInline", "lineEquation", "geoGebra", "geoGebraSlope"]);
    const found: string[] = [];
    const countedGroups = new Set<string>();
    const traverse = (node: any) => {
        if (!node) return;
        if (Array.isArray(node)) {
            node.forEach(traverse);
            return;
        }

        if (typeof node === "object") {
            if (typeof node.type === "string" && allowedTypes.has(node.type)) {
                if (node.type === "mcChoice" || node.type === "singleChoice") {
                    const groupId = node.attrs?.groupId;
                    const uniqueKey = `${node.type}:${groupId ?? node.attrs?.id}`;
                    if (!countedGroups.has(uniqueKey)) {
                        countedGroups.add(uniqueKey);
                        found.push(node.type === "mcChoice" ? "mc" : "sc");
                    }
                } else {
                    found.push(node.type);
                }
            }
            Object.values(node).forEach(traverse);
        }
    };
    traverse(contentJson);
    return found;
};

const ANSWER_TYPE_LABELS: Record<string, string> = {
    algebra: "Algebra",
    mcChoice: "Multiple Choice",
    mc: "Multiple Choice",
    sc: "Single Choice",
    numericInput: "Numerische Eingabe",
    freeText: "Freitext",
    singleChoice: "Single Choice",
    freeTextInline: "Freitext",
    lineEquation: "Lineare Gleichung",
    geoGebra: "Geogebra",
    geoGebraSlope: "Geogebra Steigungsdreick"
};

function extractMetadataMap(metadata: Prisma.JsonValue): Record<string, string> {
    if (!metadata) return {};
    if (!Array.isArray(metadata)) return {};

    const map: Record<string, string> = {};

    for (const item of metadata as any[]) {
        if (!item || typeof item !== "object") continue;

        const label = item.label ?? item.key;
        let value = item.value;

        if (item.type === "checkbox" && item.optionsValue && typeof item.optionsValue === "object") {
            value = Object.entries(item.optionsValue).filter(([_, checked]) => checked).map(([key]) => key).join(", ");
        }

        map[String(label)] = value === undefined || value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    }

    return map;
}

export function sanitizeExcelValue(value:any) {
    if (typeof value !== "string") return value;

    return value.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
        ""
    );
}

export const setSurveyTeacherAssignableService = async (surveyId: number, teacherAssigned: boolean) => {
    return prisma.$transaction(async (tx) => {
        const survey = await tx.survey.findUnique({
            where: {
                id: surveyId,
            },
        });

        if (!survey) {
            throw new Error("Survey not found");
        }

        const updatedSurvey = await tx.survey.update({
            where: {
                id: surveyId,
            },
            data: {
                teacherAssigned,
            },
        });

        if (teacherAssigned) {
            const classes = await tx.schoolClass.findMany({
                select: {
                    id: true,
                },
            });

            if (classes.length > 0) {
                await tx.classTestInstance.createMany({
                    data: classes.map((schoolClass) => ({
                        surveyId,
                        classId: schoolClass.id,
                        active: false,
                    })),
                    skipDuplicates: true,
                });
            }
        }

        return updatedSurvey;
    });
};

export const uploadAdaptiveFilesService = async (surveyId: number, knowledgeSpaceFile: Express.Multer.File, probabilityFile: Express.Multer.File, betaEtaFile: Express.Multer.File) => {
    if (!surveyId || Number.isNaN(surveyId)) {
        throw new Error("Ungültige Survey ID.");
    }
    if (!knowledgeSpaceFile || !probabilityFile || !betaEtaFile) {
        throw new Error("Knowledge Space, Wahrscheinlichkeitsverteilung und Beta/Eta müssen hochgeladen werden.");
    }
    const survey = await prisma.survey.findUnique({
        where: {
            id: surveyId,
        },
        select: {
            id: true,
        },
    });
    if (!survey) {throw new Error("Erhebung wurde nicht gefunden.");}

    const {numericItemColumns, numberOfStates, binaryKS} = await validateKnowledgeSpaceFile(knowledgeSpaceFile);
    const existingQuestions = await prisma.question.findMany({
        where: {
            id: {
                in: numericItemColumns,
            },
        },
        select: {
            id: true,
        },
    });

    const existingQuestionIds = new Set(existingQuestions.map(q => q.id));
    const missingQuestionIds = [...new Set(numericItemColumns)].filter(id => !existingQuestionIds.has(id));
    if (missingQuestionIds.length > 0) {
        throw new Error(`Folgende Aufgaben-IDs aus dem Knowledge Space wurden ` + `nicht in der Datenbank gefunden: ${missingQuestionIds.join(", ")}.`);
    }

    const probabilityWorkbook = XLSX.read(probabilityFile.buffer, { type: "buffer" });
    const probabilitySheetName = probabilityWorkbook.SheetNames[0];
    if (!probabilitySheetName) {
        throw new Error("Probability Excel-Datei enthält kein Tabellenblatt.");
    }
    const probabilitySheet = probabilityWorkbook.Sheets[probabilitySheetName];
    if (!probabilitySheet) {
        throw new Error(`Das Tabellenblatt "${probabilitySheetName}" konnte nicht gefunden werden.`);
    }
    const probabilityRows = XLSX.utils.sheet_to_json<Record<string, any>>(probabilitySheet, {defval: null,});
    if (probabilityRows.length === 0) {
        throw new Error("Probability Excel-Datei ist leer.");
    }
    const probabilityFirstRow = probabilityRows[0];
    if (!probabilityFirstRow) {
        throw new Error("Probability Excel-Datei ist leer.");
    }
    const probabilityColumns = Object.keys(probabilityFirstRow);
    if (probabilityColumns.length < 2) {
        throw new Error("Probability Excel muss mindestens eine ID-Spalte und eine Probability-Spalte enthalten.");
    }
    const probabilityIdColumn = probabilityColumns[0];
    const probabilityColumn = probabilityColumns[1];
    if (!probabilityIdColumn || !probabilityColumn) {
        throw new Error("Probability Excel benötigt eine ID- und eine Probability-Spalte.");
    }
    const probabilities = probabilityRows.map(
        (row, index) => {
            const id = row[probabilityIdColumn];
            const probability = row[probabilityColumn];
            if (id === null || id === undefined || id === "") {
                throw new Error(`Fehlende ID in Probability-Zeile ${index + 2}.`);
            }
            if (probability === null || probability === undefined || probability === "") {
                throw new Error(`Fehlende Probability in Zeile ${index + 2}.`);
            }
            const numericProbability = Number(probability);
            if (!Number.isFinite(numericProbability)) {
                throw new Error(`Ungültige Probability in Zeile ${index + 2}: "${probability}".`);
            }
            if (numericProbability < 0 || numericProbability > 1) {
                throw new Error(`Probability in Zeile ${index + 2} muss zwischen 0 und 1 liegen.`);
            }
            return {id, probability: numericProbability,};
        }
    );

    const betaEtaWorkbook = XLSX.read(betaEtaFile.buffer, { type: "buffer" });
    const betaEtaSheetName = betaEtaWorkbook.SheetNames[0];
    if (!betaEtaSheetName) {
        throw new Error("Beta/Eta Excel-Datei enthält kein Tabellenblatt.");
    }
    const betaEtaSheet = betaEtaWorkbook.Sheets[betaEtaSheetName];
    if (!betaEtaSheet) {
        throw new Error(`Das Tabellenblatt "${betaEtaSheetName}" konnte nicht gefunden werden.`);
    }
    const betaEtaRows = XLSX.utils.sheet_to_json<Record<string, any>>(betaEtaSheet, {defval: null,});
    if (betaEtaRows.length === 0) {
        throw new Error("Beta/Eta Excel-Datei ist leer.");
    }
    const betaEtaFirstRow = betaEtaRows[0];
    if (!betaEtaFirstRow) {throw new Error("Beta/Eta Excel-Datei ist leer.");}
    const betaEtaColumns = Object.keys(betaEtaFirstRow);
    if (betaEtaColumns.length < 3) {
        throw new Error("Beta/Eta Excel muss mindestens drei Spalten enthalten: ID, Beta und Eta.");
    }
    const betaEtaIdColumn = betaEtaColumns[0];
    const betaColumn = betaEtaColumns[1];
    const etaColumn = betaEtaColumns[2];
    if (!betaEtaIdColumn || !betaColumn || !etaColumn) {
        throw new Error("Beta/Eta Excel benötigt ID-, Beta- und Eta-Spalten.");
    }

    const expectedColumns = ["itemId", "beta", "eta"];
    const actualColumns = Object.keys(betaEtaRows[0] ?? {});
    if (actualColumns.length !== expectedColumns.length || !expectedColumns.every((column, index) => actualColumns[index] === column)) {
        throw new Error('Die Beta/Eta-Datei muss exakt die Spalten "itemId", "beta" und "eta" in dieser Reihenfolge enthalten.');
    }

    const betaEta = betaEtaRows.map(
        (row, index) => {
            const id = row[betaEtaIdColumn];
            const beta = row[betaColumn];
            const eta = row[etaColumn];
            if (id === null || id === undefined || id === "") {
                throw new Error(`Fehlende ID in Beta/Eta-Zeile ${index + 2}.`);
            }
            if (beta === null || beta === undefined || beta === "") {
                throw new Error(`Fehlendes Beta in Zeile ${index + 2}.`);
            }
            if (eta === null || eta === undefined || eta === "") {
                throw new Error(`Fehlendes Eta in Zeile ${index + 2}.`);
            }
            const numericId = Number(id);
            const numericBeta = Number(beta);
            const numericEta = Number(eta);

            if (!Number.isInteger(numericId)) {
                throw new Error(`Ungültige Aufgaben-ID in Beta/Eta-Zeile ${index + 2}: "${id}".`);
            }
            if (!Number.isFinite(numericBeta)) {
                throw new Error(`Ungültiger Beta-Wert in Zeile ${index + 2}: "${beta}".`);
            }
            if (!Number.isFinite(numericEta)) {
                throw new Error(`Ungültiger Eta-Wert in Zeile ${index + 2}: "${eta}".`);
            }
            if (numericBeta < 0 || numericBeta > 1) {
                throw new Error(`Beta in Zeile ${index + 2} muss zwischen 0 und 1 liegen.`);
            }
            if (numericEta < 0 || numericEta > 1) {throw new Error(`Eta in Zeile ${index + 2} muss zwischen 0 und 1 liegen.`);}
            return {id: numericId, beta: numericBeta, eta: numericEta,};
        }
    );
    if (numberOfStates !== probabilities.length) {
        throw new Error(`Knowledge Space und Probability-Datei passen nicht zusammen. ` + `Knowledge Space enthält ${numberOfStates} Zustände, ` + `Probability-Datei enthält ${probabilities.length} Einträge.`);
    }
    const ksIdSet = new Set(numericItemColumns);
    const betaEtaIds = betaEta.map(entry => entry.id);
    const betaEtaIdSet = new Set(betaEtaIds);
    const missingInBetaEta = numericItemColumns.filter(id => !betaEtaIdSet.has(id));
    const extraInBetaEta = betaEtaIds.filter(id => !ksIdSet.has(id));
    if (missingInBetaEta.length > 0 || extraInBetaEta.length > 0) {
        const details: string[] = [];
        if (missingInBetaEta.length > 0) {
            details.push(`Fehlend in Beta/Eta: ${missingInBetaEta.join(", ")}`);
        }
        if (extraInBetaEta.length > 0) {
            details.push(`Zusätzlich in Beta/Eta: ${extraInBetaEta.join(", ")}`);
        }
        throw new Error(`Knowledge Space und Beta/Eta-Datei passen nicht zusammen. ` + details.join(" "));
    }
    const timestamp = Date.now();
    const safeKsName = knowledgeSpaceFile.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

    const safeProbabilityName = probabilityFile.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

    const safeBetaEtaName = betaEtaFile.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

    const ksFilePath = `surveys/${surveyId}/knowledge-space/${timestamp}_${safeKsName}`;
    const probabilityFilePath = `surveys/${surveyId}/probability/${timestamp}_${safeProbabilityName}`;
    const betaEtaFilePath = `surveys/${surveyId}/beta-eta/${timestamp}_${safeBetaEtaName}`;
    const { error: ksUploadError } =
        await supabase.storage
            .from("knowledge-spaces")
            .upload(
                ksFilePath,
                knowledgeSpaceFile.buffer,
                {
                    contentType: knowledgeSpaceFile.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    upsert: false,
                }
            );

    if (ksUploadError) {
        throw new Error("Knowledge Space konnte nicht in Supabase gespeichert werden: " + ksUploadError.message);
    }

    const { error: probabilityUploadError } =
        await supabase.storage
            .from("probabilities")
            .upload(
                probabilityFilePath,
                probabilityFile.buffer,
                {
                    contentType: probabilityFile.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    upsert: false,
                }
            );

    if (probabilityUploadError) {
        throw new Error("Probability Excel konnte nicht in Supabase gespeichert werden: " + probabilityUploadError.message);
    }
    const { error: betaEtaUploadError } =
        await supabase.storage
            .from("beta-eta")
            .upload(
                betaEtaFilePath,
                betaEtaFile.buffer,
                {
                    contentType:
                        betaEtaFile.mimetype || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    upsert: false,
                }
            );

    if (betaEtaUploadError) {
        throw new Error("Beta/Eta Excel konnte nicht in Supabase gespeichert werden: " + betaEtaUploadError.message);
    }

    const {data: ksPublicUrlData,} = supabase.storage.from("knowledge-spaces").getPublicUrl(ksFilePath);
    const {data: probabilityPublicUrlData,} = supabase.storage.from("probabilities").getPublicUrl(probabilityFilePath);
    const {data: betaEtaPublicUrlData,} = supabase.storage.from("beta-eta").getPublicUrl(betaEtaFilePath);
    const knowledgeSpaceFileUrl = ksPublicUrlData.publicUrl;
    const probabilityDistributionFileUrl = probabilityPublicUrlData.publicUrl;
    const betaEtaFileUrl = betaEtaPublicUrlData.publicUrl;
    await prisma.survey.update({
        where: {
            id: surveyId,
        },
        data: {
            knowledgeSpaceFileUrl,
            probabilityDistributionFileUrl,
            betaEtaFileUrl,
            knowledgeSpaceBinary: Uint8Array.from(binaryKS),
            ksNumberOfStates: numberOfStates,
            ksNumberOfItems: numericItemColumns.length,
            ksQuestionIds: numericItemColumns,
        },
    });

    return {
        knowledgeSpaceFileUrl,
        probabilityDistributionFileUrl,
        betaEtaFileUrl,
        numberOfStates: numberOfStates,
        numberOfItems: numericItemColumns.length,
        numberOfProbabilityEntries: probabilities.length,
        numberOfBetaEtaEntries: betaEta.length,
        itemColumns: numericItemColumns,
    };
};

async function validateKnowledgeSpaceFile(file: Express.Multer.File): Promise<{ numericItemColumns: number[]; numberOfStates: number; numberOfItems: number; wordsPerState: number; binaryKS: Buffer; }> {
    const stream = Readable.from([file.buffer]);
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {sharedStrings: "cache", hyperlinks: "ignore", styles: "ignore", worksheets: "emit",});
    let numericItemColumns: number[] = [];
    let usedColumnIndexes: number[] = [];
    let numberOfStates = 0;
    let foundSheet = false;
    let wordsPerState = 0;
    const CHUNK_SIZE = 100_000;
    const chunks: Buffer[] = [];
    let currentChunk: Buffer | null = null;
    let currentChunkCount = 0;
    let bytesPerState = 0;
    for await (const worksheet of workbookReader) {
        if (foundSheet) break;
        foundSheet = true;
        for await (const row of worksheet) {
            if (row.number === 1) {
                const headers: Array<{ index: number; value: string; }> = [];
                row.eachCell((cell, colNumber) => {
                    const value = String(cell.value ?? "").trim();
                    if (value !== "") {
                        headers.push({index: colNumber, value,});
                    }
                });
                if (headers.length === 0) {
                    throw new Error("Knowledge Space muss mindestens eine Aufgaben-Spalte enthalten.");}
                usedColumnIndexes = headers.map(h => h.index);
                numericItemColumns = headers.map(h => {
                    const id = Number(h.value);
                    if (!Number.isInteger(id)) {
                        throw new Error(`Ungültige Aufgaben-ID: ${h.value}`);}
                    return id;
                });

                if (new Set(numericItemColumns).size !== numericItemColumns.length
                ) {
                    throw new Error("Knowledge Space enthält doppelte Aufgaben-IDs.");
                }
                wordsPerState = Math.ceil(numericItemColumns.length / 32);
                bytesPerState = wordsPerState * 4;
                currentChunk = Buffer.alloc(CHUNK_SIZE * bytesPerState);
                continue;
            }
            if (!row.hasValues) continue;
            if (!currentChunk) {
                throw new Error("Knowledge Space Kopfzeile konnte nicht gelesen werden.");
            }

            const stateOffset = currentChunkCount * bytesPerState;
            for (let itemIndex = 0; itemIndex < usedColumnIndexes.length; itemIndex++) {
                const colNumber = usedColumnIndexes[itemIndex]!;
                const value = row.getCell(colNumber).value;
                if (value === null || value === undefined || String(value).trim() === "") {
                    throw new Error(`Fehlender Wert im Knowledge Space in Zeile ${row.number}.`);
                }
                const numericValue = Number(value);
                if (numericValue !== 0 && numericValue !== 1) {
                    throw new Error(`Ungültiger Wert im Knowledge Space in Zeile ${row.number}. ` + `Erlaubt sind nur 0 und 1.`);
                }
                if (numericValue === 1) {
                    const wordIndex = Math.floor(itemIndex / 32);
                    const bitIndex = itemIndex % 32;
                    const offset = stateOffset + wordIndex * 4;
                    const currentWord = currentChunk.readUInt32LE(offset);
                    const updatedWord = (currentWord | (1 << bitIndex)) >>> 0;
                    currentChunk.writeUInt32LE(updatedWord, offset);
                }
            }
            currentChunkCount++;
            numberOfStates++;
            if (currentChunkCount === CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = Buffer.alloc(CHUNK_SIZE * bytesPerState);
                currentChunkCount = 0;
            }
        }
    }
    if (!foundSheet) {
        throw new Error("Knowledge Space Excel-Datei enthält kein Tabellenblatt.");
    }
    if (numericItemColumns.length === 0) {
        throw new Error("Knowledge Space Excel-Datei enthält keine Kopfzeile.");
    }
    if (numberOfStates === 0) {
        throw new Error("Knowledge Space Excel-Datei enthält keine Zustände.");
    }
    if (currentChunk && currentChunkCount > 0) {
        chunks.push(currentChunk.subarray(0, currentChunkCount * bytesPerState));
    }
    const binaryKS = Buffer.concat(chunks, numberOfStates * bytesPerState);
    return {
        numericItemColumns,
        numberOfStates,
        numberOfItems: numericItemColumns.length,
        wordsPerState,
        binaryKS,
    };
}
