import React, {useEffect, useState} from "react";
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    TextField,
    Typography,
} from "@mui/material";

import StudentLayout from "../../layouts/StudentLayout";
import {getStudentById, type Student} from "../../services/StudentService";

const StudentProfilePage = () => {
    const studentId = Number(localStorage.getItem("studentId"));
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        const loadStudent = async () => {
            try {
                const data = await getStudentById(studentId);
                setStudent(data);
            } catch(err) {
                console.error(
                    "Failed to load student profile:",
                    err
                );
            } finally {
                setLoading(false);
            }
        };

        if(studentId){
            loadStudent();
        }

    }, [studentId]);

    if(loading){
        return (
            <StudentLayout>
                <Box display="flex" justifyContent="center" mt={10}>
                    <CircularProgress/>
                </Box>
            </StudentLayout>
        );

    }

    if(!student){

        return (
            <StudentLayout>
                <Typography>
                    Profil konnte nicht geladen werden.
                </Typography>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Box sx={{maxWidth:1000, mx:"auto", py:3}}>
                <Box mb={3}>
                    <Typography variant="h4">
                        Mein Profil
                    </Typography>

                    <Typography color="text.secondary">
                        Persönliche Daten
                    </Typography>
                </Box>

                <Card>
                    <CardHeader
                        title="Schülerdaten"
                    />

                    <CardContent
                        sx={{display:"flex", flexDirection:"column", gap:2
                    }}>
                        <TextField
                            label="E-Mail"
                            value={student.email ?? "Keine E-Mail hinterlegt"}
                            fullWidth
                            disabled
                        />

                        <TextField
                            label="Geburtsdatum"
                            value={
                                new Date(
                                    student.birthday
                                ).toLocaleDateString()
                            }
                            fullWidth
                            disabled
                        />
                    </CardContent>
                </Card>
            </Box>
        </StudentLayout>
    );

};

export default StudentProfilePage;