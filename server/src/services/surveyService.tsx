import prisma from "../config/prismaClient.js";
import {Prisma, question_status, type survey, survey_mode, survey_status, type surveyInstance} from "@prisma/client";
import XLSX from "xlsx";
import ExcelJS from "exceljs";
import os from "os";
import path from "path";
import {evaluateAnswersService, type UserAnswerInput} from "./solverService.js";
import {supabase} from "../supabaseClient.js";

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
export const createSurvey = async (data: CreateSurveyInput): Promise<survey> => {
    const createData: any = {
        title: data.title,
        mode: data.mode,
        status: data.status ?? "IN_PROGRESS",
        createdById: data.createdById,
        updatedById: data.updatedById,
        isTwoTier: data.isTwoTier
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
export const getAllSurveys = async (): Promise<survey[]> => {
    return prisma.survey.findMany({
        include: {
            createdBy: {select: {id: true, first_name: true, last_name: true}},
            updatedBy: {select: {id: true, first_name: true, last_name: true}},
            instances: true,
        },
        orderBy: {createdAt: "desc"},
    });
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
    if (data.adaptiveThreshold !== undefined) {updateData.adaptiveThreshold = data.adaptiveThreshold;}
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

/**
 * Export survey answers for selected instances, including question scores
 */
export const getSurveyExport = async (
    surveyId: number,
    instanceIds: number[]
): Promise<string> => {

    const survey = await prisma.survey.findUnique({
        where: {id: surveyId},
        include: {
            booklet: {
                include: {
                    bookletQuestion: true
                }
            }
        }
    });

    if (!survey) {
        throw new Error("Survey not found");
    }


    const allQuestionIds = Array.from(
        new Set(
            survey.booklet
                .flatMap(b => b.bookletQuestion)
                .map(q => q.questionId)
        )
    );


    const instances = await prisma.surveyInstance.findMany({
        where: {
            id: {
                in: instanceIds
            },
            surveyId
        }
    });


    const answers = await prisma.answer.findMany({
        where: {
            surveyId,
            instanceId: {
                in: instanceIds
            }
        },
        include: {
            questionsAnswers: {
                include: {
                    feedbackAnswer: true
                }
            },
            booklet: {
                include: {
                    bookletQuestion: true
                }
            }
        }
    });

    const filePath = path.join(os.tmpdir(), `survey_export_${Date.now()}.xlsx`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: filePath,
        useStyles: false,
        useSharedStrings: false
    });
    const worksheet = workbook.addWorksheet("SurveyAnswers");
    const baseColumns = [
        "SchuelerID_System",
        "SchuelerID_Extern",
        "GruppenID_ausLink",
        "GruppenBezeichnung",
        "Booklet_ID",
        "Booklet_Version",
        "Freier_Parameter",
        "Erhebung_StartedAt",
        "Erhebung_EndedAt"
    ];
    const questionColumns = allQuestionIds.flatMap(id => {
        const prefix = `Aufgabe_${id}_`;
        return [
            `${prefix}SystemID`,
            `${prefix}Position`,
            `${prefix}RawResponse`,
            `${prefix}CorrectResponse`,
            `${prefix}Score`,
            `${prefix}Feedback`,
            `${prefix}Zeit_Sekunden`,
            `${prefix}Skipped`
        ];
    });
    const columns = [...baseColumns, ...questionColumns];
    worksheet.columns = columns.map((key) => ({header: key, key: key, width: 20}));
    const evaluationCache = new Map<number, any>();
    for (const answer of answers) {
        const instance = instances.find(i => i.id === answer.instanceId);
        if (!instance)
            continue;
        const qaMap = new Map<number, typeof answer.questionsAnswers[0]>();
        for (const qa of answer.questionsAnswers) {
            qaMap.set(qa.questionId, qa);
        }

        const bookletQuestionSet = new Set(answer.booklet.bookletQuestion.map(q => q.questionId));
        const bookletPositionMap = new Map<number, number>();
        for (const bq of answer.booklet.bookletQuestion) {
            bookletPositionMap.set(
                bq.questionId,
                bq.position
            );
        }

        const earliestStart =
            answer.questionsAnswers
                .map(q => q.solvingTimeStart)
                .filter(Boolean)
                .map(d => new Date(d).getTime())
                .reduce(
                    (min, v) => Math.min(min, v),
                    Infinity
                );


        const user =
            await prisma.anonymousUser.findUnique({
                where: {
                    externalId: answer.userId
                },
                select: {
                    id: true
                }
            });

        const row: any = {
            SchuelerID_System: answer.userId,
            SchuelerID_Extern: user?.id ?? "",
            GruppenID_ausLink: instance.id,
            GruppenBezeichnung: instance.name,
            Booklet_ID: answer.booklet.bookletId,
            Booklet_Version: answer.booklet.version,
            Freier_Parameter: answer.freeParam,
            Erhebung_StartedAt: earliestStart !== Infinity ? formatSwissDate(new Date(earliestStart).toISOString()) : "",
            Erhebung_EndedAt: answer.endedAt ? formatSwissDate(answer.endedAt) : ""
        };

        for (const questionId of allQuestionIds) {
            const prefix = `Aufgabe_${questionId}_`;
            if (!bookletQuestionSet.has(questionId)) {
                Object.assign(row, {
                    [`${prefix}SystemID`]: "",
                    [`${prefix}Position`]: "",
                    [`${prefix}RawResponse`]: "",
                    [`${prefix}CorrectResponse`]: "",
                    [`${prefix}Score`]: "",
                    [`${prefix}Feedback`]: "",
                    [`${prefix}Zeit_Sekunden`]: "",
                    [`${prefix}Skipped`]: "",
                });
                continue;
            }
            const qa =
                qaMap.get(questionId);

            if (!qa) {
                Object.assign(row, {
                    [`${prefix}SystemID`]: questionId,
                    [`${prefix}Position`]:
                        bookletPositionMap.get(questionId) ?? "",
                    [`${prefix}RawResponse`]: "",
                    [`${prefix}CorrectResponse`]: "",
                    [`${prefix}Score`]: "",
                    [`${prefix}Feedback`]: "",
                    [`${prefix}Zeit_Sekunden`]: "",
                    [`${prefix}Skipped`]: "",
                });

                continue;
            }
            let result = evaluationCache.get(questionId);
            if (!result) {
                const answerArray =
                    Array.isArray(qa.answerJson)
                        ? qa.answerJson as any[]
                        : [];
                const input =
                    answerArray.map(a => ({
                        key: a.key,
                        value: a.value,
                        m: a.m,
                        c: a.c
                    }));

                result = await evaluateAnswersService(questionId, input);
                evaluationCache.set(questionId, result);
            }
            const answerArray = Array.isArray(qa.answerJson) ? qa.answerJson as any[] : [];
            const userMap = new Map(answerArray.map(a => [a.key, a]));

            const orderedCorrect = Object.keys(result?.correctAnswers ?? {}).map(key => ({
                key,
                user: userMap.get(key),
                correct:
                    result.correctAnswers[key]
            }));

            Object.assign(row, {
                [`${prefix}SystemID`]: qa.questionId,
                [`${prefix}Position`]: bookletPositionMap.get(questionId) ?? "",
                [`${prefix}RawResponse`]: orderedCorrect.map(x => x.user ? formatUserAnswer([x.user]) : "[]").join(", "),
                [`${prefix}CorrectResponse`]: orderedCorrect.map(x => formatCorrectAnswer({[x.key]: x.correct})).join(", "),
                [`${prefix}Score`]: (result?.score ?? []).join(", "),
                [`${prefix}Feedback`]: formatFeedback(qa.feedbackAnswer ?? []),
                [`${prefix}Zeit_Sekunden`]: qa.solvedTime ?? "",
                [`${prefix}Skipped`]: qa.skipped ?? ""
            });
        }
        for (const key of Object.keys(row)) {
            row[key] = sanitizeExcelValue(row[key]);
        }
        worksheet.addRow(row).commit();
    }
    await workbook.commit();
    return filePath;
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

function formatSwissDate(isoString: string | Date | null | undefined): string {
    if (!isoString) return "";

    const date = typeof isoString === "string" ? new Date(isoString) : isoString;
    return date.toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).replace(",", "");
}

function formatFeedback(feedbackArray: any[]): string {
    const questionKeys = ["q1", "q2", "q3"];
    return questionKeys
        .map(key => {
            const fb = feedbackArray.find(f => f.questionKey === key);
            return fb ? `[${key}: "${fb.selectedOption}"]` : `[${key}]`;
        })
        .join(", ");
}

function formatUserAnswer(answerArray: any[]): string {
    if (!Array.isArray(answerArray) || !answerArray.length) return "[]";
    return answerArray
        .map(ans => {
            switch (ans.kind) {
                case "mc":
                case "sc":
                    if (!Array.isArray(ans.value)) return "[]";
                    const result = ans.value
                        .map((v: any, i: number) => (v.selected ? i + 1 : null))
                        .filter((v: number | null) => v !== null);
                    return result.length ? `[${result.join(", ")}]` : "[]";
                case "numeric":
                case "algebra":
                case "lineEquation":
                case "freeText":
                case "freeTextInline":
                    return `[${ans.value ? `${ans.value}` : ""}]`;
                case "geoGebraPoints":
                    let index2 = 1;
                    return `[${ans.value
                        .map((v: any) => `[${index2++}${v.x}, ${v.y}]`)
                        .join(",")}]`;
                case "geoGebraLines":
                    return `[${ans.value
                        .map((v: any) => `["c":${v.c}, "m":${v.m}, "p1":${v.point1.x}, ${v.point1.y}, "p2":${v.point2.x}, ${v.point2.y}]`)
                        .join(",")}]`;
                case "geoGebraSlope":
                    return `[${ans.value ? `["l1": p1 - ${ans.value.point1Line1?.x}, ${ans.value.point1Line1?.y} zu p2 - ${ans.value.point2Line1?.x}, ${ans.value.point2Line1?.y}, "l2": p1 - ${ans.value.point1Line2?.x}, ${ans.value.point1Line2?.y} zu p2 - ${ans.value.point2Line2?.x}, ${ans.value.point2Line2?.y}]` : ""}]`;
                default:
                    return `[${ans.value ?? ""}]`;
            }
        })
        .join(", ");
}

function formatCorrectAnswer(input: any): string {
    const answerArray = normalizeCorrectAnswer(input);
    if (!answerArray.length) return "[]";

    return answerArray
        .map(ans => {
            switch (ans.type) {
                case "mc":
                    if (!Array.isArray(ans.value)) return "[]";
                    let index = 1;
                    return `[${ans.value.map(() => `${index++}`).join(", ")}]`;
                case "sc":
                    return `[${ans.value ? `${ans.value}` : ""}]`;
                case "algebra":
                case "freeText":
                case "freeTextInline":
                    return `[${ans.value ? `${ans.value}` : ""}]`;
                case "lineEquation":
                    return `[m:${ans.value?.m?.[0]?.value ?? ""}, c:${ans.value?.c?.[0]?.value ?? ""}]`;
                case "numeric":
                case "geoGebraSlope":
                    return `[${ans.value?.map((v: any) => v.value).join(", ") ?? ""}]`;
                case "geoGebraPoints":
                    let index2 = 1;
                    return Object.entries(ans.value || {}).map(([pointName, coords]: any) => {
                        const x = coords.x?.map((v: any) => v.value).join("|") ?? "";
                        const y = coords.y?.map((v: any) => v.value).join("|") ?? "";
                        return `[${index2++}: x=${x}, y=${y}]`;
                    })
                        .join(", ");
                case "geoGebraLines":
                    let index3 = 1;
                    return Object.entries(ans.value || {})
                        .map(([lineName, line]: any) => {
                            const m = line.m?.map((v: any) => v.value).join("|") ?? "";
                            const c = line.c?.map((v: any) => v.value).join("|") ?? "";
                            return `[${index3++}: m=${m}, c=${c}]`;
                        })
                        .join(", ");
                default:
                    return `[${JSON.stringify(ans.value ?? "")}]`;
            }
        })
        .join(", ");
}

function normalizeCorrectAnswer(input: any): any[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return Object.entries(input).map(([key, val]: any) => ({
        key,
        ...val
    }));
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

function sanitizeExcelValue(value:any) {
    if (typeof value !== "string") return value;

    return value.replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
        ""
    );
}

export const setSurveyTeacherAssignableService = async (surveyId: number, teacherAssigned: boolean
) => {
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

export const uploadKnowledgeSpaceService = async (
    surveyId: number,
    file: Express.Multer.File
) => {
    const workbook = XLSX.read(file.buffer, {
        type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error("Excel-Datei enthält kein Tabellenblatt.");
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {throw new Error(`Das Tabellenblatt "${sheetName}" konnte nicht gefunden werden.`);}
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {defval: null,});
    if (rows.length === 0) {
        throw new Error("Knowledge Space Excel-Datei ist leer.");
    }
    const firstRow = rows[0];
    if (!firstRow) {throw new Error("Knowledge Space Excel-Datei ist leer.");}
    const columns = Object.keys(firstRow);
    if (columns.length < 2) {throw new Error("Knowledge Space muss mindestens eine Zustands-Spalte und eine Aufgaben-Spalte enthalten.");}
    const stateColumn = columns[0];
    const itemColumns = columns.slice(1);
    const ks = rows.map((row, index) => {
        return itemColumns.map((column) => {
            const value = row[column];

            if (value !== 0 && value !== 1) {
                throw new Error(
                    `Ungültiger Wert in Zeile ${index + 2}, Spalte "${column}". ` +
                    `Erlaubt sind nur 0 und 1.`
                );
            }

            return Number(value);
        });
    });
    const survey = await prisma.survey.findUnique({
        where: {
            id: surveyId,
        },
        select: {
            id: true,
        },
    });

    if (!survey) {
        throw new Error("Erhebung wurde nicht gefunden.");
    }

    const safeName = file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

    const fileName = `${Date.now()}_${safeName}`;

    const filePath = `surveys/${surveyId}/knowledge-space/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("knowledge-spaces")
        .upload(filePath, file.buffer, {
            contentType:
                file.mimetype ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            upsert: false,
        });

    if (uploadError) {
        throw new Error(
            "Knowledge Space konnte nicht in Supabase gespeichert werden: " +
            uploadError.message
        );
    }
    const { data: publicUrlData } = supabase.storage
        .from("knowledge-spaces")
        .getPublicUrl(filePath);
    const knowledgeSpaceFileUrl = publicUrlData.publicUrl;
    await prisma.survey.update({
        where: {
            id: surveyId,
        },
        data: {
            knowledgeSpaceFileUrl,
        },
    });

    return {
        stateColumn,
        itemColumns,
        ks,
        numberOfStates: ks.length,
        numberOfItems: itemColumns.length,
        knowledgeSpaceFileUrl,
    };
};

export const uploadProbabilityService = async (
    surveyId: number,
    file: Express.Multer.File
) => {
    if (!file) {throw new Error("Keine Excel-Datei hochgeladen.");}
    const workbook = XLSX.read(file.buffer, {type: "buffer",});
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {throw new Error("Excel-Datei enthält kein Tabellenblatt.");}
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {throw new Error(`Das Tabellenblatt "${sheetName}" konnte nicht gefunden werden.`);}
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {defval: null,});
    if (rows.length === 0) {throw new Error("Probability Excel-Datei ist leer.");}

    const firstRow = rows[0];
    if (!firstRow) {throw new Error("Probability Excel-Datei ist leer.");}

    const columns = Object.keys(firstRow);
    if (columns.length < 2) {throw new Error("Probability Excel muss mindestens eine ID-Spalte und eine Probability-Spalte enthalten.");}
    const idColumn = columns[0];
    const probabilityColumn = columns[1];
    if (!idColumn) {throw new Error("idColumn ist leer.");}
    if (!probabilityColumn) {throw new Error("probabilityColumn ist leer.");}

    const probabilities = rows.map((row, index) => {
        const id = row[idColumn];
        const probability = row[probabilityColumn];
        if (id === null || id === undefined || id === "") {
            throw new Error(`Fehlende ID in Zeile ${index + 2}.`);
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
    });

    const survey = await prisma.survey.findUnique({
        where: {
            id: surveyId,
        },
        select: {
            id: true,
        },
    });

    if (!survey) {
        throw new Error("Erhebung wurde nicht gefunden.");
    }

    const safeName = file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");

    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `surveys/${surveyId}/probability/${fileName}`;
    const { error: uploadError } = await supabase.storage
        .from("probabilities")
        .upload(filePath, file.buffer, {
            contentType:
                file.mimetype ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            upsert: false,
        });

    if (uploadError) {
        throw new Error("Probability Excel konnte nicht in Supabase gespeichert werden: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from("probabilities").getPublicUrl(filePath);
    const probabilityFileUrl = publicUrlData.publicUrl;
    await prisma.survey.update({
        where: {
            id: surveyId,
        },
        data: {
            probabilityDistributionFileUrl: probabilityFileUrl,
        },
    });

    return {
        idColumn,
        probabilityColumn,
        probabilities,
        numberOfEntries: probabilities.length,
        probabilityFileUrl,
    };
};