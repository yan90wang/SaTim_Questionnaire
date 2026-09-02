import React, {useState} from "react";
import {
    Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel, Link, MenuItem, Select, Snackbar, TextField, Typography,
} from "@mui/material";
import {registerTeacher} from "../../services/TeacherService.tsx";
import GeneralLayout from "../../layouts/GeneralLayout.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {SWISS_CANTONS} from "./Cantons.tsx";
import {Visibility, VisibilityOff} from "@mui/icons-material";

const TeacherRegistrationPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        canton: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async () => {
        if (!privacyAccepted) {
            setSnackbar({open: true, message: "Bitte akzeptieren Sie die Datenschutzerklärung.", severity: "error",});
            return;
        }
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
        if (!form.canton) {
            setSnackbar({
                open: true,
                message: "Bitte wählen Sie einen Kanton aus.",
                severity: "error",
            });
            return;
        }
        try {
            setLoading(true);
            const teacherData = {...form, userId: userId ? userId : "", privacyAccepted: privacyAccepted};
            await registerTeacher(teacherData);
            setSnackbar({open: true, message: "Registrierung erfolgreich.", severity: "success",});
            navigate("/teacher/classes");
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Registrierung fehlgeschlagen.",
                severity: "error",
            });
        } finally {
        setLoading(false);}
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
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            required
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                edge="end"
                                                aria-label={
                                                    showPassword
                                                        ? "Passwort ausblenden"
                                                        : "Passwort anzeigen"
                                                }
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}></TextField>

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

                        <FormControl required fullWidth>
                            <InputLabel id="canton-label">Kanton</InputLabel>
                            <Select
                                labelId="canton-label"
                                name="canton"
                                value={form.canton}
                                label="Kanton"
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        canton: e.target.value,
                                    })
                                }
                            >
                                {SWISS_CANTONS.map((canton) => (
                                    <MenuItem key={canton.value} value={canton.value}>
                                        {canton.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={<Checkbox checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)}/>}
                            label={
                                <Typography variant="body2">
                                    Ich habe die{" "}
                                    <Link
                                        component="button"
                                        type="button"
                                        underline="always"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setPrivacyDialogOpen(true);
                                        }}
                                        sx={{verticalAlign: "baseline", cursor: "pointer", color: "primary.main", fontWeight: 600, borderRadius: 1, px: 0.5, transition: "all 0.2s ease", "&:hover": {color: "primary.dark", backgroundColor: "action.hover", textDecorationThickness: "2px",},}}>
                                        Datenschutzerklärung
                                    </Link>{" "}
                                    gelesen und akzeptiere diese.
                                </Typography>
                            }
                        />

                        <Button variant="contained" onClick={handleSubmit} disabled={!privacyAccepted}>
                            Registrieren
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
            <Dialog open={privacyDialogOpen} onClose={() => setPrivacyDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>
                    Datenschutzerklärung
                </DialogTitle>
                <DialogContent dividers>
                    <Typography paragraph>
                        Hier steht deine Datenschutzerklärung.
                    </Typography>

                    <Typography paragraph>
                        Du kannst hier den vollständigen Text zur Verarbeitung
                        personenbezogener Daten, zur Speicherdauer, zu den
                        Verantwortlichen und zu den Rechten der Lehrpersonen einfügen.
                    </Typography>

                    <Typography paragraph>
                        Weitere Informationen zum Datenschutz können hier ergänzt werden.
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPrivacyDialogOpen(false)}>
                        Schließen
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </GeneralLayout>
    );
};

export default TeacherRegistrationPage;