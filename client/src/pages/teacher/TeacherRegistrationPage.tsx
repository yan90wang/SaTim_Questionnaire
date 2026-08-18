import React, {useState} from "react";
import {Alert, Box, Button, Card, CardContent, CircularProgress, Snackbar, TextField, Typography,} from "@mui/material";
import {registerTeacher} from "../../services/TeacherService.tsx";
import GeneralLayout from "../../layouts/GeneralLayout.tsx";
import {useNavigate, useParams} from "react-router-dom";

const TeacherRegistrationPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({
            ...prev,
            open: false,
        }));
    };
    const {userId} = useParams();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        schoolName: "",
        schoolAddress: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async () => {
        if (form.password !== form.confirmPassword) {
            setSnackbar({
                open: true,
                message: "Die Passwörter stimmen nicht überein.",
                severity: "error",
            });
            return;
        }

        if (form.password.length < 8) {
            setSnackbar({
                open: true,
                message: "Das Passwort muss mindestens 8 Zeichen lang sein.",
                severity: "error",
            });
            return;
        }
        try {
            const teacherData = {
                ...form,
                userId: userId ? userId : "",
            };

            await registerTeacher(teacherData);
            setSnackbar({
                open: true,
                message: "Registrierung erfolgreich.",
                severity: "success",
            });
            navigate("/teacher/classes");
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Registrierung fehlgeschlagen.",
                severity: "error",
            });
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={10}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <GeneralLayout>
        <Box width={700}  mt={6}>
            <Card>
                <CardContent>
                    <Typography variant="h4" gutterBottom>
                        Lehrperson Registrierung
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Vorname"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="Nachname"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="Passwort"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="Passwort bestätigen"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="E-Mail"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="Schule"
                            name="schoolName"
                            value={form.schoolName}
                            onChange={handleChange}
                            required
                        />

                        <TextField
                            label="Adresse der Schule"
                            name="schoolAddress"
                            multiline
                            rows={3}
                            value={form.schoolAddress}
                            onChange={handleChange}
                            required
                        />

                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                        >
                            Registrieren
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </GeneralLayout>
    );
};

export default TeacherRegistrationPage;