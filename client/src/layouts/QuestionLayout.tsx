import React from "react";
import {Alert, Box, Step, StepLabel, Stepper} from "@mui/material";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import MainLayout from "./MainLayout";
import type {Question} from "../services/EditorService.tsx";

const steps = [
    { label: "Metadaten", path: "/meta" },
    { label: "Aufgabe", path: "/editor" },
    { label: "Antworten", path: "/answers" },
    { label: "Abschliessen", path: "/preview" },
];

interface QuestionLayoutProps {
    children: React.ReactNode;
    question?: Question;
}

export default function QuestionLayout({children, question}: QuestionLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const getAllowedSteps = (question?: Question): boolean[] => {
        if (!question) return [true, false, false, false];
        const hasMetadata = Array.isArray(question.metadata) && question.metadata.length > 0;
        const hasContent = question.contentJson && typeof question.contentJson === "object" && Object.keys(question.contentJson as object).length > 0;
        const hasCorrectAnswers = !!question.correctAnswers && Object.keys(question.correctAnswers).length > 0;
        return [
            true,
            hasMetadata,
            hasMetadata && hasContent,
            hasMetadata && hasContent && hasCorrectAnswers
        ];
    };
    const enabledSteps = getAllowedSteps(question);
    const activeStep = steps.findIndex((s) => location.pathname.startsWith(s.path));
    const handleStepClick = (path: string, enabled: boolean) => {
        if (!enabled) return;
        if (id) navigate(`${path}/${id}`);
        else navigate(path);
    };

    return (
        <MainLayout>
            <Box sx={{minHeight: "100vh", backgroundColor: "background.default", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6,}}>
                <Box sx={{ mb: 4 }}>
                    {question && !question.isEditable && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Diese Frage kann nicht mehr bearbeitet werden,
                            da sie bereits in einem Booklet verwendet wird und abgeschlossen ist.
                        </Alert>
                    )}
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((step, index) => {
                            return (
                                <Step
                                    key={step.label}
                                    active={activeStep === index}
                                    completed={enabledSteps[index] && index !== activeStep}
                                    disabled={!enabledSteps[index]}
                                    onClick={() => handleStepClick(step.path, enabledSteps[index])}
                                    sx={{
                                        cursor: enabledSteps[index] ? "pointer" : "not-allowed",
                                        "& .MuiStepLabel-label": {
                                            color: enabledSteps[index]
                                                ? "primary.main"
                                                : "text.disabled",
                                        },
                                        "& .MuiStepIcon-root": {
                                            color: enabledSteps[index]
                                                ? "primary.main"
                                                : undefined,
                                        },
                                        "& .MuiStepIcon-root.Mui-completed": {
                                            color: "primary.main",
                                        },
                                        "& .MuiStepIcon-root.Mui-active": {
                                            color: "info.main",
                                        },
                                    }}>
                                    <StepLabel>{step.label}</StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>
                </Box>

                <Box sx={{ flexGrow: 1 }}>{children}</Box>
            </Box>
        </MainLayout>
    );
}
