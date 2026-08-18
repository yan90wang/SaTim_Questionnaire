import React, { useState } from "react";
import {Box, TextField, Button, Card, CardContent, CardHeader, Typography, Snackbar, Alert,} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getUserById, loginUser } from "../services/UserService.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";

interface LoginFormProps {
    onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const { t } = useTranslation();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const auth = await loginUser(email, password);
            const user = await getUserById(auth.userId);
            login(user.id, auth.token);

            setSnackbar({
                open: true,
                message: t("loginForm.successMessage"),
                severity: "success",
            });

            onSuccess?.();
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err?.message || t("loginForm.errorMessage"),
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
                            {t("loginForm.title")}
                        </Typography>
                    }
                    subheader={
                        <Typography variant="body2" align="center" color="text.secondary">
                            {t("loginForm.subtitle")}
                        </Typography>
                    }
                />
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField label={t("loginForm.email")} type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth/>
                        <TextField label={t("loginForm.password")} type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth/>
                        <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
                            {isLoading ? t("loginForm.amAnmelden") : t("loginForm.anmelden")}
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};
