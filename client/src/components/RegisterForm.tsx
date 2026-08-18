import { useState } from "react";
import {Box, TextField, Button, Card, CardContent, CardHeader, Typography, Snackbar, Alert,} from "@mui/material";
import { useTranslation } from "react-i18next";
import { registerUser, type RegisterFormData } from "../services/UserService.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";

interface RegisterFormProps {
    onSuccess?: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
    const { t } = useTranslation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setSnackbar({
                open: true,
                message: t("registerForm.passwordMismatch"),
                severity: "error",
            });
            return;
        }

        setIsLoading(true);

        try {
            const payload: RegisterFormData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            };

            const user = await registerUser(payload);
            login(user.userId, user.token);

            onSuccess?.();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err?.message || t("registerForm.errorMessage"),
                severity: "error",
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
                            {t("registerForm.title")}
                        </Typography>
                    }
                    subheader={
                        <Typography variant="body2" align="center" color="text.secondary">
                            {t("registerForm.subtitle")}
                        </Typography>
                    }
                />
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField label={t("registerForm.firstName")} placeholder="Vornamen eingeben" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required fullWidth/>
                        <TextField label={t("registerForm.lastName")} placeholder="Nachnamen eingeben" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required fullWidth/>
                        <TextField label={t("registerForm.email")} type="email" placeholder="Email eingeben" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required fullWidth/>
                        <TextField label={t("registerForm.password")} type="password" placeholder="Passwort eingeben" value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required fullWidth/>
                        <TextField label={t("registerForm.passwordConfirm")} type="password" placeholder="Passwort wiederholen" value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required fullWidth/>
                        <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
                            {isLoading ? t("registerForm.creating") : t("registerForm.create")}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};
