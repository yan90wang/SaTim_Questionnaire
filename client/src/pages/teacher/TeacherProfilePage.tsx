import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import TeacherLayout from "../../layouts/TeacherLayout.tsx";
import {changeTeacherPassword, getTeacherById, type Teacher, updateTeacher} from "../../services/TeacherService.tsx";
import { SWISS_CANTONS } from "./ClassUtils.tsx";
import {useParams} from "react-router-dom";

const TeacherProfilePage = () => {
    const {teacherId: routeTeacherId} = useParams();
    const isAdminView = !!routeTeacherId;
    const teacherId = routeTeacherId ? Number(routeTeacherId) : Number(localStorage.getItem("teacherId"));
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [teacher, setTeacher] = useState<Teacher>({
        id: 0,
        first_name: "",
        last_name: "",
        email: "",
        school_name: "",
        school_address: "",
        canton: ""
    });
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!teacherId) return;
        const fetchTeacher = async () => {
            setIsLoading(true);
            try {
                const data = await getTeacherById(teacherId);
                setTeacher(data);
            } catch (err) {
                console.error("Failed to fetch teacher:", err);
                setSnackbar({
                    open: true,
                    message: "Profil konnte nicht geladen werden.",
                    severity: "error",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeacher();
    }, [teacherId]);

    const handleChange = (
        field:
            | "first_name"
            | "last_name"
            | "email"
            | "school_name"
            | "school_address"
            | "canton",
        value: string
    ) => {
        setTeacher((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleOpenPasswordDialog = () => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError(null);
        setPasswordSuccess(null);
        setPasswordDialogOpen(true);
    };

    const handleClosePasswordDialog = () => {
        if (!passwordLoading) {
            setPasswordDialogOpen(false);
        }
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
        if (newPassword.length < 8) {
            setPasswordError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
            return;
        }
        if (oldPassword === newPassword) {
            setPasswordError("Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.");
            return;
        }
        try {
            setPasswordLoading(true);
            await changeTeacherPassword(oldPassword, newPassword);
            setPasswordSuccess("Passwort wurde erfolgreich geändert.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("Failed to change teacher password:", err);
            setPasswordError(err?.response?.data?.message ?? err?.message ?? "Passwort konnte nicht geändert werden.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSave = async () => {
        if (!teacherId) return;
        if (!teacher.first_name.trim()) {
            setSnackbar({open: true, message: "Bitte geben Sie einen Vornamen ein.", severity: "error",});
            return;
        }

        if (!teacher.last_name.trim()) {
            setSnackbar({open: true, message: "Bitte geben Sie einen Nachnamen ein.", severity: "error",});
            return;
        }

        if (!teacher.school_name.trim()) {
            setSnackbar({open: true, message: "Bitte geben Sie eine Schule ein.", severity: "error",});
            return;
        }

        if (!teacher.school_address.trim()) {
            setSnackbar({open: true, message: "Bitte geben Sie eine Schuladresse ein.", severity: "error",});
            return;
        }

        if (!teacher.canton) {
            setSnackbar({open: true, message: "Bitte wählen Sie einen Kanton aus.", severity: "error",});
            return;
        }
        setIsLoading(true);

        try {
            const updatedTeacher = await updateTeacher(
                teacherId,
                {
                    first_name: teacher.first_name.trim(),
                    last_name: teacher.last_name.trim(),
                    email: teacher.email,
                    school_name: teacher.school_name.trim(),
                    school_address: teacher.school_address.trim(),
                    canton: teacher.canton,
                }
            );
            setTeacher(updatedTeacher);
            setSnackbar({open: true, message: "Änderungen wurden erfolgreich gespeichert.", severity: "success",});
        } catch (err) {
            console.error("Failed to update teacher:", err);
            setSnackbar({open: true, message: "Änderungen konnten nicht gespeichert werden.", severity: "error",});
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={routeTeacherId}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout adminView={isAdminView} teacherId={routeTeacherId}>
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">
                            Mein Profil
                        </Typography>

                        <Typography color="text.secondary">
                            Persönliche Daten
                        </Typography>
                    </Box>
                </Box>

                <Card>
                    <CardHeader title="Lehrperson" />
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        <TextField
                            label="Vorname"
                            value={teacher.first_name}
                            fullWidth
                            required
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "first_name",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="Nachname"
                            value={teacher.last_name}
                            fullWidth
                            required
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "last_name",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="E-Mail"
                            type="email"
                            value={teacher.email}
                            fullWidth
                            required
                            disabled={true}
                            onChange={(e) =>
                                handleChange(
                                    "email",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="Schule"
                            value={teacher.school_name}
                            fullWidth
                            required
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange("school_name", e.target.value)
                            }
                        />

                        <TextField
                            label="Schuladresse"
                            value={teacher.school_address}
                            fullWidth
                            required
                            multiline
                            rows={2}
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "school_address",
                                    e.target.value
                                )
                            }
                        />

                        <FormControl fullWidth required disabled={isLoading}>
                            <InputLabel id="teacher-canton-label">
                                Kanton
                            </InputLabel>

                            <Select
                                labelId="teacher-canton-label"
                                value={teacher.canton ?? ""}
                                label="Kanton"
                                onChange={(e) => handleChange("canton", e.target.value)}>
                                {SWISS_CANTONS.map((canton) => (
                                    <MenuItem key={canton.value} value={canton.value}>
                                        {canton.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isLoading}
                            sx={{alignSelf: "flex-start"}}>
                            Änderungen speichern
                        </Button>
                        {!isAdminView && (
                            <Button
                                variant="outlined"
                                onClick={handleOpenPasswordDialog}
                                disabled={isLoading}
                                sx={{ alignSelf: "flex-start" }}>
                                Passwort ändern
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </Box>
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
                        {passwordSuccess && (
                            <Alert severity="success">
                                {passwordSuccess}
                            </Alert>
                        )}
                        <TextField
                            label="Altes Passwort"
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            fullWidth
                            disabled={passwordLoading}
                            autoComplete="current-password"
                        />
                        <TextField
                            label="Neues Passwort"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            fullWidth
                            disabled={passwordLoading}
                            autoComplete="new-password"
                        />
                        <TextField
                            label="Neues Passwort wiederholen"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            fullWidth
                            disabled={passwordLoading}
                            autoComplete="new-password"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, mt: 2}}>
                    <Button onClick={handleClosePasswordDialog} disabled={passwordLoading}>
                        Schliessen
                    </Button>
                    <Button variant="contained" onClick={handleChangePassword} disabled={passwordLoading || !!passwordSuccess}>
                        {passwordLoading ? "Speichert..." : "Speichern"}
                    </Button></Box>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                onClose={() =>
                    setSnackbar((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }>
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() =>
                        setSnackbar((prev) => ({
                            ...prev,
                            open: false,
                        }))
                    }>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </TeacherLayout>
    );
};

export default TeacherProfilePage;