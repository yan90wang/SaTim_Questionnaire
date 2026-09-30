import React, {useEffect, useState} from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Snackbar,
    Typography,
} from "@mui/material";
import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";
import {useParams} from "react-router-dom";
import TeacherLayout from "../../layouts/TeacherLayout";
import {getTestDetails, type TestDetails} from "../../services/TestService.tsx";

const TestDetailsPage = () => {
    const [details, setDetails] = useState<TestDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    const {testId, teacherId} = useParams();
    const isAdminView = !!teacherId;

    useEffect(() => {
        const load = async () => {
            if (!testId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await getTestDetails(Number(testId), teacherId, isAdminView);
                console.log(data)
                setDetails(data);
            } catch (err) {
                console.error(err);
                setSnackbar({
                    open: true,
                    message: "Testdetails konnten nicht geladen werden.",
                    severity: "error",
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [testId, teacherId, isAdminView]);

    if (loading) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
                <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400,}}>
                    <CircularProgress/>
                </Box>
            </TeacherLayout>
        );
    }

    if (!details) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
                <Box
                    sx={{maxWidth: 1100, mx: "auto", py: 4,}}>
                    <Alert severity="error">
                        Testdetails konnten nicht geladen werden.
                    </Alert>
                </Box>
            </TeacherLayout>
        );
    }

    const finishedStudents = details.students.filter((student) => student.finished).length;

    return (
        <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
            <Box sx={{maxWidth: 1100, mx: "auto", py: 4,}}>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({...snackbar, open: false,})}>
                    <Alert severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Header */}
                <Box mb={4}>
                    <Typography
                        variant="h4"
                        fontWeight={600}>
                        {details.title}
                    </Typography>

                    <Typography color="text.secondary" mt={1}>
                        Ergebnisse der Klasse {details.className}
                    </Typography>

                    {details.description && (
                        <Typography color="text.secondary" mt={0.5}>
                            {details.description}
                        </Typography>
                    )}
                </Box>

                {/* Summary */}
                <Card sx={{mb: 4}}>
                    <CardHeader title="Übersicht"/>
                    <CardContent sx={{pt: 0}}>
                        <Box sx={{display: "flex", gap: 4, flexWrap: "wrap",}}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Klasse
                                </Typography>

                                <Typography fontWeight={600}>
                                    {details.className}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Testmodus
                                </Typography>

                                <Chip size="small" label={details.mode === "DESIGN" ? "Design Matrix" : "Adaptiv"}/>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Abgeschlossen
                                </Typography>

                                <Typography fontWeight={600}>
                                    {finishedStudents} / {details.students.length}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Student results */}
                <Card sx={{mb: 4}}>
                    <CardHeader
                        title="Ergebnisse"
                        subheader={`${details.students.length} Schüler`}
                    />

                    <CardContent sx={{pt: 0}}>
                        {details.students.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" py={3}>
                                Keine Ergebnisse vorhanden.
                            </Typography>
                        ) : (
                            <Box sx={{width: "100%", overflowX: "auto",}}>
                                <Box component="table"
                                    sx={{width: "100%", borderCollapse: "collapse",}}>
                                    <Box
                                        component="thead"
                                        sx={{borderBottom: "1px solid", borderColor: "divider",}}>
                                        <Box component="tr">
                                            <Box
                                                component="th"
                                                sx={{textAlign: "left", p: 1.5,}}>
                                                Schüler
                                            </Box>

                                            <Box
                                                component="th"
                                                sx={{textAlign: "left", p: 1.5,}}>
                                                Ergebnis
                                            </Box>

                                            <Box
                                                component="th"
                                                sx={{textAlign: "right", p: 1.5,}}>
                                                Status
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box component="tbody">
                                        {details.students.map((student) => (
                                            <Box
                                                component="tr"
                                                key={student.studentId}
                                                sx={{
                                                    borderBottom: "1px solid",
                                                    borderColor: "divider",
                                                    "&:last-child": {
                                                        borderBottom: "none",
                                                    },
                                                }}>
                                                <Box component="td" sx={{p: 1.5}}>
                                                    <Typography fontWeight={500}>
                                                        {student.studentLogin}
                                                    </Typography>
                                                </Box>

                                                <Box component="td" sx={{p: 1.5}}>
                                                    <Typography fontWeight={500}>
                                                        {student.correctAnswers} /{" "}
                                                        {student.totalQuestions}{" "}<br></br>
                                                        Aufgaben richtig
                                                    </Typography>
                                                </Box>

                                                <Box component="td" sx={{p: 1.5, textAlign: "right",}}>
                                                    <Chip
                                                        size="small"
                                                        label={student.finished ? "Abgeschlossen" : "Nicht abgeschlossen"}
                                                        color={student.finished ? "success" : "default"}
                                                    />
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                {/* DESIGN question chart */}
                {details.mode === "DESIGN" &&
                    details.questionResults.length > 0 && (
                        <Card>
                            <CardHeader
                                title="Aufgabenauswertung"
                                subheader="Anzahl der korrekt gelösten Aufgaben"
                            />

                            <CardContent>
                                <Box sx={{width: "100%", height: 400,}}>
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%">
                                        <BarChart
                                            data={details.questionResults}
                                            margin={{top: 10, right: 20, left: 10, bottom: 20,}}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>

                                            <XAxis
                                                dataKey="questionId"
                                                label={{
                                                    value: "Quiz Task ID",
                                                    position: "insideBottom",
                                                    offset: -10,
                                                }}
                                            />

                                            <YAxis
                                                allowDecimals={false}
                                                domain={[
                                                    0,
                                                    details.students.length,
                                                ]}
                                                label={{
                                                    value:
                                                        "Anzahl korrekt gelöst",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                }}
                                            />

                                            <Tooltip
                                                formatter={(value) => [
                                                    `${value} Schüler`,
                                                    "Korrekt gelöst",
                                                ]}
                                                labelFormatter={(questionId) =>
                                                    `Aufgabe ${questionId}`
                                                }
                                            />

                                            <Bar
                                                dataKey="correctCount"
                                                name="Korrekt gelöst"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
            </Box>
        </TeacherLayout>
    );
};

export default TestDetailsPage;