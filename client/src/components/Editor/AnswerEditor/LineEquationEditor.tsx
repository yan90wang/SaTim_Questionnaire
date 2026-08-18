import React from "react";
import { Box, Button, FormControl, MenuItem, Select, Typography } from "@mui/material";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { MathInput } from "./MathInput";
import type {Condition} from "./AnswerTypes.tsx";

interface Props {
    label: "m" | "c";
    conditions: Condition[];
    onChange: (next: Condition[]) => void;
}

const operators: Condition["operator"][] = ["=", "<", ">", "<=", ">="];
const logics: ("and" | "or")[] = ["and", "or"];

export const LineEquationEditor: React.FC<Props> = ({label, conditions, onChange
}) => {

    const addCondition = () => {
        onChange([
            ...conditions,
            { operator: "=", value: "", logic: "and" }
        ]);
    };

    const removeCondition = (idx: number) => {
        if (conditions.length <= 1) return;
        onChange(conditions.filter((_, i) => i !== idx));
    };

    const update = (idx: number, patch: Partial<Condition>) => {
        const next = conditions.map((c, i) =>
            i === idx ? { ...c, ...patch } : c
        );
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
                                onChange={e => update(idx, { logic: e.target.value as any })}>
                                {logics.map(l => (
                                    <MenuItem key={l} value={l}>
                                        {l.toUpperCase()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small">
                        <Select
                            value={cond.operator}
                            onChange={e => update(idx, { operator: e.target.value as any })}>
                            {operators.map(op => (
                                <MenuItem key={op} value={op}>{op}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <MathInput value={cond.value ?? ""} variables={['m','c']} onChange={(v) => update(idx, { value: v })}/>
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
