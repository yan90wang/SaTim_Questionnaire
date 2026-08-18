import React from "react";
import {Box} from "@mui/material";
import {LineEquationEditor} from "./LineEquationEditor";
import type {LineConditions} from "./AnswerTypes.tsx";

interface Props {
    data: { name: string };
    conditions: LineConditions;
    onChange: (next: LineConditions) => void;
}

export const GeoGebraLineAnswer: React.FC<Props> = ({ data, conditions, onChange }) => {
    return (
        <Box border="1px solid #ccc" p={2} mb={2}>
            <Box fontWeight="bold" mb={2}>{data.name}</Box>
            <Box display="flex" gap={6}>
                <LineEquationEditor
                    label="m"
                    conditions={conditions.m}
                    onChange={(nextM) => onChange({ ...conditions, m: nextM })}
                />
                <LineEquationEditor
                    label="c"
                    conditions={conditions.c}
                    onChange={(nextC) => onChange({ ...conditions, c: nextC })}
                />
            </Box>
        </Box>
    );
};
