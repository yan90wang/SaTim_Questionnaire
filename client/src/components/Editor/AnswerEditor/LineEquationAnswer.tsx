import React from "react";
import { Box } from "@mui/material";
import { LineEquationEditor} from "./LineEquationEditor.tsx";
import type {Condition} from "./AnswerTypes.tsx";

interface Props {
    conditions: {
        m: Condition[];
        c: Condition[];
    };
    onChange: (next: { m: Condition[]; c: Condition[] }) => void;
}

export const LineEquationAnswer: React.FC<Props> = ({ conditions, onChange }) => {
    return (
        <Box display="flex" gap={6}>
            <LineEquationEditor label="m" conditions={conditions.m} onChange={(nextM) =>
                onChange({ ...conditions, m: nextM })}/>
            <LineEquationEditor label="c" conditions={conditions.c} onChange={(nextC) => onChange({ ...conditions, c: nextC })}/>
        </Box>
    );
};
