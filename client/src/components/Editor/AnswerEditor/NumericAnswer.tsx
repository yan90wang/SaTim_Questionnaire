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
                        onChange={e => {
                            let input = e.target.value;
                            input = input.replace(',', '.');
                            input = input.replace(/[^0-9.-]/g, '');
                            if ((input.match(/-/g) || []).length > 1) {
                                input = input.replace(/-/g, '');
                                input = '-' + input;
                            } else if (input.indexOf('-') > 0) {
                                input = input.replace(/-/g, '');
                                input = '-' + input;
                            }
                            const parts = input.split('.');
                            if (parts.length > 2) {
                                input = parts[0] + '.' + parts.slice(1).join('');
                            }
                            if (parts[1]?.length > 5) {
                                input = parts[0] + '.' + parts[1].slice(0, 5);
                            }
                            handleChange(idx, "value", input);
                        }}
                        placeholder="Zahl eingeben"
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
