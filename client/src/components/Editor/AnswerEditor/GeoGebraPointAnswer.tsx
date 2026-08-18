import React from "react";
import {Box, Typography} from "@mui/material";
import type {PointConditions} from "./AnswerTypes.tsx";
import {PointEditor} from "./PointEditor";

interface Props {
    data: { name: string };
    conditions: PointConditions;
    onChange: (next: PointConditions) => void;
}

export const GeoGebraPointAnswer: React.FC<Props> = ({ data, conditions, onChange }) => {
    return (
        <Box border="1px solid #ccc" p={2} mb={2}>
            <Typography fontWeight="bold">{data.name}</Typography>
            <Box display="flex" gap={2}>
                <PointEditor
                    label="x"
                    conditions={conditions.x}
                    onChange={(nextX) => onChange({ ...conditions, x: nextX })}
                />
                <PointEditor
                    label="y"
                    conditions={conditions.y}
                    onChange={(nextY) => onChange({ ...conditions, y: nextY })}
                />
            </Box>
        </Box>
    );
};
