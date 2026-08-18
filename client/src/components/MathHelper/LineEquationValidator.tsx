import type {BoxedExpression} from "@cortex-js/compute-engine";
import {ce} from "../../main.tsx";

function normalizeLineEquationInput(expr: BoxedExpression, mc: string): { value?: string; error?: string } {
    if (!expr) {
        return { error: "Leerer Ausdruck." };
    }
    try {
        const simplified = expr.simplify();
        const val = simplified.N();
        const symbols = [...simplified.symbols];
        const filtered = symbols.filter(s =>
            !["Pi", "ExponentialE", "ImaginaryUnit"].includes(s)
        );
        if (!val.isReal) {
            if (filtered.some(s => s !== mc)) {
                return {
                    error: `Nur die Variable "${mc}" ist erlaubt.`
                };
            } else {
                if (!evaluatesToReal(simplified, mc)) {
                    return { error: "Ungültiger mathematischer Ausdruck." };
                } else {
                    return {value: "HAS_MC"}
                }
            }
        }
        return {};
    } catch (err) {
        console.log(err);
        return { error: "Ungültiger mathematischer Ausdruck." };
    }
}

function evaluatesToReal(expr: BoxedExpression, variable?: string): boolean {
    try {
        let testExpr = expr;
        if (variable) {
            testExpr = expr.subs({ [variable]: 2 });
        }
        const val = testExpr.N();
        return val.isNumber && Number.isFinite(val.valueOf()) || false;
    } catch {
        return false;
    }
}

function sanitizeMathInput(input: string): string {
    if (!input) return "";
    return input.replace(/:/g, '\\cdot');
}

function normalizePointInput(expr: BoxedExpression): { value?: string; error?: string } {
    if (!expr) {
        return { error: "Leerer Ausdruck." };
    }
    try {
        const simplified = expr.simplify();
        const val = simplified.N();
        if (!val.isReal) {
            return { error: "Ungültiger mathematischer Ausdruck." };
        }
        return {};
    } catch (err) {
        console.log(err);
        return { error: "Ungültiger mathematischer Ausdruck." };
    }
}

export function getInterpretedValue(val: string): { value: string, error: boolean } {
    try {
        val = val.replace(/\\left|\\right/g, "")
        const expr = ce.parse(val);
        const normalized = expr.simplify();
        return {
            value: normalized.canonical.toLatex(),
            error: false
        };
    } catch {
        return { value: "", error: true };
    }
}

export function checkLineEquationHasErrors(val: { m?: { operator: string; value: string }[]; c?: { operator: string; value: string }[]; }) {
    let hasM = false;
    let hasC = false;
    if (val?.m) {
        for (let i = 0; i < val?.m?.length; i++) {
            const mExpr = sanitizeMathInput(val?.m?.[i]?.value ? val?.m?.[i]?.value : "");
            let mResult;
            if (mExpr) {
                const boxedMexpr = ce.parse(mExpr);
                mResult = normalizeLineEquationInput(boxedMexpr, "c");
                if (mResult.error) {
                    return { error: `Steigung m: ${mResult.error}` };
                }
            }
            if (mResult?.value === "HAS_MC") {
                hasC = true;
            }
        }
    }
    if (val?.c) {
        for (let i = 0; i < val?.c?.length; i++) {
            const cExpr = sanitizeMathInput(val?.c?.[i]?.value ? val?.c?.[i]?.value : "");
            let cResult;
            if (cExpr) {
                const boxedCexpr = ce.parse(cExpr);
                cResult = normalizeLineEquationInput(boxedCexpr, "m");
                if (cResult.error) {
                    return { error: `Achsenabschnitt c: ${cResult.error}` };
                }
            }
            if (cResult?.value === "HAS_MC") {
                hasM = true;
            }
        }
    }
    if (hasM && hasC) {
        return { error: `Nur jeweils eine Variable "m" oder "c" erlaubt. Bitte entfernen Sie ein "m" oder "c".` };
    }
    return {};
}

export function checkPointHasErrors(val: { x?: { operator: string; value: string }[]; y?: { operator: string; value: string }[]; }) {
    if (val?.x) {
        for (let i = 0; i < val?.x?.length; i++) {
            const xExpr = sanitizeMathInput(val?.x?.[i]?.value ? val?.x?.[i]?.value : "");
            let xResult;
            if (xExpr) {
                const boxedXexpr = ce.parse(xExpr);
                xResult = normalizePointInput(boxedXexpr);
                if (xResult.error) {
                    return { error: `Punkt x: ${xResult.error}` };
                }
            }
        }
    }
    if (val?.y) {
        for (let i = 0; i < val?.y?.length; i++) {
            const yExpr = sanitizeMathInput(val?.y?.[i]?.value ? val?.y?.[i]?.value : "");
            let yResult;
            if (yExpr) {
                const boxedYexpr = ce.parse(yExpr);
                yResult = normalizePointInput(boxedYexpr);
                if (yResult.error) {
                    return { error: `Punkt y: ${yResult.error}` };
                }
            }
        }
    }
    return {};
}
