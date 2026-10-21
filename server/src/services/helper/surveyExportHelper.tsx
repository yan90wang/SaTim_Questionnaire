import type { Prisma } from "@prisma/client";
import prisma from "../../config/prismaClient.js";
import {evaluateAnswersService} from "../solverService.js";
import {sanitizeExcelValue} from "../surveyService.js";
import path from "path";
import os from "os";
import ExcelJS from "exceljs";

export const questionAnswerInclude = {feedbackAnswer: true,} satisfies Prisma.questionAnswerInclude;

export type ExportQuestionAnswer = Prisma.questionAnswerGetPayload<{ include: typeof questionAnswerInclude; }>;

export interface ExportAnswer {
    userId: string;
    instanceId: number;
    freeParam: string | null;
    endedAt: Date | null;
    questionsAnswers: ExportQuestionAnswer[];
    assignedQuestionIds: number[];
    positionMap: Map<number, number>;
    additionalColumns: Record<string, unknown>;
}

const COMMON_COLUMNS = [
    "SchuelerID_System",
    "SchuelerID_Extern",
    "GruppenID_ausLink",
    "GruppenBezeichnung",
];

const END_COLUMNS = [
    "Freier_Parameter",
    "Erhebung_StartedAt",
    "Erhebung_EndedAt",
];

const DESIGN_COLUMNS = [
    "Booklet_ID",
    "Booklet_Version",
];

const ADAPTIVE_COLUMNS = [
    "Gefragte Items",
    "Finale Probabilities",
    "Höchste Probability - Wert",
    "Höchste Probability - KS-Zustand",
];

const getQuestionColumns = (questionIds: number[]): string[] =>
    questionIds.flatMap(id => {
        const prefix = `Aufgabe_${id}_`;

        return [
            `${prefix}SystemID`,
            `${prefix}Position`,
            `${prefix}RawResponse`,
            `${prefix}CorrectResponse`,
            `${prefix}Score`,
            `${prefix}Feedback`,
            `${prefix}Zeit_Sekunden`,
            `${prefix}Skipped`,
        ];
    });

const getAnonymousUserMap = async (answers: ExportAnswer[]): Promise<Map<string, number>> => {
    const userIds = [...new Set(
        answers.map(answer => answer.userId)
    )];

    if (userIds.length === 0) {
        return new Map();
    }

    const users = await prisma.anonymousUser.findMany({
        where: {
            externalId: { in: userIds },
        },
        select: {
            id: true,
            externalId: true,
        },
    });

    return new Map(
        users.map(user => [user.externalId, user.id])
    );
};

const getEarliestStart = (questionsAnswers: ExportQuestionAnswer[]): string => {
    if (questionsAnswers.length === 0) {
        return "";
    }
    const earliest = Math.min(
        ...questionsAnswers.map(qa =>
            qa.solvingTimeStart.getTime()
        )
    );
    return Number.isFinite(earliest) ? formatSwissDate(new Date(earliest).toISOString()) : "";
};

const getCommonAnswerRow = (answer: ExportAnswer, instance: { id: number; name: string }, userMap: Map<string, number>): Record<string, any> => ({
    SchuelerID_System: answer.userId,
    SchuelerID_Extern: userMap.get(answer.userId) ?? "",
    GruppenID_ausLink: instance.id,
    GruppenBezeichnung: instance.name,

    ...answer.additionalColumns,

    Freier_Parameter: answer.freeParam,
    Erhebung_StartedAt:
        getEarliestStart(answer.questionsAnswers),
    Erhebung_EndedAt: answer.endedAt
        ? formatSwissDate(answer.endedAt)
        : "",
});

export function formatSwissDate(isoString: string | Date | null | undefined): string {
    if (!isoString) return "";
    const date = typeof isoString === "string" ? new Date(isoString) : isoString;
    return date.toLocaleString("de-CH", {
        timeZone: "Europe/Zurich",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).replace(",", "");
}


const getEmptyQuestionColumns = (
    questionId: number,
    assigned: boolean,
    position?: number
): Record<string, any> => {
    const prefix = `Aufgabe_${questionId}_`;

    return {
        [`${prefix}SystemID`]: assigned ? questionId : "",
        [`${prefix}Position`]:
            assigned ? position ?? "" : "",
        [`${prefix}RawResponse`]: "",
        [`${prefix}CorrectResponse`]: "",
        [`${prefix}Score`]: "",
        [`${prefix}Feedback`]: "",
        [`${prefix}Zeit_Sekunden`]: "",
        [`${prefix}Skipped`]: "",
    };
};

const getQuestionAnswerColumns = async (questionId: number, qa: ExportQuestionAnswer | undefined, assigned: boolean, position?: number): Promise<Record<string, any>> => {
    if (!assigned || !qa) {
        return getEmptyQuestionColumns(
            questionId,
            assigned,
            position
        );
    }
    const prefix = `Aufgabe_${questionId}_`;
    const answerArray = Array.isArray(qa.answerJson)
        ? qa.answerJson as any[]
        : [];

    const input = answerArray.map(a => ({
        key: a.key,
        value: a.value,
        m: a.m,
        c: a.c,
    }));

    const result = await evaluateAnswersService(questionId, input);
    const userAnswerMap = new Map(answerArray.map(a => [a.key, a]));
    const orderedCorrect = Object.keys(result?.correctAnswers ?? {}).map(key => ({
        key,
        user: userAnswerMap.get(key),
        correct: result?.correctAnswers[key],
    }));

    return {
        [`${prefix}SystemID`]: qa.questionId,
        [`${prefix}Position`]: position ?? "",
        [`${prefix}RawResponse`]: orderedCorrect.map(x => x.user ? formatUserAnswer([x.user]) : "[]").join(", "),
        [`${prefix}CorrectResponse`]: orderedCorrect.map(x => formatCorrectAnswer({[x.key]: x.correct,})).join(", "),
        [`${prefix}Score`]: (result?.score ?? []).join(", "),
        [`${prefix}Feedback`]: formatFeedback(qa.feedbackAnswer ?? []),
        [`${prefix}Zeit_Sekunden`]: qa.solvedTime ?? "",
        [`${prefix}Skipped`]: qa.skipped ?? "",
    };
};

export const writeSurveyExport = async (surveyId: number, instanceIds: number[], allQuestionIds: number[], answers: ExportAnswer[], mode: "DESIGN" | "ADAPTIV"): Promise<string> => {
    const instances = await prisma.surveyInstance.findMany({
        where: {
            surveyId,
            id: { in: instanceIds },
        },
        select: {
            id: true,
            name: true,
        },
    });
    const instanceMap = new Map(instances.map(instance => [instance.id, instance]));
    const userMap = await getAnonymousUserMap(answers);
    const filePath = path.join(os.tmpdir(), `survey_export_${mode.toLowerCase()}_${Date.now()}.xlsx`);

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        filename: filePath,
        useStyles: false,
        useSharedStrings: false,
    });
    const worksheet = workbook.addWorksheet("SurveyAnswers");
    const modeColumns = mode === "ADAPTIV" ? ADAPTIVE_COLUMNS : DESIGN_COLUMNS;
    const columns = [
        ...COMMON_COLUMNS,
        ...modeColumns,
        ...END_COLUMNS,
        ...getQuestionColumns(allQuestionIds),
    ];
    worksheet.columns = columns.map(key => ({header: key, key, width: 20,}));
    for (const answer of answers) {
        const instance = instanceMap.get(answer.instanceId);
        if (!instance) {
            continue;
        }

        const row = getCommonAnswerRow(answer, instance, userMap);
        const assignedSet = new Set(answer.assignedQuestionIds);
        const qaMap = new Map(answer.questionsAnswers.map(qa => [qa.questionId, qa,]));
        for (const questionId of allQuestionIds) {
            const questionColumns =
                await getQuestionAnswerColumns(
                    questionId,
                    qaMap.get(questionId),
                    assignedSet.has(questionId),
                    answer.positionMap.get(questionId)
                );

            Object.assign(row, questionColumns);
        }
        for (const key of Object.keys(row)) {
            row[key] = sanitizeExcelValue(row[key]);
        }
        worksheet.addRow(row).commit();
    }
    await workbook.commit();
    return filePath;
};

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

function formatFeedback(feedbackArray: any[]): string {
    const questionKeys = ["q1", "q2", "q3"];
    return questionKeys
        .map(key => {
            const fb = feedbackArray.find(f => f.questionKey === key);
            return fb ? `[${key}: "${fb.selectedOption}"]` : `[${key}]`;
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
                    return `[${ans.value.join(", ")}]`;
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
