import React from "react";
import {Box, Tooltip, Typography} from "@mui/material";
import {MathInput} from "./MathInput.tsx";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface AlgebraAnswerProps {
    onChange: (val: string) => void;
    value: string;
}


export const AlgebraAnswer: React.FC<AlgebraAnswerProps> = ({ onChange, value }) => {
    return (
<Box>
    <Tooltip title="Die Antwort auf die Aufgabe wird auf algebraische Gleichheit mit der hier definierten Lösung überprüft">
        <Typography fontWeight="bold">Eingabe der richtigen Lösung:   <InfoOutlinedIcon fontSize="small" /></Typography>
    </Tooltip>
    <Box display="flex" gap={6}>
        <MathInput variables={['x', 'y', 'z', 'a', 'b', 'c']} onChange={(v) => onChange(v)} value={value}/>
    </Box>
</Box>
    );
};
