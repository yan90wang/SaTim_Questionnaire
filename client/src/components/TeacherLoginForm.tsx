import React, {useState} from "react";
import {Alert, Box, Button, Card, CardContent, CardHeader, Snackbar, TextField, Typography,} from "@mui/material";
import {loginTeacher,} from "../services/TeacherService.tsx";
import {useNavigate} from "react-router-dom";

interface TeacherLoginFormProps {
    onSuccess?: () => void;
}

export const TeacherLoginForm = ({
                                     onSuccess,
                                 }: TeacherLoginFormProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const navigate = useNavigate();

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await loginTeacher({email, password,});
            setSnackbar({open: true, message: "Erfolgreich eingeloggt.", severity: "success",});
            onSuccess?.();
            navigate("/teacher/classes");
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: "Login fehlgeschlagen. Überprüfen Sie ihre Informationen.", severity: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
                <CardHeader
                    title={
                        <Typography variant="h5" align="center" fontWeight="bold">
                            Lehrer Login
                        </Typography>
                    }
                    subheader={
                        <Typography variant="body2" align="center" color="text.secondary">
                            Melde dich hier mit deinen Daten an.
                        </Typography>
                    }
                />

                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                            fullWidth
                        />

                        <TextField
                            label="Passwort"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            fullWidth
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Laden..."
                                : "Anmelden"}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() =>
                    setSnackbar((s) => ({
                        ...s,
                        open: false,
                    }))
                }
            >
                <Alert severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};