import prisma from "../config/prismaClient.js";
import type {question} from "@prisma/client";
import {ce} from "../index.js";

type AnswerType = "sc" | "mc" | "numeric" | "freeText" | "geoGebraPoints" | "geoGebraLines" | "freeTextInline" | "lineEquation" | "algebra" | "geoGebraSlope";

interface CorrectAnswerBase {
    type: AnswerType;
}

interface SingleChoiceAnswer extends CorrectAnswerBase {
    type: "sc";
    value: string;
}

interface MultipleChoiceAnswer extends CorrectAnswerBase {
    type: "mc";
    value: string[];
}

interface NumericAnswer extends CorrectAnswerBase {
    type: "numeric";
    value: number;
    operator?: "=" | "<" | ">" | "<=" | ">=";
}

interface FreeTextAnswer extends CorrectAnswerBase {
    type: "freeText" | "freeTextInline";
    value: string;
}

interface GeoGebraPointAnswer extends CorrectAnswerBase {
    type: "geoGebraPoints";
    value: any;
}

interface GeoGebraLineAnswer extends CorrectAnswerBase {
    type: "geoGebraLines";
    value: any;
}

interface AlgebraAnswer extends CorrectAnswerBase {
    type: "algebra";
    value: string;
}

interface LineEquationAnswer extends CorrectAnswerBase {
    type: "lineEquation";
    value: {
        m: NumericCondition[];
        c: NumericCondition[];
    };
}

interface GeoGebraSlopeAnswer extends CorrectAnswerBase {
    type: "geoGebraSlope";
    value: any;
}

type NumericCondition = {
    value: string;
    operator: "=" | "<" | ">" | "<=" | ">=";
    logic?: "and" | "or";
};

type CorrectAnswer = | SingleChoiceAnswer | MultipleChoiceAnswer | NumericAnswer | LineEquationAnswer | FreeTextAnswer | GeoGebraPointAnswer | GeoGebraLineAnswer | AlgebraAnswer | GeoGebraSlopeAnswer;

type CorrectAnswersJson = Record<string, CorrectAnswer>;

export interface UserAnswerInput {
    key: string;
    value: any;
}

export interface EvaluateDetail {
    key: string;
    given: any;
    expected: any;
    correct: boolean;
}

export interface EvaluateResult {
    score: number[];
    total: number;
    details: EvaluateDetail[];
    correctAnswers: any;
}

export const evaluateAnswersService = async (questionId: number, userAnswers: UserAnswerInput[]): Promise<EvaluateResult | null> => {
    const questionEntry: Pick<question, "id" | "correctAnswers" | "contentJson"> | null =
        await prisma.question.findUnique({
            where: {id: questionId},
            select: {id: true, correctAnswers: true, contentJson: true}
        });
    if (!questionEntry) {
        console.log("Question not found at evaluateAnswers.");
        return null;
    }
    const correctAnswers = questionEntry.correctAnswers as CorrectAnswersJson | null;
    if (!correctAnswers || typeof correctAnswers !== "object") {
        console.log("No correct answers found for this question");
        return null;
    }

    const score: number[] = [];
    const total = Object.keys(correctAnswers).length;
    const details: EvaluateDetail[] = [];
    const returnCorrectAnswers = JSON.parse(JSON.stringify(correctAnswers));
    for (const key of Object.keys(correctAnswers)) {
        const correctAnswer = correctAnswers[key];
        const userAnswer = userAnswers.find(a => a.key === key);
        const returnCorrectAnswer = returnCorrectAnswers[key];
        let isCorrect = false;
        if (returnCorrectAnswer && questionEntry.contentJson) {
            if (correctAnswer?.type === "sc") {
                const index = getSCIndex(questionEntry.contentJson, correctAnswer.value, "singleChoice");
                if (index !== null) {
                    returnCorrectAnswer.value = index;
                }
            }
            if (correctAnswer?.type === "mc") {
                const indices = getMCIndeces(questionEntry.contentJson, correctAnswer.value);
                returnCorrectAnswer.value = indices;
            }
        }
        if (userAnswer && correctAnswer) {
            switch (correctAnswer.type) {
                case "mc": {
                    const selectedIds = (userAnswer.value as { id: string; selected: boolean; }[]).filter(a => a.selected).map(a => a.id);
                    const correctIds = correctAnswer.value as string[];
                    const sameLength = selectedIds.length === correctIds.length;
                    const allCorrect = selectedIds.every(id => correctIds.includes(id));
                    if (sameLength && allCorrect) {
                        isCorrect = true;
                    }
                    break;
                }
                case "sc": {
                    const selected = (userAnswer.value as { id: string; selected: boolean }[]).find(a => a.selected)?.id;
                    if (selected === correctAnswer.value) {
                        isCorrect = true;
                    }
                    break;
                }
                case "numeric": {
                    const conditions = Array.isArray(correctAnswer.value) ? correctAnswer.value : [{value: String(correctAnswer.value), operator: correctAnswer.operator || "=", logic: "and"}];
                    if (!userAnswer.value) {
                        break;
                    }
                    const userVal = Number(userAnswer.value);

                    let result = conditions[0]?.logic === "and";
                    for (const condition of conditions) {
                        const condValue = Number(condition.value);
                        let check = false;
                        const EPS = 0.005;
                        switch (condition.operator) {
                            case "=":
                                check = Math.abs(userVal - condValue) < EPS;
                                break;
                            case "<":
                                check = userVal < condValue - EPS;
                                break;
                            case ">":
                                check = userVal > condValue + EPS;
                                break;
                            case "<=":
                                check = userVal <= condValue + EPS;
                                break;
                            case ">=":
                                check = userVal >= condValue - EPS;
                                break;
                        }
                        if (condition.logic === "and") result = result && check;
                        else result = result || check;
                    }
                    if (result) {
                        isCorrect = true;
                    }
                    break;
                }
                case "freeText":
                case "freeTextInline":
                    if (correctAnswer.value.trim().toLowerCase() === String(userAnswer.value).trim().toLowerCase()) {
                        isCorrect = true;
                    }
                    break;
                case "geoGebraPoints": {
                    const ok = checkGeoGebraPoints(correctAnswer.value, userAnswer.value);
                    if (ok) {
                        isCorrect = true;
                    }
                    break;
                }
                case "geoGebraLines": {
                    const ok = checkGeoGebraLines(correctAnswer.value, userAnswer.value);
                    if (ok) {
                        isCorrect = true;
                    }
                    break;
                }
                case "algebra": {
                    try {
                        if (checkAlgebraEquality(correctAnswer.value, userAnswer.value)) {
                            isCorrect = true;
                        }
                    } catch (err) {
                        console.log("Algebra evaluation error:", err);}
                    break;
                }
                case "lineEquation": {
                    const ua = userAnswer as any;
                    try {
                        const answer = getLineEquationCoeffs(ua.value);
                        if (answer) {
                            const userM = Number(answer.m);
                            const userC = Number(answer.c);
                            if (!Number.isFinite(userM) || !Number.isFinite(userC)) break;
                            const {m, c} = correctAnswer.value;
                            const answerIsCorrect = checkAndSubstituteLineEquation(userM, userC, m, c);
                            if (answerIsCorrect) {
                                isCorrect = true;
                            }
                        }
                    } catch (err) {
                        console.log(err);
                        break;
                    }
                    break;
                }
                case "geoGebraSlope": {
                    try {
                        const data = userAnswer.value;
                        if (!data || !data.point1Line1 || !data.point2Line1 || !data.point1Line2 || !data.point2Line2) {
                            break;
                        }
                        const line1Points = [data.point1Line1, data.point2Line1];
                        const line2Points = [data.point1Line2, data.point2Line2];
                        const perpendicular = linesArePerpendicular(line1Points[0], line1Points[1], line2Points[0], line2Points[1]);
                        if (!perpendicular) {
                            break;
                        }
                        const sharedPoint = findSharedPoint(line1Points, line2Points);

                        if (!sharedPoint) {break;}
                        const point1 = getOuterPoint(line1Points, sharedPoint);
                        const point2 = getOuterPoint(line2Points, sharedPoint);

                        if (!point1 || !point2) {break;}

                        const slope = calculateSlope(point1, point2);

                        if (checkNumericConditions(slope, correctAnswer.value)) {
                            isCorrect = true;
                        }
                    } catch (err) {
                        console.log("geoGebraSlope evaluation error:", err);
                    }
                    break;
                }
            }
        }
        score.push(isCorrect ? 1 : 0);
        details.push({
            key,
            given: userAnswer?.value ?? null,
            expected: returnCorrectAnswer?.value,
            correct: isCorrect
        });
    }
    return {
        score,
        total,
        details,
        correctAnswers: returnCorrectAnswers
    };
};

function matchPoint(userPoint: { x: number; y: number }, correctPoint: { x: NumericCondition[]; y: NumericCondition[] }) {
    return (
        checkNumericConditions(userPoint.x, correctPoint.x) &&
        checkNumericConditions(userPoint.y, correctPoint.y)
    );
}

function checkNumericConditions(value: number, conditions: NumericCondition[]): boolean {
    const EPS = 0.005;
    let result = conditions[0]?.logic !== "or";

    for (const cond of conditions) {
        const target = evaluateCondition(cond);
        let check = false;
        switch (cond.operator) {
            case "=":
                check = Math.abs(value - target) < EPS;
                break;
            case "<":
                check = value < target - EPS;
                break;
            case ">":
                check = value > target + EPS;
                break;
            case "<=":
                check = value <= target + EPS;
                break;
            case ">=":
                check = value >= target - EPS;
                break;
        }
        if (cond.logic === "or") result = result || check;
        else result = result && check;
    }
    return result;
}

function checkGeoGebraPoints(correct: Record<string, any>, user: { name: string; x: number; y: number }[]): boolean {
    const userUnused = [...user];
    for (const correctPoint of Object.values(correct)) {
        const index = userUnused.findIndex(u =>
            matchPoint(u, correctPoint)
        );
        if (index === -1) return false;
        userUnused.splice(index, 1);
    }
    return true;
}

function matchLine(userLine: { m: number; c: number }, correctLine: { m: NumericCondition[]; c: NumericCondition[] }): boolean {
    const mOk = checkNumericConditions(userLine.m, correctLine.m);
    const cOk = checkNumericConditions(userLine.c, correctLine.c);
    return mOk && cOk;
}

function checkAndSubstituteLineEquation(m: number, c: number, mConditions: NumericCondition[], cConditions: NumericCondition[]): boolean {
    const hasC = mConditions.some(condition => /c/i.test(condition.value));
    const hasM = cConditions.some(condition => /m/i.test(condition.value));
    if (hasC && hasM) {
        return false;
    }
    if (hasC) {
        mConditions.forEach(condition => {
            const evaluated = substituteAndEvaluate(condition.value, "c", c);
            condition.value = String(evaluated);
        });
    }
    if (hasM) {
        cConditions.forEach(condition => {
            const evaluated = substituteAndEvaluate(condition.value, "m", m);
            condition.value = String(evaluated);
        });
    }
    const mOk = checkNumericConditions(m, mConditions);
    const cOk = checkNumericConditions(c, cConditions);
    return mOk && cOk;
}

function checkGeoGebraLines(correct: Record<string, any>, user: { m: number; c: number }[]): boolean {
    const userUnused = [...user];
    for (const correctLine of Object.values(correct)) {
        const index = userUnused.findIndex(u => matchLine(u, correctLine));
        if (index === -1) {
            return false;
        }
        userUnused.splice(index, 1);
    }
    return true;
}

function getLineEquationCoeffs(latex: string): { m: number; c: number } | null {
    try {
        let expr = ce.parse(latex, { syntax: "latex" });
        if (!expr.isFunctionExpression || expr.operator !== "Equal") {
            expr = ce.parse(`y=${latex}`, {syntax: "latex"});
        }
        if (!expr.isFunctionExpression || expr.operator !== "Equal") return null;
        const lhs = expr.op1;
        const rhs = expr.op2;
        let lineExpr;

        if (lhs.symbol === "y") {
            lineExpr = rhs;
        } else if (rhs.symbol === "y") {
            lineExpr = lhs;
        } else {
            return null;
        }
        const c = Number(lineExpr.subs({ x: 0 }).simplify().N().valueOf());
        const m = Number(lineExpr.subs({ x: 1 }).simplify().N().valueOf()) - c;
        return { m, c };
    } catch (err) {
        console.log(err);
        return null;
    }
}

function evaluateCondition(cond: { value: string; operator: string }): number {
    const expr = ce.parse(cond.value, { syntax: "latex" });
    const num = Number(expr.simplify().N().valueOf());
    if (!Number.isFinite(num)) {
        throw new Error(`Invalid numeric value: ${cond.value}`);
    }
    return num;
}

function substituteAndEvaluate(expressionLatex: string, variable: "m" | "c", value: number): number {
    const expr = ce.parse(expressionLatex, { syntax: "latex" });
    const substituted = expr
        .subs({ [variable]: value })
        .simplify()
        .N();
    const result = Number(substituted.valueOf());
    if (!Number.isFinite(result)) {
        throw new Error(`Invalid numeric result for ${expressionLatex}`);
    }
    return result;
}

function checkAlgebraEquality(correctLatex: string, userLatex: string, ): boolean {
    try {
        const normalizedUser = normalizeLatexInput(userLatex);
        const normalizedCorrect = normalizeLatexInput(correctLatex);
        const userExpr = ce.parse(normalizedUser, { syntax: "latex" });
        const correctExpr = ce.parse(normalizedCorrect, { syntax: "latex" });

        const diff = ce.box(["Subtract", userExpr, correctExpr]).simplify().canonical;
        const num = Number(diff.N().valueOf());
        return Math.abs(num) < 0.005;
    } catch (err) {
        console.log("Algebra comparison failed:", err);
        return false;
    }
}

function normalizeLatexInput(input: string): string {
    if (!input) return "";
    let cleaned = input.replace(/\s+/g, "");
    const match = cleaned.match(/^[a-zA-Z0-9_()]+=(.+)$/);
    if (match) {
        return match[1] ?? "";
    }

    return cleaned;
}

function getSCIndex(doc: any, targetId: string, type: string): number | null {
    let result: number | null = null;
    function traverse(node: any) {
        if (!node || result !== null) return;
        if (Array.isArray(node.content)) {
            const choices = node.content.filter(
                (child: any) => child.type === type);
            if (choices.length > 0) {
                const index = choices.findIndex((c: any) => c.attrs?.id === targetId);
                if (index !== -1) {
                    result = index + 1;
                    return;
                }
            }
            node.content.forEach(traverse);
        }
    }
    traverse(doc);
    return result;
}
function getMCIndeces(doc: any, targetIds: string[]): number[] {
    return targetIds
        .map(id => getSCIndex(doc, id, "multipleChoice"))
        .filter((v): v is number => v !== null);
}

function findSharedPoint(points1: any[], points2: any[]) {
    for (const p1 of points1) {
        for (const p2 of points2) {
            if (p1.x === p2.x && p1.y === p2.y) {
                return p1;
            }
        }
    }
    return null;
}

function getOuterPoint(points: any[], sharedPoint: any) {
    return points.find(p => !(p.x === sharedPoint.x && p.y === sharedPoint.y));
}

function calculateSlope(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        if (Math.abs(dx) < 1e-12) {
            return Infinity;
        }

        return dy / dx;
}

function linesArePerpendicular(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, p4: { x: number; y: number }
): boolean {
    const vx1 = p2.x - p1.x;
    const vy1 = p2.y - p1.y;
    const vx2 = p4.x - p3.x;
    const vy2 = p4.y - p3.y;
    const dot = vx1 * vx2 + vy1 * vy2;

    return Math.abs(dot) < 1e-12;
}