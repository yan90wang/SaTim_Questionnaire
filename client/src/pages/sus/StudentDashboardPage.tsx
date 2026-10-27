import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Snackbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../layouts/StudentLayout";
import { getAssignedTests, type StudentTest } from "../../services/StudentService";

const StudentDashboardPage = () => {
    const navigate = useNavigate();
    const userId = localStorage.getItem("studentId");
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<StudentTest[]>([]);
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await getAssignedTests();
                setTests(data);
            } catch (err) {
                console.error(err);
                setSnackbar({open: true, message: "Tests konnten nicht geladen werden.", severity: "error",});
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleFeedbackClick = (feedbackUrl: string) => {
        if (!userId) return;
        const finalUrl = feedbackUrl.replaceAll("${userId}", encodeURIComponent(userId));
        try {
            const parsedUrl = new URL(finalUrl);
            if (!["https:", "http:"].includes(parsedUrl.protocol)) {throw new Error("Invalid URL protocol");}
            window.open(parsedUrl.href, "_blank", "noopener,noreferrer");
        } catch {
            setSnackbar({
                open: true,
                message: "Die Feedback-URL ist ungültig.",
                severity: "error",
            });
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <Box display="flex" justifyContent="center" mt={10}>
                    <CircularProgress />
                </Box>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Box sx={{ maxWidth: 1000, mx: "auto", py: 3 }}>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false,})}>
                    <Alert severity={snackbar.severity} variant="filled">
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                <Card>
                    <CardHeader title="Meine Tests" />
                    <CardContent>
                        {tests.length === 0 ? (
                            <Typography color="text.secondary">
                                Zurzeit sind keine Tests zugewiesen.
                            </Typography>
                        ) : (
                            <Box display="flex" flexDirection="column" gap={2}>
                                {tests.map((test) => (
                                    <Card key={test.id} variant="outlined">
                                        <CardContent sx={{display: "flex", justifyContent: "space-between", alignItems: "center",}}>
                                            <Box>
                                                <Typography variant="h6">
                                                    {test.title}
                                                </Typography>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary">
                                                    Gültig bis{" "}
                                                    {new Date(test.validTo).toLocaleDateString()}
                                                </Typography>
                                                <Chip
                                                    label={test.status === "OPEN" ? "Offen" : test.status === "IN_PROGRESS" ? "In Bearbeitung" : "Abgeschlossen"}
                                                    color={test.status === "OPEN" ? "info" : test.status === "IN_PROGRESS" ? "warning" : "default"}
                                                />
                                            </Box>

                                            <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                                                <Tooltip title={(!test.canModify && test.mode !== "ADAPTIV" )? "Die Bearbeitungszeit ist abgelaufen. Der Test kann nicht mehr geändert werden." : ""} arrow>
                                                    <span style={{ display: "inline-flex" }}><Button variant="contained" sx={{ width: 200 }} disabled={(!test.canModify && test.mode !== "ADAPTIV" )} onClick={() => navigate(`/quiz/${test.instanceId}`)}>
                                                    {"Test bearbeiten"}
                                                    </Button> </span></Tooltip>
                                                {test.status === "FINISHED" && !!test.feedbackSurveyUrl?.trim() && (
                                                    <Button variant="contained" sx={{ width: 200}}
                                                            onClick={() => handleFeedbackClick(test.feedbackSurveyUrl!)}>
                                                        Feedback geben
                                                    </Button>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                    </CardContent>
                </Card>

            </Box>
        </StudentLayout>
    );
};

export default StudentDashboardPage;