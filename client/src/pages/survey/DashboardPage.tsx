import React, {useEffect, useState} from "react";
import MainLayout from "../../layouts/MainLayout.tsx";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, FormControl,
    FormControlLabel,
    Grid, InputLabel,
    MenuItem,
    Radio,
    RadioGroup, Select,
    Snackbar, Switch,
    TextField, Tooltip,
    Typography,
} from "@mui/material";
import {Add, BarChart, CalendarToday} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {createSurvey, getSurveys} from "../../services/SurveyService.tsx";
import type {surveyStatus} from "./SurveyUpdatePage.tsx";
import {getUserTeam} from "../../services/TeamService.tsx";

interface Survey {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    status: "Aktiv" | "Entwurf" | "Vorbereitet" | "Geschlossen";
    mode?: "adaptiv" | "design";
    instances?: {
        id: number;
        surveyId: number;
        name: string;
        validFrom: string;
        validTo: string;
    }[];
    hasActiveInstance?: boolean;
    isTwoTier: boolean;
    teacherAssigned: boolean;
}

const DashboardPage = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<Survey["status"] | "ALL">("ALL");
    const [teamId, setTeamId] = useState<number | null>(null);

    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});
    const [newSurvey, setNewSurvey] = useState<{ title: string; description: string; fromDate: string; toDate: string; mode: "design" | "adaptiv"; isTwoTier: boolean }>({title: "", description: "", fromDate: "", toDate: "", mode: "design", isTwoTier: false});

    useEffect(() => {
        const loadTeam = async () => {
            try {
                const team = await getUserTeam();
                setTeamId(team.id);
            } catch {
                setTeamId(null);
            }
        };

        loadTeam();
    }, []);

    const handleCreateSurvey = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreating(true);
        try {
            const payload = {
                title: newSurvey.title,
                description: newSurvey.description,
                mode: newSurvey.mode,
                status: "IN_PROGRESS" as surveyStatus,
                isTwoTier: newSurvey.isTwoTier
            };

            const created = await createSurvey(payload);
            const survey: Survey = {
                id: created.id.toString(),
                title: created.title,
                description: created.description || "",
                createdAt: created.createdAt,
                status: mapStatus(created.status ?? "IN_PROGRESS"),
                mode: newSurvey.mode,
                isTwoTier: created.isTwoTier,
                teacherAssigned: false
            };
            setSurveys([survey, ...surveys]);
            setSnackbar({open: true, message: "Erhebung erfolgreich erstellt!", severity: "success",});
            setNewSurvey({title: "", description: "", fromDate: "", toDate: "", mode: "design", isTwoTier: false});
            setIsDialogOpen(false);
        } catch (err) {
            console.log(err);
            setSnackbar({open: true, message: "Fehler beim Erstellen der Erhebung.", severity: "error",});
        } finally {
            setCreating(false);
        }
    };

    const getStatusColor = (status: Survey["status"]) => {
        switch (status) {
            case "Aktiv":
                return "info";
            case "Entwurf":
                return "default";
            case "Vorbereitet":
                return "primary";
            case "Geschlossen":
                return "secondary";
            default:
                return "default";
        }
    };

    const getStatusInfo = (status: Survey["status"]) => {
        switch (status) {
            case "Aktiv":
                return "Die Erhebung hat eine aktive Durchführung und läuft aktuell.";
            case "Entwurf":
                return "Es ist noch kein Booklet für die Erhebung erfasst.";
            case "Vorbereitet":
                return "Die Erhebung ist vorbereitet und es können Durchführungen erstellt werden.";
            case "Geschlossen":
                return "Die Erhebung ist abgeschlossen und es können keine Durchführungen erstellt werden.";
            default:
                return "";
        }
    };

    const mapStatus = (status: surveyStatus): Survey["status"] => {
        switch (status) {
            case "ACTIVE":
                return "Aktiv";
            case "PREPARED":
                return "Vorbereitet";
            case "IN_PROGRESS":
                return "Entwurf";
            case "FINISHED":
                return "Geschlossen";
            default:
                return "Entwurf";
        }
    };

    useEffect(() => {
        const fetchSurveys = async () => {
            setLoading(true);
            try {
                const existingSurveys = await getSurveys();
                setSurveys(
                    existingSurveys.map((s) => {
                        return {
                            id: s.id.toString(),
                            title: s.title,
                            description: s.description || "",
                            createdAt: s.createdAt,
                            status: mapStatus(s.status ?? "IN_PROGRESS"),
                            mode: s.mode.toLowerCase() as "adaptiv" | "design",
                            instances: s.instances,
                            hasActiveInstance: s.hasActiveInstance,
                            isTwoTier: s.isTwoTier,
                            teacherAssigned: s.teacherAssigned
                        };
                    })
                );
            } catch (err) {
                console.error("Failed to load surveys:", err);
                setSnackbar({
                    open: true,
                    message: "Fehler beim Laden der Erhebungen.",
                    severity: "error",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSurveys();
    }, []);

    if (!loading && teamId === null) {
        return (
            <MainLayout>
                <Box textAlign="center" py={10}>
                    <Typography variant="h5">
                        Kein Team gefunden
                    </Typography>

                    <Typography color="text.secondary" mt={1}>
                        Sie sind aktuell keinem Team zugeordnet. Bitte kontaktieren Sie einen Team Administrator, um Zugriff zu erhalten.
                    </Typography>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ minHeight: "100vh", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">Erhebungs Übersicht</Typography>
                        <Typography color="textSecondary">
                            Erstelle und bearbeite Erhebungen
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} alignItems="center">
                        <Button variant="contained" startIcon={<Add />} onClick={() => setIsDialogOpen(true)}>
                            Neue Erhebung
                        </Button>
                    </Box>
                </Box>
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Serie" onChange={(e) => setStatusFilter(e.target.value as Survey["status"] | "ALL")}>
                            <MenuItem value="ALL">Alle</MenuItem>
                            <MenuItem value="Aktiv">Aktiv</MenuItem>
                            <MenuItem value="Entwurf">Entwurf</MenuItem>
                            <MenuItem value="Vorbereitet">Vorbereitet</MenuItem>
                            <MenuItem value="Geschlossen">Geschlossen</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                    <DialogTitle>Erhebung erstellen</DialogTitle>
                    <form onSubmit={handleCreateSurvey}>
                        <DialogContent sx={{ pt: 0 }}>
                            <TextField label="Titel" fullWidth required margin="normal" value={newSurvey.title} onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}/>
                            <TextField label="Beschreibung" fullWidth required multiline rows={4} margin="normal" value={newSurvey.description} onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}/>
                            <Typography variant="subtitle1" gutterBottom>
                                Modus
                            </Typography>
                            <RadioGroup row value={newSurvey.mode} onChange={(e) =>
                                setNewSurvey({
                                    ...newSurvey,
                                    mode: e.target.value as "design" | "adaptiv",
                                })}>
                                <FormControlLabel value="design" control={<Radio />} label="Design Matrix"/>
                                <FormControlLabel value="adaptiv" control={<Radio />} label="Adaptiver Test"/>
                            </RadioGroup>
                            <Typography variant="subtitle1" gutterBottom>
                                Zweistufiger Test
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch checked={newSurvey.isTwoTier}
                                        onChange={(e) =>
                                            setNewSurvey({...newSurvey, isTwoTier: e.target.checked,})}/>
                                } label={newSurvey.isTwoTier ? "Ja" : "Nein"}/>
                        </DialogContent>
                        <DialogActions>
                            <Button variant="outlined" onClick={() => setIsDialogOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button type="submit" variant="contained" disabled={creating}>
                                {creating ? "Erstellen..." : "Erstellen"}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : surveys.length === 0 ? (
                    <Box textAlign="center" py={12}>
                        <BarChart fontSize="large" color="disabled" />
                        <Typography variant="h6" mt={2}>Noch keine Erhebungen</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => setIsDialogOpen(true)}>Erhebung erstellen</Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {surveys.filter((s) => statusFilter === "ALL" || s.status === statusFilter).map((survey) => (
                            //@ts-ignore
                            <Grid item key={survey.id} sx={{ width: 350, flexGrow: 0 }}>
                                <Card>
                                    <CardHeader
                                        title={survey.title}
                                        subheader={<Box display="flex" gap={1}>
                                            <Tooltip title={getStatusInfo(survey.status)} arrow>
                                                <Chip label={survey.status} color={getStatusColor(survey.status)} size="small" sx={{ cursor: "help" }}/>
                                            </Tooltip>
                                            {survey.hasActiveInstance && (<Tooltip title={"Es ist eine laufende Durchführung vorhanden. Es können keine Änderungen an Booklets vorgenommen werden."} arrow>
                                                    <Chip label="Aktive Durchführungen" color="info" size="small" sx={{ cursor: "help" }}/></Tooltip>)}</Box>}/>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" fontSize="0.875rem">
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <CalendarToday fontSize="small" /> {"Erstellt am "}
                                                {new Date(survey.createdAt).toLocaleDateString()}
                                            </Box>
                                        </Box>
                                        <Box  mt={1}>
                                            <Chip
                                                label={survey.mode === "adaptiv" ? "Adaptiver Test" : "Design Matrix"}
                                                color={survey.mode === "adaptiv" ? "default" : "default"}
                                                size="small"
                                            />
                                            {survey.isTwoTier && (<Chip label="Zweistufig" size="small"/>)}
                                            {survey.teacherAssigned && (<Tooltip title={"Die Erhebung wurde an Klassen verteilt"} arrow>
                                                <Chip label="Lehrpersonen zugewiesen" color="default" size="small" sx={{ cursor: "help" }}/></Tooltip>)}
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" variant="outlined" fullWidth onClick={() => navigate(`/survey/${survey.id}`)}>
                                            Bearbeiten
                                        </Button>
                                        <Button size="small" variant="contained" fullWidth onClick={() => navigate(`/survey/details/${survey.id}`)}>
                                            Durchführungen
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled" sx={{ width: "100%" }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </MainLayout>
    );
};

export default DashboardPage;
