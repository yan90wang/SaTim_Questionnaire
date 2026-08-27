import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader, FormControl, InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import TeacherLayout from "../../layouts/TeacherLayout.tsx";
import {getTeacherById, type Teacher} from "../../services/TeacherService.tsx";
import { SWISS_CANTONS } from "./Cantons.tsx";

const TeacherProfilePage = () => {
    const teacherId = Number(localStorage.getItem("teacherId"));

    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <TeacherLayout>
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
                            disabled={isLoading}
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
                    </CardContent>
                </Card>
            </Box>
        </TeacherLayout>
    );
};

export default TeacherProfilePage;