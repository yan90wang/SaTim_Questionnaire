import React, {useEffect, useState} from "react";
import MainLayout from "../layouts/MainLayout";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {Add} from "@mui/icons-material";
import {getTeachers, type Teacher,} from "../services/TeacherService.tsx";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../contexts/AuthContext.tsx";

const TeacherPage = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [inviteUrl, setInviteUrl] = useState("");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const navigate = useNavigate();
    const {userId} = useAuth();
    const handleOpenAddTeacher = async () => {
        setOpenAddDialog(true);
        setInviteUrl(`${window.location.origin}/teacher/register/${userId}`);
    };

    useEffect(() => {
        const fetchTeachers = async () => {
            setIsLoading(true);
            try {
                const data = await getTeachers();
                setTeachers(data);
            } catch (err) {
                console.error("Failed to fetch teachers:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    if (isLoading) {
        return (
            <MainLayout>
                <Typography>Loading...</Typography>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{minHeight: "100vh", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6,}}>
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{vertical: "bottom", horizontal: "center",}}>
                    <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">
                        Lehrpersonen
                    </Typography>

                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddTeacher}>
                        Lehrperson hinzufügen
                    </Button>
                </Box>

                <Card>
                    <CardHeader title="Lehrpersonen Liste" />
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        {teachers.length > 0 ? (
                            teachers.map((teacher) => (
                                <Card key={teacher.id} variant="outlined">
                                    <CardContent sx={{display: "flex", justifyContent: "space-between", alignItems: "center",}}>
                                        <Box>
                                            <Typography variant="subtitle1">
                                                {teacher.first_name} {teacher.last_name}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                {teacher.email}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                {teacher.school_name}
                                            </Typography>
                                        </Box>

                                        <Button variant="outlined" onClick={() => navigate(`/teacher/classes/${teacher.id}`)}>
                                            Klassenübersicht
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                Keine Lehrpersonen gefunden
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth>
                <DialogTitle>Lehrperson hinzufügen</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Teilen Sie diesen Link mit der Lehrperson.
                    </Typography>
                    <TextField fullWidth value={inviteUrl} slotProps={{input: {readOnly: true,},}}/>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => navigator.clipboard.writeText(inviteUrl)} disabled={!inviteUrl}>
                        Kopieren
                    </Button>
                    <Button onClick={() => setOpenAddDialog(false)}>
                        Schließen
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

export default TeacherPage;