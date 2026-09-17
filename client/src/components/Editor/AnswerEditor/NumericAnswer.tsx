import React from "react";
import { Box, Button, MenuItem, Select, TextField, Typography } from "@mui/material";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";

export interface Condition {
    operator: "=" | "<" | ">" | "<=" | ">=";
    value: string;
    logic?: "and" | "or";
}

interface NumericAnswerProps {
    conditions: Condition[];
    onChange: (conditions: Condition[]) => void;
    alternateText?: string;
}

const operators: Condition["operator"][] = ["=", "<", ">", "<=", ">="];
const logics: Condition["logic"][] = ["and", "or"];

export const NumericAnswer: React.FC<NumericAnswerProps> = ({ conditions, onChange, alternateText }) => {
    const handleChange = (index: number, field: keyof Condition, newValue: string) => {
        const next: Condition[] = [...conditions];
        next[index] = { ...next[index], [field]: newValue } as Condition;

        if (next.length > 1 && index === 1) {
            next[0] = { ...next[0], logic: next[1].logic === "or" ? "or" : "and" } as Condition;
        }

        onChange(next);
    };


    const addCondition = () => {
        const next: Condition[] = [
            ...conditions,
            { operator: "=", value: "", logic: "and" } as Condition
        ];

        if (next.length > 1) {
            next[0] = { ...next[0], logic: next[1].logic === "or" ? "or" : "and" } as Condition;
        }
        onChange(next);
    };


    const removeCondition = (index: number) => {
        onChange(conditions.filter((_, i) => i !== index));
    };

    const isValidNumericValue = (value: string): boolean => {
        const numberPattern = /^-?\d+(\.\d+)?$/;
        if (!value.includes("/")) {
            return numberPattern.test(value);
        }
        const parts = value.split("/");
        if (parts.length !== 2) {return false;}
        const [numerator, denominator] = parts;
        if (!numerator || !denominator || !numberPattern.test(numerator) || !numberPattern.test(denominator)) {
            return false;
        }
        return Number(denominator) !== 0;
    };

    return (
        <Box>
            <Typography fontWeight="bold">{alternateText ? alternateText : "Die Antwort ist"}</Typography>
            {conditions.map((cond, idx) => (
                <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                    {idx > 0 && (
                        <Select value={cond.logic || "and"} onChange={(e) => handleChange(idx, "logic", e.target.value)} size="small" sx={{ minWidth: 60 }}>{logics.map((l) => (
                            <MenuItem key={l} value={l}>
                                {l?.toUpperCase()}
                            </MenuItem>))}
                        </Select>
                    )}

                    <Select value={cond.operator} onChange={(e) => handleChange(idx, "operator", e.target.value)} size="small" sx={{ minWidth: 60 }}>
                        {operators.map((op) => (
                            <MenuItem key={op} value={op}>
                                {op}
                            </MenuItem>
                        ))}
                    </Select>

                    <TextField
                        value={cond.value}
                        error={cond.value !== "" && !isValidNumericValue(cond.value)}
                        helperText={
                            cond.value !== "" && !isValidNumericValue(cond.value)
                                ? "Bitte eine gültige Zahl oder einen Bruch eingeben (z.B. 0.5 oder 1/2)."
                                : ""
                        }
                        onChange={e => {
                            let input = e.target.value;
                            input = input.replace(',', '.');
                            input = input.replace(/[^0-9./-]/g, "");

                            if ((input.match(/-/g) || []).length > 1) {
                                input = input.replace(/-/g, '');
                                input = '-' + input;
                            } else if (input.indexOf('-') > 0) {
                                input = input.replace(/-/g, '');
                                input = '-' + input;
                            }

                            const slashParts = input.split("/");
                            if (slashParts.length > 2) {
                                input = slashParts[0] + "/" + slashParts.slice(1).join("");
                            }

                            const limitDecimals = (value: string) => {
                                const parts = value.split(".");
                                if (parts.length > 2) {
                                    return parts[0] + "." + parts.slice(1).join("").slice(0, 5);
                                }
                                if (parts[1]?.length > 5) {
                                    return parts[0] + "." + parts[1].slice(0, 5);
                                }
                                return value;
                            };

                            const normalizeNumber = (value: string) => {
                                let normalized = limitDecimals(value);
                                if (normalized.startsWith(".")) {
                                    normalized = "0" + normalized;
                                }
                                if (normalized.startsWith("-.")) {
                                    normalized = normalized.replace("-.", "-0.");
                                }
                                return normalized;
                            };

                            if (input.includes("/")) {
                                const [numerator = "", denominator = ""] = input.split("/");

                                input =
                                    normalizeNumber(numerator) +
                                    "/" +
                                    normalizeNumber(denominator);
                            } else {
                                input = normalizeNumber(input);
                            }
                            handleChange(idx, "value", input);
                        }}
                        placeholder="0.5 oder 1/2"
                        size="small"
                        variant="outlined"
                        sx={{ width: 120 }}
                    />

                    <Button onClick={() => removeCondition(idx)}>
                        <RemoveCircleIcon/>
                    </Button>
                </Box>
            ))}

            <Button onClick={addCondition} variant="outlined" size="small">
                + Bedingung hinzufügen
            </Button>
            <p></p>
            <Typography variant="caption" color="text.secondary">
                Bedingungen können mit logischem "UND / ODER" verknüpft werden
            </Typography>

        </Box>
    );
};
