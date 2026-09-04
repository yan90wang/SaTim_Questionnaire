import React, {useEffect, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {ArrowBack, ContentCopy} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";

import TeacherLayout from "../../layouts/TeacherLayout";
import {
    getClass,
    getStudents,
    registerUnder14Student,
    type SchoolClass,
} from "../../services/ClassService";

interface Student {
    id: number;
    first_name: string;
    last_name: string;
    birthday: string;
    email?: string;
}

const ClassPage = () => {
    const {id, teacherId} = useParams();
    const isAdminView = !!teacherId;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [loadingSuS, setLoadingSuS] = useState(true);
    const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [under14DialogOpen, setUnder14DialogOpen] = useState(false);
    const [under14Birthday, setUnder14Birthday] = useState("");
    const [registeringUnder14, setRegisteringUnder14] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState<{
        email: string;
        password: string;
    } | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const getAge = (birthday: string): number | null => {
        if (!birthday) return null;
        const birthDate = new Date(`${birthday}T00:00:00`);
        const today = new Date();
        if (isNaN(birthDate.getTime())) {
            return null;
        }
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }
        return age;
    };
    const under14Age = getAge(under14Birthday);
    const under14AgeInvalid = under14Age !== null && under14Age >= 14;

    useEffect(() => {
        const load = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const classData = await getClass(Number(id), teacherId, isAdminView);
                setSchoolClass(classData);
            } catch (err) {
                console.error(err);
                setSnackbar({
                    open: true, message: "Klasse konnte nicht geladen werden.", severity: "error",
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, teacherId]);


    useEffect(() => {
        const loadSuS = async () => {
            if (!id) return;
            try {
                setLoadingSuS(true);
                const studentData = await getStudents(Number(id), teacherId, isAdminView);
                setStudents(studentData);
            } catch (err) {
                console.error(err);
                setSnackbar({
                    open: true, message: "SuS konnten nicht geladen werden.", severity: "error",
                });
            } finally {
                setLoadingSuS(false);
            }
        };
        loadSuS();
    }, [id, teacherId]);

    const handleRegisterUnder14 = async () => {
        if (!schoolClass) return;

        if (!under14Birthday) {
            setSnackbar({open: true, message: "Bitte geben Sie das Geburtsdatum ein.", severity: "error",});
            return;
        }

        try {
            setRegisteringUnder14(true);
            const result = await registerUnder14Student(schoolClass.id, under14Birthday, teacherId, isAdminView);
            setGeneratedCredentials({email: result.email, password: result.password,});
            const updatedStudents = await getStudents(schoolClass.id, teacherId, isAdminView);
            setStudents(updatedStudents);
            setSnackbar({open: true, message: "Schüler erfolgreich registriert.", severity: "success",});
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: err instanceof Error ? err.message : "Schüler konnte nicht registriert werden.",
                severity: "error",
            });
        } finally {
            setRegisteringUnder14(false);
        }
    };

    if (loading || loadingSuS) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
                <Box display="flex" justifyContent="center" mt={10}>
                    <CircularProgress/>
                </Box>
            </TeacherLayout>
        );
    }

    if (!schoolClass) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
                <Typography>Klasse nicht gefunden.</Typography>
            </TeacherLayout>
        );
    }

    const registrationLink =
        `${window.location.origin}/student/register/${schoolClass.registrationToken}`;

    return (
        <TeacherLayout adminView={isAdminView} teacherId={teacherId}>
            <Box sx={{maxWidth: 1000, mx: "auto", py: 3}}>

                <Snackbar open={snackbar.open} autoHideDuration={4000}
                          onClose={() => setSnackbar({...snackbar, open: false,})}>
                    <Alert severity={snackbar.severity} variant="filled"
                           onClose={() => setSnackbar({...snackbar, open: false,})}>{snackbar.message}</Alert>
                </Snackbar>

                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => {
                        if (isAdminView && teacherId) {
                            navigate(`/admin/teacher/${teacherId}/classes`);
                        } else {
                            navigate("/teacher/classes");
                        }
                    }}
                    sx={{ mb: 2 }}>
                    Zurück
                </Button>

                <Card sx={{mb: 3}}>
                    <CardHeader title={schoolClass.name}/>
                    <CardContent>

                        <Typography variant="body1">
                            <strong>Typ:</strong> {schoolClass.type}
                        </Typography>

                        <Typography variant="body1">
                            <strong>Schüler:</strong> {students.length}
                        </Typography>

                    </CardContent>
                </Card>

                <Card sx={{mb: 3}}>
                    <CardHeader title="Registrierungslink"/>
                    <CardContent>
                        <Typography color="text.secondary" mb={2}>
                            Teilen Sie diesen Link mit Ihren Schülerinnen und Schülern.
                        </Typography>

                        <Box display="flex" gap={2}>
                            <TextField fullWidth value={registrationLink} slotProps={{
                                input: {
                                    readOnly: true,
                                },
                            }}/>
                            <IconButton
                                onClick={() => {
                                    navigator.clipboard.writeText(registrationLink);
                                    setSnackbar({
                                        open: true,
                                        message: "Registrierungslink kopiert.",
                                        severity: "success",
                                    });
                                }}>
                                <ContentCopy/>
                            </IconButton>
                        </Box>
                        <Button
                            variant="outlined"
                            sx={{mt: 2}}
                            onClick={() => {
                                setUnder14Birthday("");
                                setGeneratedCredentials(null);
                                setUnder14DialogOpen(true);
                            }}>
                            Schüler unter 14 registrieren
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title={`Schüler (${students.length})`}/>
                    <CardContent>
                        {students.length === 0 ? (
                            <Typography color="text.secondary">
                                Noch keine Schülerinnen oder Schüler registriert.
                            </Typography>) : (
                            <Box display="flex" flexDirection="column" gap={2}>
                                {students.map((student) => (
                                    <Card key={student.id} variant="outlined">
                                        <CardContent>

                                            <Typography variant="h6">
                                                {student.first_name}{" "}
                                                {student.last_name}
                                            </Typography>

                                            <Typography color="text.secondary">
                                                Geburtstag:{" "}
                                                {new Date(student.birthday).toLocaleDateString()}
                                            </Typography>

                                            {student.email && (
                                                <Typography color="text.secondary">
                                                    {student.email}
                                                </Typography>
                                            )}

                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>
            <Dialog open={under14DialogOpen} onClose={() => {
                if (!registeringUnder14) {
                    setUnder14DialogOpen(false);
                }
            }} fullWidth maxWidth="sm">
                <DialogTitle>
                    Schüler unter 14 registrieren
                </DialogTitle>
                <DialogContent>
                    {!generatedCredentials ? (
                        <>
                            <Typography sx={{mb: 2}}>
                                Bitte geben Sie das Geburtsdatum des Schülers ein. Das System generiert anschliessend
                                die Zugangsdaten, die Sie dem Schüler bzw. der Schülerin weitergeben können.
                            </Typography>

                            <TextField
                                fullWidth
                                label="Geburtsdatum"
                                type="date"
                                value={under14Birthday}
                                onChange={(event) =>
                                    setUnder14Birthday(event.target.value)
                                }
                                error={under14AgeInvalid}
                                helperText={
                                    under14AgeInvalid
                                        ? "Der Schüler bzw. die Schülerin muss unter 14 Jahre alt sein."
                                        : under14Age !== null
                                            ? `Alter: ${under14Age} Jahre`
                                            : ""
                                }
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </>
                    ) : (
                        <Alert severity="success">
                            <Typography variant="subtitle1" fontWeight="bold" sx={{mb: 1}}>
                                Schüler erfolgreich registriert
                            </Typography>

                            <Typography>
                                E-Mail: {generatedCredentials.email}
                            </Typography>

                            <Typography>
                                Passwort: {generatedCredentials.password}
                            </Typography>

                            <Button
                                size="small"
                                sx={{mt: 1}}
                                startIcon={<ContentCopy/>}
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        `E-Mail: ${generatedCredentials.email}\n` +
                                        `Passwort: ${generatedCredentials.password}`
                                    );
                                    setSnackbar({open: true, message: "Zugangsdaten kopiert.", severity: "success",});
                                }}>
                                Zugangsdaten kopieren
                            </Button>
                        </Alert>
                    )}
                </DialogContent>

                <DialogActions>
                    {!generatedCredentials ? (
                        <>
                            <Button onClick={() => setUnder14DialogOpen(false)} disabled={registeringUnder14}>
                                Abbrechen
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleRegisterUnder14}
                                disabled={
                                    !under14Birthday ||
                                    under14AgeInvalid ||
                                    registeringUnder14
                                }>
                                {registeringUnder14 ? (
                                    <>
                                        <CircularProgress size={20} sx={{mr: 1}}/>
                                        Registrieren...
                                    </>
                                ) : (
                                    "Registrieren"
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => {
                                setUnder14DialogOpen(false);
                                setGeneratedCredentials(null);
                                setUnder14Birthday("");
                            }}>
                            Schliessen
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </TeacherLayout>
    );
};

export default ClassPage;