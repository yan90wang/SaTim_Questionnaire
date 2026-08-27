import React, {useEffect, useState} from "react";
import {
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
    TextField,
    Typography,
    Alert,
} from "@mui/material";

import StudentLayout from "../../layouts/StudentLayout";
import {
    getStudentById,
    type Student,
    changeStudentPassword,
} from "../../services/StudentService";

const StudentProfilePage = () => {
    const studentId = Number(localStorage.getItem("studentId"));

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);

    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadStudent = async () => {
            try {
                const data = await getStudentById(studentId);
                setStudent(data);
            } catch (err) {
                console.error("Failed to load student profile:", err);
            } finally {setLoading(false);}
        };
        if (studentId) {
            loadStudent();
        }
    }, [studentId]);

    const handleOpenPasswordDialog = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError(null);
        setPasswordSuccess(null);
        setPasswordDialogOpen(true);
    };

    const handleClosePasswordDialog = () => {
        if (!passwordLoading) {setPasswordDialogOpen(false);}
    };

    const handleChangePassword = async () => {
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError("Bitte füllen Sie alle Felder aus.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Die neuen Passwörter stimmen nicht überein.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
            return;
        }

        try {
            setPasswordLoading(true);
            await changeStudentPassword(oldPassword, newPassword);
            setPasswordSuccess("Passwort wurde erfolgreich geändert.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => {setPasswordDialogOpen(false);}, 1500);

        } catch (err: any) {
            console.error("Failed to change password:", err);
            setPasswordError(err?.response?.data?.message ?? "Passwort konnte nicht geändert werden.");
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <Box display="flex" justifyContent="center" mt={10}>
                    <CircularProgress/>
                </Box>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout>
                <Typography>
                    Profil konnte nicht geladen werden.
                </Typography>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Box sx={{maxWidth: 1000, mx: "auto", py: 3}}>
                <Box mb={3}>
                    <Typography variant="h4">
                        Mein Profil
                    </Typography>

                    <Typography color="text.secondary">
                        Persönliche Daten
                    </Typography>
                </Box>

                <Card>
                    <CardHeader
                        title="Schülerdaten"
                    />

                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        <TextField label="E-Mail" value={student.email ?? "Keine E-Mail hinterlegt"} fullWidth disabled/>

                        <TextField label="Geburtsdatum" value={new Date(student.birthday).toLocaleDateString()} fullWidth disabled/>

                        <Box mt={2}>
                            <Button variant="contained" onClick={handleOpenPasswordDialog}>
                                Passwort ändern
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} fullWidth maxWidth="sm">
                    <DialogTitle>
                        Passwort ändern
                    </DialogTitle>

                    <DialogContent>
                        <Box sx={{display: "flex", flexDirection: "column", gap: 2, mt: 1,}}>
                            {passwordError && (
                                <Alert severity="error">
                                    {passwordError}
                                </Alert>
                            )}

                            {passwordSuccess && (<Alert severity="success">{passwordSuccess}</Alert>)}

                            <TextField label="Altes Passwort" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} fullWidth disabled={passwordLoading}/>
                            <TextField label="Neues Passwort" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth disabled={passwordLoading}/>
                            <TextField label="Neues Passwort wiederholen" type="password" value={confirmPassword} onChange={(e) =>
                                setConfirmPassword(e.target.value)} fullWidth disabled={passwordLoading}/>
                        </Box>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleClosePasswordDialog} disabled={passwordLoading}>Abbrechen
                        </Button>

                        <Button variant="contained" onClick={handleChangePassword} disabled={passwordLoading}>
                            {passwordLoading ? "Speichert..." : "Speichern"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </StudentLayout>
    );
};

export default StudentProfilePage;