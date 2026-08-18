export interface Condition {
    operator: "=" | "<" | ">" | "<=" | ">=";
    value: any;
    logic?: "and" | "or";
    latex?: string;
}

export type PointConditions = {
    x: Condition[];
    y: Condition[];
};

export type LineConditions = {
    m: Condition[];
    c: Condition[];
};
