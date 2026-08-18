import React, { useEffect, useState } from "react";
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
    MenuItem,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import {
    createClass,
    getClasses,
    type SchoolClass,
} from "../../services/ClassService";
import TeacherLayout from "../../layouts/TeacherLayout.tsx";
import {useNavigate, useParams} from "react-router-dom";

// @ts-ignore
enum SchoolClassType {
    KANTI_KURZ_1 = "KANTI_KURZ_1",
    KANTI_KURZ_2 = "KANTI_KURZ_2",
    KANTI_LANG_1 = "KANTI_LANG_1",
    SEK_7 = "SEK_7",
    SEK_8 = "SEK_8",
    SEK_9 = "SEK_9",
};

const ClassOverviewPage = () => {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [newClass, setNewClass] = useState<{ name: string; type: SchoolClassType | string; }>({name: "", type: SchoolClassType.SEK_7,});
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    const navigate = useNavigate();
    const { teacherId } = useParams();
    const [customType, setCustomType] = useState("");

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const data = await getClasses(teacherId);
            setClasses(data);
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Klassen konnten nicht geladen werden.",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreateClass = async () => {
        if (newClass.type === "CUSTOM" && customType.trim() === "") {
               setSnackbar({open: true, message: "Bitte eigenen Schultyp eingeben.", severity: "error",});
            return;
        }
        try {
            await createClass({
                name: newClass.name,
                type: newClass.type === "CUSTOM" ? customType : newClass.type,
            });
            setSnackbar({
                open: true,
                message: "Klasse erfolgreich erstellt.",
                severity: "success",
            });
            setOpenDialog(false);
            setNewClass({
                name: "",
                type: SchoolClassType.SEK_7,
            });
            setCustomType("");
            fetchClasses();
        } catch (err) {
            console.error(err);

            setSnackbar({
                open: true,
                message: "Klasse konnte nicht erstellt werden.",
                severity: "error",
            });
        }
    };

    if (loading) {
        return (
            <TeacherLayout>
                <Typography>Loading...</Typography>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <Box sx={{minHeight: "100vh",  px: 2}}>
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false,})}>
                    <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({...snackbar, open: false,})}>{snackbar.message}</Alert>
                </Snackbar>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                 <Typography variant="h4">
                        Meine Klassen
                    </Typography>

                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                        Klasse erstellen
                    </Button>
                </Box>

                <Card>
                    <CardHeader title="Klassen" />
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2,}}>
                        {classes.length > 0 ? (
                            classes.map((schoolClass) => (
                                <Card key={schoolClass.id} variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">
                                            {schoolClass.name}
                                        </Typography>

                                        <Typography color="text.secondary">
                                            {schoolClass.type}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            {schoolClass.studentCount} SuS
                                        </Typography>

                                        <Box mt={2} display="flex" gap={1}>
                                            <Button variant="contained" size="small"
                                                onClick={() => navigate(`/teacher/class/${schoolClass.id}`)}>
                                                Verwalten
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                Noch keine Klassen vorhanden.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    fullWidth>
                    <DialogTitle>
                        Neue Klasse erstellen
                    </DialogTitle>

                    <DialogContent sx={{display: "flex", flexDirection: "column", gap: 2, pt: 2,}}>
                        <TextField
                            label="Klassenname"
                            value={newClass.name}
                            onChange={(e) =>
                                setNewClass({
                                    ...newClass,
                                    name: e.target.value,
                                })
                            }
                        />

                        <TextField
                            select
                            label="Schultyp"
                            value={newClass.type}
                            onChange={(e) =>
                                setNewClass({
                                    ...newClass,
                                    type: e.target.value,
                                })
                            }>
                            {Object.values(SchoolClassType).map((type) => (
                                <MenuItem
                                    key={type}
                                    value={type}>
                                    {type}
                                </MenuItem>
                            ))}

                            <MenuItem value="CUSTOM">
                                Anderer Schultyp
                            </MenuItem>

                        </TextField>
                        {newClass.type === "CUSTOM" && (
                            <TextField
                                label="Eigener Schultyp"
                                value={customType}
                                onChange={(e) =>
                                    setCustomType(e.target.value)
                                }
                                required
                            />
                        )}
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={() =>
                                setOpenDialog(false)
                            }
                        >
                            Abbrechen
                        </Button>

                        <Button
                            variant="contained"
                            onClick={handleCreateClass}
                        >
                            Erstellen
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </TeacherLayout>
    );
};

export default ClassOverviewPage;