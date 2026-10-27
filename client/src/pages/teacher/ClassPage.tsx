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
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {ArrowBack, ContentCopy, Edit} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import TeacherLayout from "../../layouts/TeacherLayout";
import {
    getClass,
    getStudents,
    registerUnder14Student,
    type SchoolClass, updateClass,
} from "../../services/ClassService";
import { SchoolClassType } from "./ClassUtils.tsx";
import { LockReset } from "@mui/icons-material";
import { resetStudentPassword } from "../../services/ClassService";

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
    const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string; } | null>(null);
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newClassType, setNewClassType] = useState("");
    const [savingClass, setSavingClass] = useState(false);
    const [customType, setCustomType] = useState("");
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");
    const [confirmResetOpen, setConfirmResetOpen] = useState(false);
    const [generatedResetPassword, setGeneratedResetPassword] = useState<string | null>(null);
    const [resettingPassword, setResettingPassword] = useState(false);
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
                setStudents(
                    [...studentData].sort((a, b) =>
                        (a.email ?? "").localeCompare(b.email ?? "", "de-CH", {
                            sensitivity: "base",
                        })
                    )
                );
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

    const handleUpdateClass = async () => {
        if (!schoolClass || !newClassName.trim() || !newClassType) return;
        const trimmedName = newClassName.trim();
        if (trimmedName === schoolClass.name && newClassType === schoolClass.type) {
            setEditClassDialogOpen(false);
            return;
        }
        try {
            setSavingClass(true);
            const finalType = newClassType === "CUSTOM" ? customType.trim() : newClassType;
            await updateClass(schoolClass.id, {name: newClassName.trim(), type: finalType,}, isAdminView);
            setSavingClass(true);
            setSchoolClass(prev => prev ? {...prev, name: trimmedName, type: newClassType} : prev);
            setEditClassDialogOpen(false);
            setSnackbar({open: true, message: "Klasse erfolgreich aktualisiert.", severity: "success",});
        } catch (err) {
            console.error(err);
            setSnackbar({open: true, message: err instanceof Error ? err.message : "Klasse konnte nicht aktualisiert werden.", severity: "error",});
        } finally {
            setSavingClass(false);
        }
    };

    const handleResetStudentPassword = async () => {
        if (!schoolClass || selectedStudentId === "") return;
        try {
            setResettingPassword(true);
            const result = await resetStudentPassword(schoolClass.id, selectedStudentId);
            setConfirmResetOpen(false);
            setGeneratedResetPassword(result.password);
        } catch (error) {
            console.error(error);
            setSnackbar({open: true, message: "Passwort konnte nicht zurückgesetzt werden.", severity: "error",});
        } finally {
            setResettingPassword(false);
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
                    <CardHeader title={schoolClass.name}
                                action={
                                    <IconButton
                                        color="primary"
                                        title="Klasse bearbeiten"
                                        onClick={() => {

                                            const isStandardType = Object.values(SchoolClassType)
                                                .some(type => type === schoolClass.type);
                                            setNewClassType(isStandardType ? schoolClass.type : "CUSTOM");
                                            setCustomType(isStandardType ? "" : schoolClass.type);
                                            setNewClassName(schoolClass.name);
                                            setEditClassDialogOpen(true);
                                        }}
                                    >
                                        <Edit/>
                                    </IconButton>
                                }/>
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
                        <Box sx={{display: "flex", gap: 2, mt: 2, flexWrap: "wrap"}}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setUnder14Birthday("");
                                    setGeneratedCredentials(null);
                                    setUnder14DialogOpen(true);
                                }}>
                                Schüler unter 14 registrieren
                            </Button>

                            <Button
                                variant="outlined"
                                startIcon={<LockReset />}
                                disabled={students.length === 0}
                                onClick={() => {
                                    setSelectedStudentId("");
                                    setGeneratedResetPassword(null);
                                    setResetPasswordDialogOpen(true);
                                }}>
                                Schülerpasswort zurücksetzen
                            </Button>
                        </Box>
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
                                                    Benutzername:{" "}{student.email}
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
            <Dialog open={under14DialogOpen}
                    onClose={(_event, reason) => {
                        if (generatedCredentials || registeringUnder14) {
                            return;
                        }
                        if (reason === "backdropClick" || reason === "escapeKeyDown") {
                            setUnder14DialogOpen(false);
                        }
                    }}
                    fullWidth maxWidth="sm">
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
                                Schüler erfolgreich registriert.
                            </Typography>
                            <Typography variant="subtitle1" sx={{mb: 1}}>
                                Bitte speichern Sie die Zugangsdaten und geben Sie diese dem Schüler bzw. der Schülerin weiter. <b>Die Zugangsdaten können später nicht erneut eingesehen werden!
                            </b></Typography>

                            <Typography>
                                Benutzername: {generatedCredentials.email}
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

            <Dialog open={editClassDialogOpen} onClose={() => {if (!savingClass) setEditClassDialogOpen(false);}} fullWidth maxWidth="sm">
                <DialogTitle>Klasse bearbeiten</DialogTitle>

                <DialogContent>
                    <Box sx={{display: "flex", flexDirection: "column", gap: 2, mt: 1}}>
                        <TextField
                            autoFocus
                            fullWidth
                            label="Klassenname"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            disabled={savingClass}
                        />

                        <TextField select fullWidth label="Schultyp" value={newClassType} onChange={(e) => setNewClassType(e.target.value)} disabled={savingClass}>
                            {Object.values(SchoolClassType).map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}

                            <MenuItem value="CUSTOM">
                                Anderer Schultyp
                            </MenuItem>
                        </TextField>

                        {newClassType === "CUSTOM" && (
                            <TextField
                                fullWidth
                                label="Eigener Schultyp"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                disabled={savingClass}
                                required
                            />
                        )}
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setEditClassDialogOpen(false)}
                        disabled={savingClass}>
                        Abbrechen
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleUpdateClass}
                        disabled={!newClassName.trim() || !newClassType || (newClassName.trim() === schoolClass.name && newClassType === schoolClass.type) || savingClass}>
                        {savingClass ? (
                            <>
                                <CircularProgress size={20} color="inherit" sx={{mr: 1}}/>Speichern...
                            </>
                        ) : (
                            "Speichern"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={resetPasswordDialogOpen && !confirmResetOpen && !generatedResetPassword} onClose={() => setResetPasswordDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    Schülerpasswort zurücksetzen
                </DialogTitle>

                <DialogContent>
                    <Typography sx={{mb: 2}}>
                        Wählen Sie den Schüler oder die Schülerin aus,
                        für den bzw. die ein neues Passwort erstellt werden soll.
                    </Typography>

                    <TextField
                        select
                        fullWidth
                        label="Schüler auswählen"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                        sx={{mt: 1}}>
                        {students.map(student => (
                            <MenuItem key={student.id} value={student.id}>
                                {student.email}{" - Geb.:"}{new Date(student.birthday).toLocaleDateString()}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialogOpen(false)}>
                        Abbrechen
                    </Button>
                    <Button variant="contained" disabled={selectedStudentId === ""} onClick={() => setConfirmResetOpen(true)}>
                        Weiter
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={confirmResetOpen}
                onClose={(_event, reason) => {
                    if (resettingPassword) return;
                    if (reason === "backdropClick") return;
                    setConfirmResetOpen(false);
                }}
                fullWidth
                maxWidth="sm">
                <DialogTitle>
                    Passwort wirklich zurücksetzen?
                </DialogTitle>

                <DialogContent>
                    <Alert severity="warning" sx={{mb: 2}}>
                        Das bisherige Passwort wird dauerhaft überschrieben.
                        Der Schüler kann sich danach nur noch mit dem neuen
                        Passwort anmelden.
                    </Alert>
                    <Typography>
                        Möchten Sie das Passwort für{" "}
                        <strong>
                            {students.find(s => s.id === selectedStudentId)?.email ?? `Schüler ${selectedStudentId}`}
                        </strong>{" "}
                        wirklich zurücksetzen?
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button disabled={resettingPassword} onClick={() => setConfirmResetOpen(false)}>
                        Abbrechen
                    </Button>
                    <Button
                        color="warning"
                        variant="contained"
                        disabled={resettingPassword}
                        onClick={handleResetStudentPassword}
                        startIcon={
                            resettingPassword
                                ? <CircularProgress size={18} color="inherit"/>
                                : <LockReset/>
                        }>
                        {resettingPassword ? "Wird zurückgesetzt..." : "Passwort zurücksetzen"}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={generatedResetPassword !== null} disableEscapeKeyDown onClose={() => {}} fullWidth maxWidth="sm">
                <DialogTitle>
                    Neues Passwort erstellt
                </DialogTitle>

                <DialogContent>
                    <Alert severity="success" sx={{mb: 3}}>
                        Das Passwort wurde erfolgreich zurückgesetzt.
                        Bitte speichern Sie das neue Passwort und geben
                        Sie es dem Schüler bzw. der Schülerin weiter.
                        <strong> Das Passwort kann später nicht erneut angezeigt werden.</strong>
                    </Alert>
                    <TextField
                        fullWidth
                        label="Neues Passwort"
                        value={generatedResetPassword ?? ""}
                        slotProps={{
                            input: {
                                readOnly: true,
                            },
                        }}
                        sx={{mb: 2}}/>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopy />}
                        onClick={async () => {
                            if (!generatedResetPassword) return;
                            try {
                                await navigator.clipboard.writeText(generatedResetPassword);
                                setSnackbar({open: true, message: "Passwort kopiert.", severity: "success",});
                            } catch {
                                setSnackbar({open: true, message: "Passwort konnte nicht kopiert werden.", severity: "error",});
                            }
                        }}>
                        Passwort kopieren
                    </Button>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setGeneratedResetPassword(null);
                            setResetPasswordDialogOpen(false);
                            setConfirmResetOpen(false);
                            setSelectedStudentId("");
                        }}>
                        Schliessen
                    </Button>
                </DialogActions>
            </Dialog>
        </TeacherLayout>
    );
};

export default ClassPage;