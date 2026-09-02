import React, {useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel, IconButton, InputAdornment,
    Link,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import GeneralLayout from "../../layouts/GeneralLayout";
import {registerStudent, requestUnder14Registration} from "../../services/StudentService.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {Visibility, VisibilityOff} from "@mui/icons-material";

const StudentRegistrationPage = () => {
    const [step, setStep] = useState(1);
    const [birthday, setBirthday] = useState("");
    const [form, setForm] = useState({
        email: "",
        password: "",
        birthday: "",
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const { registrationToken } = useParams();
    const navigate = useNavigate();
    const [under14, setUnder14] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);
    const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const calculateAge = (date: string) => {
        const birthDate = new Date(date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff =
            today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleBirthdaySubmit = async () => {
        if (!birthday) {
            return;
        }
        const age = calculateAge(birthday);
        if (age < 14) {
            setUnder14(true);
            try {
                await requestUnder14Registration({birthday, registrationToken: registrationToken!,});
                setSnackbar({open: true, message: "Bitte kontaktiere deine Lehrperson.", severity: "error",});
            } catch (err) {
                console.error(err);
                setSnackbar({open: true, message: "Die Anfrage konnte nicht gesendet werden.", severity: "error",});
            }
            return;
        }
        setForm({...form, birthday,});
        setStep(2);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({...form, [e.target.name]: e.target.value,});
    };

    const handleRegister = async () => {
        if (!privacyAccepted || !dataProcessingAccepted) {
            setSnackbar({open: true, message: "Bitte bestätige beide Datenschutzbestimmungen.", severity: "error",});
            return;
        }
        if (form.password.length < 6) {
            setSnackbar({
                open: true,
                message: "Das Passwort muss mindestens 6 Zeichen lang sein.",
                severity: "error",
            });
            return;
        }
        try {
            const studentData = {...form, registrationToken: registrationToken!, privacyAccepted: privacyAccepted, dataProcessingAccepted: dataProcessingAccepted,};
            await registerStudent(studentData);
            setSnackbar({open: true, message: "Registrierung erfolgreich.", severity: "success",});
            navigate('/student/tests');
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Registrierung fehlgeschlagen.",
                severity: "error",
            });
        }
    };


    return (
        <GeneralLayout>
            <Box width={600} mt={6}>
                <Card>
                    <CardContent>
                        {step === 1 && (
                            <>
                                <Typography variant="h4" gutterBottom>
                                    Schüler Registrierung
                                </Typography>

                                <Typography mb={2}>
                                    Bitte gib zuerst dein Geburtsdatum ein.
                                </Typography>

                                <TextField fullWidth label="Geburtsdatum" type="date" InputLabelProps={{shrink:true,}} value={birthday} onChange={(e)=>
                                        setBirthday(e.target.value)
                                    }
                                />
                                <Button sx={{mt:3}} variant="contained" onClick={handleBirthdaySubmit}>Weiter</Button>
                                {under14 && (
                                    <Alert severity="info" sx={{ mt: 3 }}>
                                        Du bist unter 14 Jahre alt. Bitte kontaktiere deine Lehrperson, damit sie dich registrieren kann.
                                    </Alert>
                                )}
                           </>
                        )}

                        {step === 2 && (
                            <>
                                <Typography variant="h4" gutterBottom>Deine Daten</Typography>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    <TextField label="E-Mail" name="email" type="email" value={form.email} onChange={handleChange}/>
                                    <TextField
                                        label="Passwort"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={handleChange}
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            onClick={() => setShowPassword((prev) => !prev)}
                                                            edge="end"
                                                            aria-label={
                                                            showPassword ? "Passwort ausblenden" : "Passwort anzeigen"}>
                                                            {showPassword ? (<VisibilityOff />) : (<Visibility />)}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                    <Box>
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
                                        <FormControlLabel
                                            control={<Checkbox checked={dataProcessingAccepted} onChange={(e) => setDataProcessingAccepted(e.target.checked)}/>}
                                            label="Ich stimme der Verarbeitung meiner Daten für die Durchführung der Tests zu."
                                        />
                                    </Box>
                                    <Button variant="contained" onClick={handleRegister}>Registrieren</Button>
                                </Box>

                            </>
                        )}

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
                        Verantwortlichen und zu den Rechten der Schülerinnen
                        und Schüler einfügen.
                    </Typography>

                    <Typography paragraph>
                        Weitere Informationen zum Datenschutz können hier
                        ergänzt werden.
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setPrivacyDialogOpen(false)}>
                        Schließen
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({...snackbar, open:false,})}>
                <Alert severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>


        </GeneralLayout>
    );
};

export default StudentRegistrationPage;