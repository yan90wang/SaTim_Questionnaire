import {useState} from "react";
import {useTranslation} from "react-i18next";
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogContent,
    Grid,
    Typography,
} from "@mui/material";

import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import { LoginForm } from "../components/LoginForm.tsx";
import { RegisterForm } from "../components/RegisterForm.tsx";
import { TeacherLoginForm } from "../components/TeacherLoginForm.tsx";
import { StudentLoginForm } from "../components/StudentLoginForm.tsx";
import {useNavigate} from "react-router-dom";

const LandingPage = () => {
    const {t} = useTranslation();
    const [loginType, setLoginType] = useState<"team" | "teacher" | "student" | null>(null);
    const [registerOpen, setRegisterOpen] = useState(false);
    const navigate = useNavigate();

    const handleLoginSuccess = () => {
        setLoginType(null);
        navigate("/dashboard");
    };

    const handleTeacherLoginSuccess = () => {
        setLoginType(null);
        navigate("/teacher");
    };

    const handleStudentLoginSuccess = () => {
        setLoginType(null);
        navigate("/student");
    };

    return (
        <Box sx={{minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default",}}>
            <Box sx={{textAlign: "center"}}>
                <Typography variant="h2" fontWeight={300} color="text.primary" gutterBottom>
                    {t("landing.title")}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{mb: 4}}>
                    {t("landing.subtitle")}
                </Typography>

                <Grid container spacing={4} justifyContent="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            sx={{height: "100%", cursor: "pointer", transition: "0.2s", "&:hover": {transform: "translateY(-6px)", boxShadow: 8,},}}
                            onClick={() => setLoginType("team")}>
                            <CardContent sx={{ textAlign: "center", py: 5 }}>
                                <GroupsIcon sx={{ fontSize: 64, mb: 2 }} />
                                <Typography variant="h5">
                                    Team Mitglied
                                </Typography>

                                <Typography color="text.secondary" sx={{ mt: 2 }}>
                                    Erstellen und überprüfen Sie Aufgaben, verwalten Sie Erhebungen und administrieren Sie die Plattform.
                                </Typography>

                                <Button variant="contained" sx={{ mt: 4 }}>
                                    Login
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            sx={{height: "100%", cursor: "pointer", transition: "0.2s", "&:hover": {
                                transform: "translateY(-6px)", boxShadow: 8,},}} onClick={() => setLoginType("teacher")}>
                            <CardContent sx={{ textAlign: "center", py: 5 }}>
                                <SchoolIcon sx={{ fontSize: 64, mb: 2 }} />
                                <Typography variant="h5">
                                    Lehrperson
                                </Typography>

                                <Typography color="text.secondary" sx={{ mt: 2 }}>
                                    Klassen verwalten, Schülerinnen und Schüler einladen und Testfortschritte verfolgen.
                                </Typography>

                                <Button variant="contained" sx={{ mt: 4 }}>
                                    Login
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            sx={{height: "100%", cursor: "pointer", transition: "0.2s", "&:hover": {transform: "translateY(-6px)", boxShadow: 8,},}}
                            onClick={() => setLoginType("student")}>
                            <CardContent sx={{ textAlign: "center", py: 5 }}>
                                <SchoolOutlinedIcon sx={{ fontSize: 64, mb: 2 }} />
                                <Typography variant="h5">
                                    Schülerinnen und Schüler
                                </Typography>

                                <Typography color="text.secondary" sx={{ mt: 2 }}>
                                    Greifen Sie auf Ihre zugewiesenen Tests zu.
                                </Typography>

                                <Button variant="contained" sx={{ mt: 4 }}>Login</Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            <Dialog
                open={loginType === "team"}
                onClose={() => setLoginType(null)}
                maxWidth="xs"
                fullWidth>
                <DialogContent>
                    <LoginForm onSuccess={handleLoginSuccess} />

                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        Kein Konto?{" "}
                        <Button
                            variant="text"
                            onClick={() => {
                                setLoginType(null);
                                setRegisterOpen(true);
                            }}>
                            Registrieren
                        </Button>
                    </Typography>
                </DialogContent>
            </Dialog>

            <Dialog
                open={loginType === "teacher"}
                onClose={() => setLoginType(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogContent>
                    <TeacherLoginForm
                        onSuccess={handleTeacherLoginSuccess}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={loginType === "student"}
                onClose={() => setLoginType(null)}
                maxWidth="xs"
                fullWidth>
                <DialogContent>
                    <StudentLoginForm
                        onSuccess={handleStudentLoginSuccess}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogContent>
                    <RegisterForm
                        onSuccess={() => {
                            setRegisterOpen(false);
                            navigate("/dashboard");
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LandingPage;
