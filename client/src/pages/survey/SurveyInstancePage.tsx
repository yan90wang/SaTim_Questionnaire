import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {
    Alert,
    Box,
    Button, Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider, FormControlLabel, FormGroup,
    Grid,
    LinearProgress,
    Paper,
    Snackbar,
    TextField, Tooltip,
    Typography
} from "@mui/material";
import MainLayout from "../../layouts/MainLayout.tsx";
import {
    createSurveyInstance,
    getSurveyById, getSurveyExport,
    getSurveyInstances,
    updateSurveyInstance
} from "../../services/SurveyService.tsx";
import dayjs, {Dayjs} from "dayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {Add, FileDownload} from "@mui/icons-material";
import type {surveyStatus} from "./SurveyUpdatePage.tsx";

interface UserRef {
    id: number;
    first_name: string;
    last_name: string;
}

interface SurveyDetail {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: UserRef;
    updatedBy: UserRef;
    status: surveyStatus;
    mode: "DESIGN" | "ADAPTIV";
    booklet?: { id: number }[];
    hasBooklet?: boolean;
    knowledgeSpaceFileUrl?: string;
    probabilityDistributionFileUrl?: string | null;
    adaptiveThreshold?: number | null;
}

interface SurveyInstance {
    id: number;
    name: string;
    validFrom: string;
    validTo: string;
    bookletVersion: number;
}

interface NewInstanceInput {
    name: string;
    validFrom: Dayjs | null;
    validTo: Dayjs | null;
}
const SurveyInstancePage = () => {
    const { id } = useParams<{ id: string }>();

    const [survey, setSurvey] = useState<SurveyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false,
        message: "",
        severity: "success",
    });

    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [instances, setInstances] = useState<SurveyInstance[]>([]);
    const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
    const [newInstance, setNewInstance] = useState<NewInstanceInput>({ name: "", validFrom: null, validTo: null });
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editInstance, setEditInstance] = useState<SurveyInstance | null>(null);
    const [editData, setEditData] = useState<NewInstanceInput>({
        name: "",
        validFrom: null,
        validTo: null
    });
    const [instanceFilter, setInstanceFilter] = useState<"ALL" | "ACTIVE" | "FUTURE" | "PAST">("ALL");
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [selectedForExport, setSelectedForExport] = useState<number[]>([]);

    useEffect(() => {
        fetchSurvey();
    }, [id]);

    const fetchSurvey = async () => {
        if (!id) return;
        try {
            const data = await getSurveyById(id);
            setSurvey({
                id: data.id,
                title: data.title,
                description: data.description ?? "",
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdBy ?? { id: 0, first_name: "Unbekannt", last_name: "" },
                updatedBy: data.updatedBy ?? { id: 0, first_name: "Unbekannt", last_name: "" },
                status: (data.status ?? "IN_PROGRESS") as surveyStatus,
                mode: data.mode?.toUpperCase() === "ADAPTIV" ? "ADAPTIV" : "DESIGN",
                booklet: data.booklet,
                hasBooklet: data.hasBooklet,
                knowledgeSpaceFileUrl: data.knowledgeSpaceFileUrl,
                probabilityDistributionFileUrl: data.probabilityDistributionFileUrl ?? null,
                adaptiveThreshold: data.adaptiveThreshold ?? null,
            });

            const inst = await getSurveyInstances(data.id);
            setInstances(inst);
        } catch (err) {
            setSnackbar({ open: true, message: "Erhebung konnte nicht geladen werden.", severity: "error" });
            console.error("Failed to fetch survey:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenLinkDialog = (instance: SurveyInstance) => {
        const url = `${window.location.origin}/quiz/${instance.id}?freeParam=`;
        setGeneratedLink(url);
        setLinkDialogOpen(true);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setSnackbar({ open: true, message: "Link kopiert!", severity: "success" });
        } catch {
            setSnackbar({ open: true, message: "Fehler beim Kopieren des Links.", severity: "error" });
        }
    };

    const handleCreateInstance = async () => {
        if (!survey || !newInstance.name || !newInstance.validFrom || !newInstance.validTo) {
            setSnackbar({ open: true, message: "Bitte alle Felder ausfüllen.", severity: "error" });
            return;
        }
        if (newInstance.validTo.isBefore(newInstance.validFrom)) {
            setSnackbar({ open: true, message: "Das Enddatum muss nach dem Startdatum liegen.", severity: "error" });
            return;
        }
        setLoading(true);
        try {
            await createSurveyInstance(survey.id, {
                name: newInstance.name,
                validFrom: newInstance.validFrom.toISOString(),
                validTo: newInstance.validTo.toISOString(),
            });
            setSnackbar({ open: true, message: "Test Durchführung erfolgreich erstellt.", severity: "success" });
            setInstanceDialogOpen(false);
            setNewInstance({ name: "", validFrom: null, validTo: null });
            await fetchSurvey();
        } catch (err) {
            console.error("Failed to create instance:", err);
            setSnackbar({ open: true, message: "Fehler beim Erstellen der Durchführung.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInstance = async () => {
        if (!survey || !editInstance) return;

        if (!editData.name || !editData.validFrom || !editData.validTo) {
            setSnackbar({ open: true, message: "Bitte alle Felder ausfüllen.", severity: "error" });
            return;
        }

        if (editData.validTo.isBefore(editData.validFrom)) {
            setSnackbar({ open: true, message: "Das Enddatum muss nach dem Startdatum liegen.", severity: "error" });
            return;
        }

        setLoading(true);
        try {
            await updateSurveyInstance(editInstance.id, {
                name: editData.name,
                validFrom: editData.validFrom.toISOString(),
                validTo: editData.validTo.toISOString(),
            });

            setSnackbar({ open: true, message: "Durchführung aktualisiert.", severity: "success" });
            setEditDialogOpen(false);
            setEditInstance(null);

            await fetchSurvey();
        } catch (err) {
            console.error("Failed to update instance:", err);
            setSnackbar({ open: true, message: "Fehler beim Aktualisieren.", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExport = (id: number) => {
        setSelectedForExport((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleExport = async () => {
        if (selectedForExport.length === 0) {
            setSnackbar({ open: true, message: "Bitte mindestens eine Durchführung auswählen.", severity: "error" });
            return;
        }
        try {
            setLoading(true);
            const fileBlob = await getSurveyExport(selectedForExport, survey!.id);
            const url = window.URL.createObjectURL(fileBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Erhebung_Export_${survey!.title}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setSnackbar({ open: true, message: "Export erfolgreich gestartet!", severity: "success" });
            setExportDialogOpen(false);
            setSelectedForExport([]);
        } catch (err: any) {
            console.error(err);
            setSnackbar({ open: true, message: `Export fehlgeschlagen: ${err.message}`, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LinearProgress />;
    if (!survey) return <Typography>Survey not found</Typography>;

    return (
        <MainLayout>
            <Box sx={{ minHeight: "100vh", py: 3, px: 2, mt: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                <Paper sx={{ p: 3 }}>
                        <Typography variant="h5" gutterBottom>Durchführungen</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Tooltip
                        title={
                            survey.status === "FINISHED"
                                ? "Die Erhebung wurde bereits geschlossen, es können keine Durchführungen mehr angelegt werden."
                                : survey.mode === "ADAPTIV" && !survey.knowledgeSpaceFileUrl
                                    ? "Vor der Erstellung muss ein Knowledge Space hochgeladen werden."
                                    : survey.mode === "ADAPTIV" && !survey.probabilityDistributionFileUrl
                                        ? "Vor der Erstellung muss eine Wahrscheinlichkeitsverteilung hochgeladen werden."
                                        : survey.mode === "ADAPTIV" &&
                                        (survey.adaptiveThreshold === null ||
                                            survey.adaptiveThreshold === undefined)
                                            ? "Vor der Erstellung muss ein Abbruch Threshold festgelegt werden."
                                            : survey.mode === "DESIGN" && !survey.hasBooklet
                                                ? "Vor der Erstellung muss eine Design-Matrix (Booklet) hochgeladen werden."
                                                : ""
                        } arrow>
                        <span>
                            <Button
                                disabled={survey.status === "FINISHED" || (survey.mode === "ADAPTIV" && (
                                    !survey.knowledgeSpaceFileUrl ||
                                    !survey.probabilityDistributionFileUrl ||
                                    survey.adaptiveThreshold === null ||
                                    survey.adaptiveThreshold === undefined
                                )) || (survey.mode === "DESIGN" && !survey.hasBooklet)}
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={() => setInstanceDialogOpen(true)}>
                                Neue Durchführung erstellen
                            </Button>
                        </span>
                    </Tooltip>
                    <Button sx={{ ml: 2 }}  variant="contained" color="primary" startIcon={<FileDownload />} onClick={() => setExportDialogOpen(true)} disabled={instances.length === 0}>
                        Ergebnisse Exportieren
                    </Button>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "flex", mb: 2 }}>
                        <TextField select label="Status filtern" value={instanceFilter} onChange={(e) => setInstanceFilter(e.target.value as any)} SelectProps={{ native: true }} size="small" sx={{ width: 200 }}>
                            <option value="ALL">Alle</option>
                            <option value="ACTIVE">Aktiv</option>
                            <option value="FUTURE">Zukünftig</option>
                            <option value="PAST">Vergangen</option>
                        </TextField>
                    </Box>
                    <Divider sx={{ my: 2 }} />

                    {instances.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Keine Durchführungen vorhanden.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {instances.filter((inst) => {
                                const now = dayjs();
                                const from = dayjs(inst.validFrom);
                                const to = dayjs(inst.validTo);

                                if (instanceFilter === "FUTURE") return now.isBefore(from);
                                if (instanceFilter === "PAST") return now.isAfter(to);
                                if (instanceFilter === "ACTIVE") return now.isAfter(from) && now.isBefore(to);
                                return true;
                            }).map((inst) => {
                                const now = dayjs();
                                const from = dayjs(inst.validFrom);
                                const to = dayjs(inst.validTo);

                                let chipLabel: string;
                                let chipColor: "success" | "info" | "default" | undefined;

                                if (now.isBefore(from)) {
                                    chipLabel = "Zukünftig";
                                    chipColor = "info";
                                } else if (now.isAfter(to)) {
                                    chipLabel = "Vergangen";
                                    chipColor = "default";
                                } else {
                                    chipLabel = "Aktiv";
                                    chipColor = "success";
                                }
                                return (
                                    <Grid size={{ xs: 12, sm: 4 }} key={inst.id}>
                                        <Paper sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {inst.name}
                                                </Typography>
                                                <Chip label={chipLabel} color={chipColor} sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}/>
                                            </Box>
                                            <Typography variant="body2">
                                                Von: {from.format("DD.MM.YYYY")} — Bis: {to.format("DD.MM.YYYY")}
                                            </Typography>
                                            <Typography variant="body2">
                                               Booklet Version: {inst.bookletVersion}
                                            </Typography>
                                            <Button size="small" variant="contained" onClick={() => handleOpenLinkDialog(inst)}>
                                                Test URL generieren
                                            </Button>
                                            <Button size="small" variant="outlined" onClick={() => {
                                                setEditInstance(inst);
                                                setEditData({
                                                    name: inst.name,
                                                    validFrom: dayjs(inst.validFrom),
                                                    validTo: dayjs(inst.validTo)
                                                });
                                                setEditDialogOpen(true);}}>
                                                Bearbeiten
                                            </Button>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Paper>
                <Dialog open={instanceDialogOpen} onClose={() => setInstanceDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Neue Durchführung erstellen</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} mt={1}>
                            <TextField
                                label="Name"
                                fullWidth
                                value={newInstance.name}
                                onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                            />
                            <DatePicker
                                label="Gültig von"
                                value={newInstance.validFrom}
                                onChange={(date) =>
                                    setNewInstance({
                                        ...newInstance,
                                        validFrom: date ? date.startOf("day") : null,
                                    })
                                }
                            />
                            <DatePicker
                                label="Gültig bis"
                                value={newInstance.validTo}
                                onChange={(date) =>
                                    setNewInstance({
                                        ...newInstance,
                                        validTo: date ? date.endOf("day") : null,
                                    })
                                }
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setInstanceDialogOpen(false)}>Abbrechen</Button>
                        <Button
                            variant="contained"
                            onClick={handleCreateInstance}
                            disabled={!newInstance.name || !newInstance.validFrom || !newInstance.validTo || loading}>
                            {loading ? "Speichern..." : "Erstellen"}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Test Durchführung-Link</DialogTitle>
                    <DialogContent>
                        <Typography gutterBottom>
                            Diesen Link kannst du teilen, um die Umfrage aufzurufen:
                        </Typography>
                        <TextField fullWidth value={generatedLink} onChange={(e) => setGeneratedLink(e.target.value)} sx={{ mt: 1 }}/>
                        <Typography  color="text.secondary">
                            Den "freeParam" kannst du benutzen um innerhalb eine Durchführungen Antworten zu kennzeichnen (z.B freeParam=Lehrer).
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLinkDialogOpen(false)}>Schließen</Button>
                        <Button variant="contained" onClick={handleCopyLink}>Kopieren</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Durchführung bearbeiten</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} mt={1}>
                            <TextField label="Name" fullWidth value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}/>
                            <DatePicker label="Gültig von" value={editData.validFrom} onChange={(date) => setEditData({ ...editData, validFrom: date })}/>
                            <DatePicker label="Gültig bis" value={editData.validTo} onChange={(date) => setEditData({ ...editData, validTo: date })}/>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Abbrechen</Button>
                        <Button variant="contained" onClick={handleUpdateInstance} disabled={!editData.name || !editData.validFrom || !editData.validTo || loading}>
                            {loading ? "Speichern..." : "Aktualisieren"}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Ergebnisse Exportieren</DialogTitle>
                    <DialogContent>
                        {instances.length === 0 ? (
                            <Typography variant="body2">Keine Durchführungen verfügbar.</Typography>
                        ) : (
                            <>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        if (selectedForExport.length === instances.length) {
                                            setSelectedForExport([]);
                                        } else {
                                            setSelectedForExport(instances.map(inst => inst.id));
                                        }
                                    }}
                                    sx={{ mb: 2 }}
                                    variant="outlined">
                                    {selectedForExport.length === instances.length ? "Alle abwählen" : "Alle hinzufügen"}
                                </Button>
                                <FormGroup>
                                    {instances.map((inst) => (
                                        <FormControlLabel
                                            key={inst.id}
                                            control={
                                                <Checkbox
                                                    checked={selectedForExport.includes(inst.id)}
                                                    onChange={() => handleToggleExport(inst.id)}
                                                />
                                            }
                                            label={`${inst.name} (${dayjs(inst.validFrom).format("DD.MM.YYYY")} — ${dayjs(inst.validTo).format("DD.MM.YYYY")})`}
                                        />
                                    ))}
                                </FormGroup>
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setExportDialogOpen(false)}>Abbrechen</Button>
                        <Button variant="contained" onClick={handleExport} disabled={selectedForExport.length === 0}>
                            Exportieren
                        </Button>
                    </DialogActions>
                </Dialog>
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </MainLayout>
    );
};

export default SurveyInstancePage;
