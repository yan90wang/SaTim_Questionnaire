import React from "react";
import { Box, Button, FormControl, MenuItem, Select, Typography } from "@mui/material";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { MathInput } from "./MathInput";

export interface Condition {
    operator: "=" | "<" | ">" | "<=" | ">=";
    value: string;
    logic?: "and" | "or";
    latex?: string;
}

interface Props {
    label: "x" | "y";
    conditions: Condition[];
    onChange: (next: Condition[]) => void;
}

const operators: Condition["operator"][] = ["=", "<", ">", "<=", ">="];
const logics: ("and" | "or")[] = ["and", "or"];

export const PointEditor: React.FC<Props> = ({ label, conditions, onChange }) => {

    const addCondition = () => {
        onChange([...conditions, { operator: "=", value: "", logic: "and" }]);
    };

    const removeCondition = (idx: number) => {
        if (conditions.length <= 1) return;
        onChange(conditions.filter((_, i) => i !== idx));
    };

    const updateCondition = (idx: number, patch: Partial<Condition>) => {
        const next = conditions.map((c, i) => i === idx ? { ...c, ...patch } : c);
        onChange(next);
    };

    return (
        <Box>
            <Typography fontWeight="bold">Bedingungen für {label}</Typography>
            {conditions.map((cond, idx) => (
                <Box key={idx} display="flex" gap={1} mb={1} alignItems="center">
                    {idx > 0 && (
                        <FormControl size="small">
                            <Select
                                value={cond.logic || "and"}
                                onChange={e => updateCondition(idx, { logic: e.target.value as "and" | "or" })}>
                                {logics.map(l => <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small">
                        <Select
                            value={cond.operator}
                            onChange={e => updateCondition(idx, { operator: e.target.value as Condition["operator"] })}>
                            {operators.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <MathInput value={cond.value} variables={[]} onChange={(v) => updateCondition(idx, { value: v})} />
                    <Button onClick={() => removeCondition(idx)} disabled={conditions.length === 1}>
                        <RemoveCircleIcon />
                    </Button>
                </Box>
            ))}

            <Button onClick={addCondition} variant="outlined" size="small">
                + Bedingung hinzufügen
            </Button>
        </Box>
    );
};
