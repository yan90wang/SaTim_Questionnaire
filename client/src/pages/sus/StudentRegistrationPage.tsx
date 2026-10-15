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
    Stack,
    Divider,
    TextField,
    Typography,
} from "@mui/material";
import GeneralLayout from "../../layouts/GeneralLayout";
import {registerStudent, requestUnder14Registration} from "../../services/StudentService.tsx";
import {useNavigate, useParams} from "react-router-dom";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";

const StudentRegistrationPage = () => {
    const [step, setStep] = useState(1);
    const [birthday, setBirthday] = useState("");
    const [form, setForm] = useState({email: "", password: "", birthday: "",});
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    const isValidEmail = (email: string) => {const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;return emailRegex.test(email.trim());};
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
        if (!form.email.trim()) {
            setSnackbar({open: true, message: "Bitte gib eine E-Mail-Adresse ein.", severity: "error",});
            return;
        }

        if (!isValidEmail(form.email)) {
            setSnackbar({open: true, message: "Bitte gib eine gültige E-Mail-Adresse ein.", severity: "error",});
            return;
        }
        if (!privacyAccepted || !dataProcessingAccepted) {
            setSnackbar({open: true, message: "Bitte bestätige beide Datenschutzbestimmungen.", severity: "error",});
            return;
        }
        if (form.password.length < 6) {
            setSnackbar({open: true, message: "Das Passwort muss mindestens 6 Zeichen lang sein.", severity: "error",});
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
                message: err instanceof Error ? err.message : "Registrierung fehlgeschlagen.",
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
                                <Typography variant="h4" gutterBottom>Schüler Registrierung</Typography>
                                <Typography mb={2}>Bitte gib zuerst dein Geburtsdatum ein.</Typography>
                                <TextField fullWidth label="Geburtsdatum" type="date" InputLabelProps={{shrink:true,}} value={birthday} onChange={(e)=> setBirthday(e.target.value)}/>
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
                                    <TextField
                                        label="E-Mail"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        error={form.email.length > 0 && !isValidEmail(form.email)}
                                        helperText={form.email.length > 0 && !isValidEmail(form.email) ? "Bitte gib eine gültige E-Mail-Adresse ein." : ""}
                                    />
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
            <Dialog
                open={privacyDialogOpen}
                onClose={() => setPrivacyDialogOpen(false)}
                fullWidth
                maxWidth="md"
                scroll="paper"
                PaperProps={{sx: {borderRadius: 3, maxHeight: "85vh",},}}>
                <DialogTitle sx={{px: { xs: 2.5, sm: 4 }, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between",}}>
                    <Box>
                        <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 0.5 }}>
                            Datenschutzerklärung und Einwilligung
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                            Informationen zur Teilnahme am Forschungsprojekt SaTiM
                        </Typography>
                    </Box>

                    <IconButton onClick={() => setPrivacyDialogOpen(false)} aria-label="Dialog schliessen" sx={{ ml: 2 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent
                    sx={{px: { xs: 2.5, sm: 4 }, py: 3,}}>
                    <Stack spacing={3.5} sx={{"& .privacy-heading": {fontWeight: 700, fontSize: "1.05rem", mb: 1.2, color: "text.primary",}, "& .privacy-text": {fontSize: "0.95rem", lineHeight: 1.85, color: "text.secondary",},}}>
                        <Box>
                            <Typography className="privacy-heading">
                                Worum geht es?
                            </Typography>

                            <Typography className="privacy-text">
                                Im Projekt SaTiM der Pädagogischen Hochschule
                                St.Gallen (PHSG) untersuchen wir, wie Schüler*innen
                                Mathematik zum Thema lineare Funktionen lernen.
                                Damit möchten wir besser verstehen, wie sich
                                mathematische Fähigkeiten entwickeln.
                                Du bearbeitest während der Unterrichtseinheit
                                mehrere digitale Mathematiktests und einen Fragebogen.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography className="privacy-heading">
                                Freiwillig und ohne Benotung
                            </Typography>

                            <Typography className="privacy-text">
                                Du entscheidest selbst, ob du mitmachen möchtest.
                                Die Tests und der Fragebogen werden nicht benotet
                                und haben keinen Einfluss auf deine Schulnoten.
                                Du kannst die Teilnahme jederzeit ohne Angabe
                                von Gründen ablehnen oder beenden.
                                Dadurch entstehen dir keine Nachteile.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography className="privacy-heading">
                                Welche Daten erheben wir?
                            </Typography>

                            <Stack spacing={2}>
                                <Typography className="privacy-text">
                                    Wir erfassen deine Antworten und Ergebnisse
                                    in den Mathematiktests und deine Antworten
                                    im Fragebogen. Dabei geht es um dein Alter,
                                    dein Geschlecht, deine Schulstufe, deinen
                                    Kanton, deinen Sprachhintergrund, die
                                    Bildungsabschlüsse deiner Erziehungsberechtigten,
                                    Bildungsressourcen zu Hause und deine letzte
                                    Zeugnisnote. Ausserdem fragen wir, wie sicher
                                    du dich im Umgang mit Mathematik-Software fühlst,
                                    wie du das Erreichen von Lernzielen einschätzt,
                                    wie angestrengt und aufmerksam du arbeitest
                                    und wie nützlich du die Testanwendung findest
                                    und akzeptierst.
                                </Typography>

                                <Typography className="privacy-text">
                                    Für deinen Zugang zur Plattform werden ausserdem
                                    dein Geburtsdatum, deine E-Mail-Adresse
                                    beziehungsweise eine erzeugte Anmeldekennung
                                    und die Zuordnung zu deiner Klasse verarbeitet.
                                    Deine Daten aus den verschiedenen Tests und
                                    dem Fragebogen werden miteinander verknüpft,
                                    damit wir deine Lernentwicklung untersuchen können.
                                </Typography>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography className="privacy-heading">
                                Wofür verwenden wir deine Daten?
                            </Typography>

                            <Typography className="privacy-text">
                                Wir verwenden deine Studienangaben ausschliesslich
                                für wissenschaftliche Zwecke. Die Ergebnisse können
                                in wissenschaftlichen Veröffentlichungen erscheinen.
                                Dabei darf niemand erkennen können, welche Antworten
                                oder Ergebnisse von dir stammen. Deine Lehrperson
                                erhält nach Abschluss eine zusammengefasste
                                Rückmeldung zu den Aufgabenergebnissen der Klasse.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="privacy-heading">
                                Wie schützen wir deine Daten?
                            </Typography>

                            <Typography className="privacy-text">
                                Deine Daten werden vertraulich behandelt und vor
                                unberechtigtem Zugriff geschützt. Solange wir deine
                                Angaben noch dir oder deinem Benutzerkonto zuordnen
                                können, sind sie nicht vollständig anonym.
                                Nach Abschluss des Projekts werden personenbezogene
                                Angaben gemäss dem Datenschutzkonzept gelöscht und
                                die Forschungsdaten vollständig anonymisiert.
                                Die anonymisierten Forschungsdaten können in einem
                                Forschungsarchiv aufbewahrt und anderen Forschenden
                                für wissenschaftliche Zwecke zur Verfügung gestellt
                                werden.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography className="privacy-heading">
                                Du kannst deine Einwilligung zurückziehen
                            </Typography>

                            <Typography className="privacy-text">
                                Auch nach deiner Zustimmung kannst du deine
                                Einwilligung jederzeit ohne Nachteile zurückziehen.
                                Wende dich dafür an Peter Steiner:{" "}
                                <Box component="a" href="mailto:peter.steiner@phsg.ch" sx={{color: "primary.main", textDecoration: "none", fontWeight: 500, "&:hover": {textDecoration: "underline",},}}>
                                    peter.steiner@phsg.ch
                                </Box>
                                . Solange deine Studiendaten noch zugeordnet werden
                                können, kannst du ihre Löschung verlangen.
                                Bereits vollständig anonymisierte Daten können wir
                                nicht mehr dir zuordnen und deshalb nicht gezielt
                                entfernen. Wenn du nur den Test schliesst,
                                werden bereits gespeicherte Antworten nicht
                                automatisch gelöscht.
                            </Typography>
                        </Box>

                        <Box>
                            <Typography className="privacy-heading">
                                Fragen und verantwortliche Stelle
                            </Typography>

                            <Typography className="privacy-text">
                                Verantwortlich ist die Pädagogische Hochschule
                                St.Gallen (PHSG), Institut Pädagogische Psychologie,
                                Notkerstrasse 27, 9000 St.Gallen.
                                Projektleitung: Prof. Dr. Jan Hochweber.
                                Bei Fragen zur Teilnahme, zu deinen Daten oder
                                zu Auskunft und Berichtigung erreichst du das
                                Projektteam unter{" "}
                                <Box
                                    component="a"
                                    href="mailto:projekt.satim@phsg.ch"
                                    sx={{
                                        color: "primary.main",
                                        textDecoration: "none",
                                        fontWeight: 500,
                                        "&:hover": {
                                            textDecoration: "underline",
                                        },
                                    }}
                                >
                                    projekt.satim@phsg.ch
                                </Box>
                                . Wenn du etwas nicht verstehst,
                                frage vor deiner Zustimmung nach.
                            </Typography>
                        </Box>
                        <Divider />

                        <Box sx={{backgroundColor: "action.hover", borderRadius: 2, p: { xs: 2, sm: 3 }, border: "1px solid", borderColor: "divider",}}>
                            <Typography
                                sx={{fontWeight: 700, fontSize: "1.1rem", mb: 1.5, color: "text.primary",}}>
                                Deine Einwilligung
                            </Typography>

                            <Typography
                                sx={{fontSize: "0.95rem", lineHeight: 1.85, color: "text.primary",}}>
                                Mit einem Klick auf{" "}
                                <strong>
                                    «Ich willige ein und möchte teilnehmen»
                                </strong>{" "}
                                bestätige ich: Ich bin über 14 Jahre alt.
                                Ich habe die Informationen zur Studie und zur
                                Verwendung meiner Daten gelesen und verstanden
                                und konnte offene Fragen klären.
                                Ich nehme freiwillig teil und bin mit der
                                beschriebenen Erhebung, Verknüpfung und
                                wissenschaftlichen Auswertung meiner Daten
                                sowie der beschriebenen Nutzung vollständig
                                anonymisierter Forschungsdaten einverstanden.
                                Ich weiss, dass die Teilnahme nicht benotet
                                wird und dass ich meine Einwilligung jederzeit
                                ohne Nachteile zurückziehen kann.
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{px: { xs: 2.5, sm: 4 }, py: 2, borderTop: "1px solid", borderColor: "divider",}}>
                    <Button
                        onClick={() => setPrivacyDialogOpen(false)}
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            px: 3,
                        }}>
                        Schliessen
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