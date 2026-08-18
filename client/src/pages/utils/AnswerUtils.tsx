import type {JSONContent} from "@tiptap/core";
import {v4 as uuidv4} from "uuid";
import type {GeoGebraAnswer} from "../../components/Editor/Preview.tsx";

export type QuizStatus = 'in bearbeitung' | 'abgeschlossen' | 'gelöscht' | 'lektorat';

export type Choice = { id: string; text: string; html?: string };

export type Answer =
    | { kind: "mc" | "sc"; key: string; value: { id: string; selected: boolean; text?: string}[] }
    | { kind: "freeText" | "freeTextInline" | "numeric"; key: string; value: string }
    | LineEquationAnswer
    | GeoGebraPointsAnswer
    | GeoGebraLinesAnswer
    | GeoGebraSlopeAnswer
    | AlgebraAnswer;

export type LineEquationAnswer = {
    kind: "lineEquation";
    key: string;
    value: string;
};
export type AlgebraAnswer = {
    kind: "algebra";
    key: string;
    value: string;
};
export type GeoGebraPoint = { name: string; x: number; y: number };
export type GeoGebraLine = { name: string; m: number; c: number; point1: GeoGebraPoint; point2: GeoGebraPoint };
export type GeoGebraSlope = { line1: string; point1Line1: GeoGebraPoint; point2Line1: GeoGebraPoint; line2: string; point1Line2: GeoGebraPoint, point2Line2: GeoGebraPoint };

export type GeoGebraPointsAnswer = {
    kind: "geoGebraPoints";
    key: string;
    value: GeoGebraPoint[];
};

export type GeoGebraLinesAnswer = {
    kind: "geoGebraLines";
    key: string;
    value: GeoGebraLine[];
};

export type GeoGebraSlopeAnswer = {
    kind: "geoGebraSlope";
    key: string;
    value: GeoGebraSlope;
};

export type Block =
    | { kind: "mc"; key: string; choices: Choice[] }
    | { kind: "sc"; key: string; choices: Choice[] }
    | { kind: "freeText"; key: string }
    | { kind: "freeTextInline"; key: string }
    | { kind: "numeric"; key: string }
    | { kind: "lineEquation"; key: string }
    | { kind: "geoGebraPoints"; key: string; attrs?: { maxPoints?: number }}
    | { kind: "geoGebraLines"; key: string; attrs?: { maxLines?: number }}
    | {kind: "geoGebraSlope"; key: string;}
    | {kind: "algebra"; key: string};

export const mapQuestionsStatus = (
    status: string | null | undefined
): QuizStatus => {
    switch (status) {
        case "ACTIVE":
            return "in bearbeitung";
        case "FINISHED":
            return "abgeschlossen";
        case "DELETED":
            return "gelöscht";
        case "LECTURE":
            return "lektorat";
        default:
            return "in bearbeitung";
    }
};

/** Recursively extracts plain text from a TipTap JSON node */
export const extractText = (node: any): string => {
    if (!node) return "";
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node.type === "text") return node.text ?? "";
    if (node.content) return node.content.map(extractText).join("");
    return "";
};

/** Render a TipTap node to HTML */
function renderNodeToHTML(node: any): string {
    if (!node) return "";

    switch (node.type) {
        case "text":
            return node.text ?? "";
        case "paragraph":
            return `<p>${(node.content || []).map(renderNodeToHTML).join("")}</p>`;
        case "latex": {
            const latex = node.attrs?.latex ?? "";
            return `<span class="mathjax-latex">\\(${latex}\\)</span>`;
        }
        case "image":
            return `<img src="${node.attrs?.src ?? ""}" alt="" style="max-width:100%;height:auto;" />`;
        case "mcChoice":
        case "singleChoice":
            return (node.content || []).map(renderNodeToHTML).join("");
        default:
            if (node.content && Array.isArray(node.content)) {
                return node.content.map(renderNodeToHTML).join("");
            }
            return "";
    }
}

export function parseContentToBlocks(json: JSONContent): Block[] {
    if (!json || !json.content) return [];
    const blockMap: Record<string, Block> = {};

    const walk = (nodes: any[]) => {
        nodes.forEach((node) => {
            if (!node) return;
            const nodeId = node.attrs?.id || uuidv4();
            if (node.type === "mcChoice" || node.type === "singleChoice") {
                const kind = node.type === "mcChoice" ? "mc" : "sc";
                const groupId = node.attrs?.groupId || nodeId;
                if (!blockMap[groupId]) {
                    blockMap[groupId] = {kind, key: groupId, choices: []};
                }
                (node.content || []).forEach((choiceNode: any) => {
                    const html = renderNodeToHTML(choiceNode);
                    const text = html.replace(/<[^>]+>/g, "").trim();
                    (blockMap[groupId] as any).choices.push({id: nodeId, text, html});
                });
            }
            if (node.type === "freeText") blockMap[nodeId] = {kind: "freeText", key: nodeId};
            if (node.type === "freeTextInline") blockMap[nodeId] = {kind: "freeTextInline", key: nodeId};
            if (node.type === "numericInput") blockMap[nodeId] = {kind: "numeric", key: nodeId};
            if (node.type === "algebra") blockMap[nodeId] = {kind: "algebra", key: nodeId};
            if (node.type === "lineEquation") blockMap[nodeId] = {kind: "lineEquation", key: nodeId};
            if (node.type === "geoGebra") {
                const nodeKey = node.attrs?.id || uuidv4();
                if (node.attrs.variant === "points") {
                    blockMap[nodeKey] = {
                        kind: "geoGebraPoints",
                        key: nodeKey,
                        attrs: node.attrs,
                    };
                }
                if (node.attrs.variant === "lines") {
                    blockMap[nodeKey] = {
                        kind: "geoGebraLines",
                        key: nodeKey,
                        attrs: node.attrs,
                    };
                }
            }
            if (node.type === "geoGebraSlope") {
                const nodeKey = node.attrs?.id || uuidv4();
                    blockMap[nodeKey] = {
                        kind: "geoGebraSlope",
                        key: nodeKey};
            }
            if (node.content) walk(node.content);
        });
    };
    walk(json.content);
    return Object.values(blockMap);
}

export interface TipTapNode {
    type: string;
    attrs?: Record<string, any>;
    content?: TipTapNode[];
    text?: string;
}

export function extractAnswersFromJson(doc: JSONContent, blocks: Block[]): Answer[] {
    const answers: Answer[] = blocks.map((block) => {
        switch (block.kind) {
            case "sc":
            case "mc":
                return {
                    kind: block.kind,
                    key: block.key,
                    value: block.choices.map((choice) => ({id: choice.id, selected: false, choiceText: choice.text})),
                };
            case "freeText":
            case "freeTextInline":
            case "lineEquation":
            case "algebra":
            case "numeric":
                return {kind: block.kind, key: block.key, value: ""};
            case "geoGebraPoints":
               return {
                    kind: "geoGebraPoints",
                    key: block.key,
                    value: [{ name:"",x: 0, y: 0 }]
                };
            case "geoGebraLines":
                return {
                    kind: "geoGebraLines",
                    key: block.key,
                    value: [{ name:"",m: 0, c: 0 , point1: {name:"", x:0, y:0}, point2: {name:"", x:0, y:0}}]
                };
            case "geoGebraSlope":
                return {
                    kind: "geoGebraSlope",
                    key: block.key,
                    value: { line1: "", point1Line1: {name:"", x:0, y:0}, point2Line1:{name:"", x:0, y:0}, line2: "", point1Line2: {name:"", x:0, y:0}, point2Line2: {name:"", x:0, y:0}}
                };
        }
    });

    const walk = (nodes: TipTapNode[]) => {
        for (const node of nodes) {
            if (!node || !node.type) continue;
            const block = blocks.find((b) => b.key === node.attrs?.id || b.key === node.attrs?.groupId);
            if (!block) {
                if (node.content) walk(node.content);
                continue;
            }
            const answer = answers.find((a) => a.key === block.key)!;
            switch (block.kind) {
                case "sc":
                case "mc": {
                    if (answer.kind === "mc" || answer.kind === "sc") {
                        const answerValues = answer.value;
                        const checkboxNodes = document.querySelectorAll<HTMLInputElement>(
                            `div.mc-choice-wrapper input[name="group-${block.key}"]`
                        );
                        checkboxNodes.forEach((input, i) => {
                            if (answerValues[i]) answerValues[i].selected = input.checked;
                        });
                    }
                    break;
                }
                case "freeText":
                case "freeTextInline":
                case "numeric":
                case "algebra":
                case "lineEquation":
                    { const inputEl = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                        `[data-node-view-wrapper] [id="${block.key}"]`);
                        if (inputEl) answer.value = inputEl.value;
                        break;}
                case "geoGebraPoints": {
                    const ggbAnswer = answer as GeoGebraPointsAnswer;
                    const maxPoints = block.attrs?.maxPoints ?? 0;
                    for (let i = 0; i < maxPoints; i++) {
                        const escapeCssId = (id: string) => CSS.escape(id);
                        const xInput = document.querySelector<HTMLInputElement>(`#${escapeCssId(block.key)}-point-${i}-x`);
                        const yInput = document.querySelector<HTMLInputElement>(`#${escapeCssId(block.key)}-point-${i}-y`);
                        if (xInput) ggbAnswer.value[i].x = Number(xInput.value);
                        if (yInput) ggbAnswer.value[i].y = Number(yInput.value);
                    }
                    break;
                }
                case "geoGebraLines": {
                    const ggbAnswer = answer as GeoGebraLinesAnswer;
                    const maxLines = block.attrs?.maxLines ?? 0;
                    for (let i = 0; i < maxLines; i++) {
                        const escapeCssId = (id: string) => CSS.escape(id);
                        const mInput = document.querySelector<HTMLInputElement>(`#${escapeCssId(block.key)}-line-${i}-m`);
                        const cInput = document.querySelector<HTMLInputElement>(`#${escapeCssId(block.key)}-line-${i}-c`);
                        if (mInput) ggbAnswer.value[i].m = Number(mInput.value);
                        if (cInput) ggbAnswer.value[i].c = Number(cInput.value);
                    }
                    break;
                }
            }
            if (node.content) walk(node.content);
        }
    };
    if (doc.content) walk(doc.content as TipTapNode[]);
    return answers;
}

 export function mergeGeoGebraAnswers(extractedAnswers: Answer[], geoGebraAnswers: GeoGebraAnswer[]): Answer[] {
    return extractedAnswers.map(ans => {
        if (ans.kind === "geoGebraPoints") {
            const match = geoGebraAnswers.find(g => g.id === ans.key);
            if (match) {return {...ans, value: match.value,} as GeoGebraPointsAnswer;}
        }
        if (ans.kind === "geoGebraLines") {
            const match = geoGebraAnswers.find(g => g.id === ans.key);
            if (match) {return {...ans, value: match.value,} as GeoGebraLinesAnswer;}
        }
        if (ans.kind === "geoGebraSlope") {
            const match = geoGebraAnswers.find(g => g.id === ans.key);
            if (match) {return {...ans, value: match.value as unknown as GeoGebraSlope,} as GeoGebraSlopeAnswer;}
        }
        return ans;
    });
}
