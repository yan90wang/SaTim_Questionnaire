import React, {useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import GeneralLayout from "../../layouts/GeneralLayout";
import {registerStudent, requestUnder14Registration} from "../../services/StudentService.tsx";
import {useNavigate, useParams} from "react-router-dom";


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
        try {
            const studentData = {...form, registrationToken: registrationToken!,};
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
                                    <TextField label="Passwort" name="password" type="password" value={form.password} onChange={handleChange}/>
                                    <Button variant="contained" onClick={handleRegister}>Registrieren</Button>
                                </Box>

                            </>
                        )}

                    </CardContent>
                </Card>

            </Box>


            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({...snackbar, open:false,})}>
                <Alert severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>


        </GeneralLayout>
    );
};

export default StudentRegistrationPage;