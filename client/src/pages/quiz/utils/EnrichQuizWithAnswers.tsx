import type {JSONContent} from "@tiptap/core";

type PreviousAnswer = {
    key: string;
    kind: string;
    value: any;
};

export const feedbackQuestions = [
    { key: "q1", text: "War dir klar, was du bei dieser Aufgabe tun solltest?", options: ["Ja, absolut", "Eher ja", "Eher nein", "Nein, gar nicht"] },
    { key: "q2", text: "War die Eingabe der Antwort ohne Schwierigkeiten möglich?", options: ["Ja, absolut", "Eher ja", "Eher nein", "Nein, gar nicht"] },
    { key: "q3", text: "Bist du dir sicher, dass deine Antwort korrekt ist?", options: ["Ja, absolut", "Eher ja", "Eher nein", "Nein, gar nicht"] }
];

export function enrichQuizWithAnswers(content: JSONContent, previousAnswers?: any[]): JSONContent {
    const answerMap = buildFlatAnswerMap(previousAnswers);
    const walk = (node: any): any => {
        const newNode = { ...node };
        const nodeId = node?.attrs?.id
            ? String(node.attrs.id)
            : null;
        if (nodeId) {
            const answerNode = answerMap.get(nodeId);
            if (answerNode) {
                switch (answerNode.kind) {
                    case "numeric":
                    case "freeText":
                    case "freeTextInline":
                    case "algebra":
                    case "lineEquation":
                    case "geoGebraLines":
                    case "geoGebraPoints":
                    case "geoGebraSlope":
                        newNode.attrs = {
                            ...newNode.attrs,
                            value: answerNode.value
                        };
                        break;
                    case "mc":
                    case "sc":
                        newNode.attrs = {
                            ...newNode.attrs,
                            selected: answerNode.value
                        };
                        break;
                }
            }
        }
        if (node.content) {
            newNode.content = node.content.map(walk);
        }
        return newNode;
    };
    return walk(content);
}

function buildFlatAnswerMap(previousAnswers?: PreviousAnswer[]) {
    const map = new Map<string, any>();
    if (!previousAnswers?.length) return map;
    previousAnswers.forEach(answer => {
        const kind = answer.kind;
        switch (kind) {
            case "mc":
            case "sc":
                answer.value?.forEach((choice: any) => {map.set(String(choice.id), {kind, value: choice.selected});});
                break;
            case "numeric":
            case "freetext":
            case "geoGebraPoints":
            case "geoGebraLines":
            case "geoGebraSlope":
            case "lineEquation":
            default:
                map.set(
                    String(answer.key),
                    {
                        kind,
                        value: answer.value
                    }
                );
        }
    });
    return map;
}
