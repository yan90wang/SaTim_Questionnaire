import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader, CircularProgress, FormControl, InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import TeacherLayout from "../../layouts/TeacherLayout.tsx";
import {getTeacherById, type Teacher, updateTeacher} from "../../services/TeacherService.tsx";
import { SWISS_CANTONS } from "./Cantons.tsx";
import {useParams} from "react-router-dom";

const TeacherProfilePage = () => {
    const {teacherId: routeTeacherId} = useParams();
    const isAdminView = !!routeTeacherId;
    const teacherId = routeTeacherId
        ? Number(routeTeacherId)
        : Number(localStorage.getItem("teacherId"));
    const [isLoading, setIsLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [teacher, setTeacher] = useState<Teacher>({
        id: 0,
        first_name: "",
        last_name: "",
        email: "",
        school_name: "",
        school_address: "",
        canton: ""
    });

    useEffect(() => {
        if (!teacherId) return;

        const fetchTeacher = async () => {
            setIsLoading(true);
            try {
                const data = await getTeacherById(teacherId);
                setTeacher(data);
            } catch (err) {
                console.error("Failed to fetch teacher:", err);
                setSnackbar({
                    open: true,
                    message: "Profil konnte nicht geladen werden.",
                    severity: "error",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeacher();
    }, [teacherId]);

    const handleChange = (
        field:
            | "first_name"
            | "last_name"
            | "email"
            | "school_name"
            | "school_address"
            | "canton",
        value: string
    ) => {
        setTeacher((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        if (!teacherId) return;
        setIsLoading(true);

        try {
            const updatedTeacher = await updateTeacher(
                teacherId,
                {
                    first_name: teacher.first_name,
                    last_name: teacher.last_name,
                    email: teacher.email,
                    school_name: teacher.school_name,
                    school_address: teacher.school_address,
                    canton: teacher.canton
                }
            );
            setTeacher(updatedTeacher);
            setSnackbar({
                open: true,
                message: "Änderungen wurden erfolgreich gespeichert.",
                severity: "success",
            });
        } catch (err) {
            console.error("Failed to update teacher:", err);
            setSnackbar({
                open: true,
                message: "Änderungen konnten nicht gespeichert werden.",
                severity: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <TeacherLayout adminView={isAdminView} teacherId={routeTeacherId}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout adminView={isAdminView} teacherId={routeTeacherId}>
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">
                            Mein Profil
                        </Typography>

                        <Typography color="text.secondary">
                            Persönliche Daten
                        </Typography>
                    </Box>
                </Box>

                <Card>
                    <CardHeader title="Lehrperson" />
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        <TextField
                            label="Vorname"
                            value={teacher.first_name}
                            fullWidth
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "first_name",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="Nachname"
                            value={teacher.last_name}
                            fullWidth
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "last_name",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="E-Mail"
                            type="email"
                            value={teacher.email}
                            fullWidth
                            disabled={true}
                            onChange={(e) =>
                                handleChange(
                                    "email",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="Schule"
                            value={teacher.school_name}
                            fullWidth
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "school_name",
                                    e.target.value
                                )
                            }
                        />

                        <TextField
                            label="Schuladresse"
                            value={teacher.school_address}
                            fullWidth
                            multiline
                            rows={2}
                            disabled={isLoading}
                            onChange={(e) =>
                                handleChange(
                                    "school_address",
                                    e.target.value
                                )
                            }
                        />

                        <FormControl fullWidth required disabled={isLoading}>
                            <InputLabel id="teacher-canton-label">
                                Kanton
                            </InputLabel>

                            <Select
                                labelId="teacher-canton-label"
                                value={teacher.canton ?? ""}
                                label="Kanton"
                                onChange={(e) =>
                                    handleChange("canton", e.target.value)
                                }
                            >
                                {SWISS_CANTONS.map((canton) => (
                                    <MenuItem key={canton.value} value={canton.value}>
                                        {canton.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isLoading}
                            sx={{alignSelf: "flex-start"}}>
                            Änderungen speichern
                        </Button>
                    </CardContent>
                </Card>
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                onClose={() =>
                    setSnackbar((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }>
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() =>
                        setSnackbar((prev) => ({
                            ...prev,
                            open: false,
                        }))
                    }>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </TeacherLayout>
    );
};

export default TeacherProfilePage;