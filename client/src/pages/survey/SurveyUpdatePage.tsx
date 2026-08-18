import {useNavigate, useParams} from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    LinearProgress,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import MainLayout from "../../layouts/MainLayout.tsx";
import {
    assignSurveyToTeachers,
    type Booklet,
    getQuestionDetailsByIds,
    getQuestionsByIds,
    getSurveyBooklets,
    getSurveyById,
    updateSurvey,
    uploadKnowledgeSpace,
    uploadProbabilityDistribution,
    uploadSurveyExcels
} from "../../services/SurveyService.tsx";
import {FileDownload} from "@mui/icons-material";
import {useEffect, useRef, useState} from "react";
import html2pdf from "html2pdf.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import QuestionPdfPreview from "./QuestionPdfPreview.tsx";
import { UploadFile, Download } from "@mui/icons-material";
export type surveyStatus = "ACTIVE" | "PREPARED" | "IN_PROGRESS" | "FINISHED";

interface UserRef {
    id: number;
    first_name: string;
    last_name: string;
}

interface Question {
    id: number;
    contentJson: any;
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
    file1?: File | null;
    file2?: File | null;
    hasActiveInstance?: boolean;
    isTwoTier: boolean;
    teacherAssigned: boolean;
    knowledgeSpaceFileUrl?: string | null;
    probabilityDistributionFileUrl?: string | null;
    adaptiveThreshold?: number | null;
}

const statusLabels: Record<SurveyDetail["status"], string> = {
    IN_PROGRESS: "Entwurf",
    PREPARED: "Vorbereitet",
    ACTIVE: "Aktiv",
    FINISHED: "Geschlossen",
};

const SurveyUpdatePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState<SurveyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [file1, setFile1] = useState<File | null>(null);
    const [file2, setFile2] = useState<File | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false,
        message: "",
        severity: "success",
    });
    const [booklets, setBooklets] = useState<Booklet[]>([]);
    const [bookletDialogOpen, setBookletDialogOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    const [preparingExport, setPreparingExport] = useState(false);
    const [excelExport, setExcelExport] = useState(false);
    const [exportProgress, setExportProgress] = useState<{ open: boolean; current: number; total: number; }>({open: false, current: 0, total: 0,});
    const [exportQuestion, setExportQuestion] = useState<Question | null>(null);
    const [knowledgeSpaceFile, setKnowledgeSpaceFile] = useState<File | null>(null);
    const [uploadingKnowledgeSpace, setUploadingKnowledgeSpace] = useState(false);
    const [probabilityDistributionFile, setProbabilityDistributionFile] = useState<File | null>(null);
    const [uploadingProbabilityDistribution, setUploadingProbabilityDistribution] = useState(false);

    useEffect(() => {
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
                    createdBy: data.createdBy
                        ? { id: data.createdBy.id, first_name: data.createdBy.first_name, last_name: data.createdBy.last_name }
                        : { id: 0, first_name: "Unbekannt", last_name: "" },
                    updatedBy: data.updatedBy
                        ? { id: data.updatedBy.id, first_name: data.updatedBy.first_name, last_name: data.updatedBy.last_name }
                        : { id: 0, first_name: "Unbekannt", last_name: "" },
                    status: (data.status ?? "IN_PROGRESS") as surveyStatus,
                    mode: data.mode?.toUpperCase() === "ADAPTIV" ? "ADAPTIV" : "DESIGN",
                    file1: null,
                    file2: null,
                    hasActiveInstance: data.hasActiveInstance,
                    isTwoTier: data.isTwoTier,
                    teacherAssigned: data.teacherAssigned,
                    knowledgeSpaceFileUrl: data.knowledgeSpaceFileUrl ?? null,
                    probabilityDistributionFileUrl: data.probabilityDistributionFileUrl ?? null,
                    adaptiveThreshold: data.adaptiveThreshold ?? null
                });
            } catch (err) {
                console.error("Failed to fetch survey:", err);
                setSnackbar({ open: true, message: "Erhebung konnte nicht geladen werden.", severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchSurvey();
    }, [id]);

    const handleSaveFiles = async () => {
        setSaving(true);
        if (!survey || !file1 || !file2) {
            setSaving(false);
            return;
        }
        try {
            await uploadSurveyExcels(survey.id.toString(), file1, file2);
            setSnackbar({ open: true, message: "Dateien erfolgreich hochgeladen.", severity: "success" });
            setUploadDialogOpen(false);
            setSurvey({ ...survey, file1, file2 });
        } catch (err: any) {
            if (err?.details) {
                setValidationErrors(err.details);
                setUploadDialogOpen(false);
                setErrorDialogOpen(true);
            } else {
                setSnackbar({open: true, message: "Fehler beim Hochladen der Dateien.", severity: "error"});
            }
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!survey) return;

        const fetchBooklets = async () => {
            try {
                const data = await getSurveyBooklets(survey.id.toString());
                setBooklets(data);
            } catch (err) {
                console.log(err);
                setSnackbar({ open: true, message: "Booklets konnten nicht geladen werden.", severity: "error" });
            }
        };

        fetchBooklets();
    }, [survey]);

    const handleSaveChanges = async () => {
        if (!survey) return;
        setSaving(true);
        try {
            await updateSurvey(survey.id.toString(), {
                title: survey.title,
                description: survey.description,
                status: survey.status,
                adaptiveThreshold: survey.mode === "ADAPTIV" ? survey.adaptiveThreshold : null,
            });
            setSnackbar({ open: true, message: "Änderungen erfolgreich gespeichert.", severity: "success" });
        } catch (err) {
            console.error("Failed to update survey:", err);
            setSnackbar({ open: true, message: "Fehler beim Speichern der Änderungen.", severity: "error" });
        } finally {
            setSaving(false);
        }
    };

    const uniqueQuestionCount = Array.from(new Set(booklets.flatMap(b => b.bookletQuestion.map(q => q.id)))).length;

    const handleExportClick = async () => {
        if (!survey) return;
        try {
            setPreparingExport(true);
            const uniqueQuestionIds = Array.from(
                new Set(
                    booklets.flatMap(b =>
                        b.bookletQuestion.map(q => q.questionId)
                    )
                )
            );
            const questions = await getQuestionsByIds(uniqueQuestionIds);
            await document.fonts.ready;
            const zip = new JSZip();
            setExportProgress({
                open: true,
                current: 0,
                total: questions.length,
            });
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                setExportProgress({
                    open: true,
                    current: i + 1,
                    total: questions.length,
                });
                setExportQuestion(question);
                await new Promise(resolve => requestAnimationFrame(resolve));
                await new Promise(resolve => setTimeout(resolve, 150));
                const el = exportRef.current;
                if (!el) {
                    continue;
                }
                const pdfBlob = await html2pdf()
                    .set({
                        margin: 10,
                        filename: `Question_${question.id}.pdf`,
                        html2canvas: {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: "#ffffff",
                        },
                        jsPDF: {
                            unit: "mm",
                            format: "a4",
                        },
                    })
                    .from(el)
                    .outputPdf("blob");

                const folder = zip.folder(`Question_${question.id}`);

                folder?.file(
                    `Question_${question.id}.pdf`,
                    pdfBlob
                );

                folder?.file(
                    `Question_${question.id}.json`,
                    JSON.stringify(question.contentJson, null, 2)
                );

                folder?.file(
                    `Question_${question.id}.html`,
                    question.contentHtml
                );
            }

            setExportQuestion(null);
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9,
                },
            });

            saveAs(
                zipBlob,
                `${survey.title}_Questions.zip`
            );

            setExportProgress({
                open: false,
                current: 0,
                total: 0,
            });

            setSnackbar({
                open: true,
                severity: "success",
                message: `${questions.length} Aufgaben erfolgreich exportiert.`,
            });

        } catch (err) {
            console.error(err);
            setExportProgress({
                open: false,
                current: 0,
                total: 0,
            });

            setSnackbar({
                open: true,
                severity: "error",
                message: "Fehler beim Exportieren.",
            });
        } finally {
            setExportQuestion(null);
            setPreparingExport(false);

        }
    };

    const handleExcelExportClick = async () => {
        try {
            if (!survey) return;
            setExcelExport(true);
            const uniqueQuestionIds = Array.from(
                new Set(
                    booklets.flatMap(b =>
                        b.bookletQuestion.map(q => q.questionId)
                    )
                )
            );
            const blob = await getQuestionDetailsByIds(uniqueQuestionIds, survey.title, survey.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = survey?.title+"_Aufgaben.xlsx";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.log(err);
            setSnackbar({
                open: true,
                message: "Fehler beim Laden der Aufgaben Details.",
                severity: "error",
            });
        } finally {
            setExcelExport(false);
        }
    };

    const handleSurveyAssignmentClick = async () => {
        try {
            if (!survey) return;
            const teacherAssigned = !survey.teacherAssigned;
            await assignSurveyToTeachers(survey.id, teacherAssigned);
            setSurvey((prev) => {
                if (!prev) {
                    return prev;
                }

                return {
                    ...prev,
                    teacherAssigned: !prev.teacherAssigned,
                };
            });
            if (teacherAssigned) {
                setSnackbar({
                    open: true,
                    message: "Test wurde den Lehrpersonen zugewiesen.",
                    severity: "success",
                });
            } else {
                setSnackbar({
                    open: true,
                    message: "Zuweisung wurde entfernt.",
                    severity: "success",
                });
            }

        } catch (error) {
            console.error(error);

            setSnackbar({
                open: true,
                message: "Test konnte nicht zugewiesen werden.",
                severity: "error",
            });
        }
    };

    const handleKnowledgeSpaceUpload = async () => {
        if (!survey || !knowledgeSpaceFile) {
            return;
        }
        setUploadingKnowledgeSpace(true);
        try {
            const result = await uploadKnowledgeSpace(survey.id.toString(), knowledgeSpaceFile);

            setSurvey((prev) => {
                if (!prev) return prev;
                return {...prev, knowledgeSpaceFileUrl: result?.knowledgeSpaceFileUrl ?? prev.knowledgeSpaceFileUrl,};
            });

            setSnackbar({open: true, message: "Knowledge Space erfolgreich hochgeladen.", severity: "success",});
            setKnowledgeSpaceFile(null);

        } catch (err: any) {
            console.error("Knowledge Space upload failed:", err);
            setSnackbar({open: true, message: err?.response?.data?.message ?? "Fehler beim Hochladen des Knowledge Space.", severity: "error",});
        } finally {
            setUploadingKnowledgeSpace(false);
        }
    };

    const handleProbabilityDistributionUpload = async () => {
        if (!survey || !probabilityDistributionFile) {return;}
        setUploadingProbabilityDistribution(true);
        try {
            const result = await uploadProbabilityDistribution(survey.id.toString(), probabilityDistributionFile);

            setSurvey(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    probabilityDistributionFileUrl:
                        result?.probabilityDistributionFileUrl ??
                        prev.probabilityDistributionFileUrl,
                };
            });

            setSnackbar({open: true, message: "Wahrscheinlichkeitsverteilung erfolgreich hochgeladen.", severity: "success",});
            setProbabilityDistributionFile(null);

        } catch (err: any) {
            console.error("Probability distribution upload failed:", err);
            setSnackbar({open: true, message: err?.response?.data?.message ?? "Fehler beim Hochladen der Wahrscheinlichkeitsverteilung.", severity: "error",});
        } finally {
            setUploadingProbabilityDistribution(false);
        }
    };

    const handleSaveAdaptiveThreshold = async () => {
        if (!survey) return;
        setSaving(true);
        try {
            await updateSurvey(survey.id.toString(), {adaptiveThreshold: survey.adaptiveThreshold,});
            setSnackbar({open: true, message: "Abbruch Threshold erfolgreich gespeichert.", severity: "success",});
        } catch (err) {
            console.error("Failed to update adaptive threshold:", err);
            setSnackbar({open: true, message: "Fehler beim Speichern des Thresholds.", severity: "error",});
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LinearProgress />;
    if (!survey) return <Typography>Survey not found</Typography>;

    return (
        <MainLayout>
            <Box sx={{ minHeight: "100vh", py: 3, px: 2, mt: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Erhebung Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle1"><strong>Titel:</strong> {survey.title}</Typography>
                    <Typography variant="subtitle1"><strong>Status:</strong> {statusLabels[survey.status]}</Typography>
                    <Typography variant="subtitle1"><strong>Modus:</strong> {survey.mode}</Typography>
                    <Typography variant="subtitle1"><strong>Zweistufig:</strong> {survey.isTwoTier ? "Ja": "Nein"}</Typography>
                    <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>Beschreibung:</strong></Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{survey.description}</Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1">
                        <strong>Erstellt von:</strong> {survey.createdBy.first_name} {survey.createdBy.last_name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        <strong>Erstellt am:</strong> {new Date(survey.createdAt).toLocaleString()}
                    </Typography>

                    <Typography variant="subtitle1">
                        <strong>Zuletzt geändert von:</strong> {survey.updatedBy.first_name} {survey.updatedBy.last_name}
                    </Typography>
                    <Typography variant="subtitle1">
                        <strong>Zuletzt geändert am:</strong> {new Date(survey.updatedAt).toLocaleString()}
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ pb: 3 }}  gutterBottom>
                        Erhebung bearbeiten
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Titel"
                                fullWidth
                                value={survey.title}
                                onChange={(e) => setSurvey({ ...survey, title: e.target.value })}/>
                        </Grid>

                        {survey.status === "PREPARED" && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField select label="Status" fullWidth value={survey.status} onChange={(e) => setSurvey({ ...survey, status: e.target.value as surveyStatus })}>
                                    <MenuItem value="PREPARED">Vorbereitet</MenuItem>
                                    <MenuItem value="FINISHED">Geschlossen</MenuItem>
                                </TextField>
                            </Grid>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <TextField label="Beschreibung" fullWidth multiline rows={4} value={survey.description} onChange={(e) => setSurvey({ ...survey, description: e.target.value })}/>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                                <Button variant="outlined" onClick={() => navigate(-1)}>
                                    Zurück
                                </Button>
                                <Button variant="contained" onClick={handleSaveChanges} disabled={saving}>
                                    {saving ? "Speichern..." : "Änderungen speichern"}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {survey.mode === "ADAPTIV" && (
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h5">
                            Adaptive Einstellungen
                        </Typography>
                        <Typography color="text.secondary" sx={{ pb: 3 }}>
                            Diese Einstellungen sind für adaptive Erhebungen zwingend erforderlich.
                        </Typography>
                        <Divider sx={{ my: 3 }} />
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                            <Box>
                                <Typography variant="h5">
                                    Knowledge Space
                                </Typography>

                                <Typography color="text.secondary"  sx={{ pb: 3 }}>
                                    Excel-Datei mit der Knowledge-Space-Matrix
                                </Typography>
                                <Button variant="outlined" component="label" startIcon={<UploadFile />} disabled={uploadingKnowledgeSpace}>
                                    {uploadingKnowledgeSpace ? "Hochladen..." : survey.knowledgeSpaceFileUrl || knowledgeSpaceFile ? "Ersetzen" : "Excel hochladen"
                                    }
                                    <input hidden type="file" accept=".xlsx,.xls"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];

                                            if (file) {
                                                setKnowledgeSpaceFile(file);
                                            }
                                            e.target.value = "";
                                        }}
                                    />
                                </Button>

                                {survey.knowledgeSpaceFileUrl && (
                                    <Button sx={{ ml: 2 }} variant="outlined" startIcon={<Download />} component="a" href={survey.knowledgeSpaceFileUrl} target="_blank" rel="noopener noreferrer">
                                        KS Excel herunterladen
                                    </Button>
                                )}
                            </Box>
                        </Box>
                        {(knowledgeSpaceFile || survey.knowledgeSpaceFileUrl) && (
                            <Box sx={{mt: 2, p: 1.5, borderRadius: 1, backgroundColor: "action.hover", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,}}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight="bold" noWrap>
                                        {knowledgeSpaceFile ? knowledgeSpaceFile.name : "Knowledge Space Excel"}
                                    </Typography>

                                    {survey.knowledgeSpaceFileUrl && !knowledgeSpaceFile && (
                                        <Typography variant="caption" color="text.secondary">Bereits hochgeladen</Typography>
                                    )}

                                    {knowledgeSpaceFile && (
                                        <Typography variant="caption" color="text.secondary">Neue Datei ausgewählt</Typography>
                                    )}
                                </Box>

                                {knowledgeSpaceFile && (
                                  <Button size="small" variant="contained" onClick={handleKnowledgeSpaceUpload} disabled={uploadingKnowledgeSpace}>
                                        {uploadingKnowledgeSpace ? "Hochladen..." : "Speichern"}
                                    </Button>
                                )}
                            </Box>
                        )}
                        <Divider sx={{ my: 3 }} />
                        <Box>
                            <Divider sx={{ my: 3 }} />

                            <Box>
                                <Typography variant="h5">
                                    Wahrscheinlichkeitsverteilung
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Excel-Datei mit der initialen Wahrscheinlichkeitsverteilung.
                                </Typography>

                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFile />}
                                        disabled={uploadingProbabilityDistribution}
                                    >
                                        {uploadingProbabilityDistribution
                                            ? "Hochladen..."
                                            : survey.probabilityDistributionFileUrl ||
                                            probabilityDistributionFile
                                                ? "Ersetzen"
                                                : "Excel hochladen"
                                        }

                                        <input
                                            hidden
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];

                                                if (file) {
                                                    setProbabilityDistributionFile(file);
                                                }

                                                e.target.value = "";
                                            }}
                                        />
                                    </Button>

                                    {survey.probabilityDistributionFileUrl && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<Download />}
                                            component="a"
                                            href={survey.probabilityDistributionFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Probability Excel herunterladen
                                        </Button>
                                    )}
                                </Box>

                                {(probabilityDistributionFile ||
                                    survey.probabilityDistributionFileUrl) && (
                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 1.5,
                                            borderRadius: 1,
                                            backgroundColor: "action.hover",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 2,
                                        }}
                                    >
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                noWrap
                                            >
                                                {probabilityDistributionFile
                                                    ? probabilityDistributionFile.name
                                                    : "Probability Distribution Excel"}
                                            </Typography>

                                            {survey.probabilityDistributionFileUrl &&
                                                !probabilityDistributionFile && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        Bereits hochgeladen
                                                    </Typography>
                                                )}

                                            {probabilityDistributionFile && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Neue Datei ausgewählt
                                                </Typography>
                                            )}
                                        </Box>

                                        {probabilityDistributionFile && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={handleProbabilityDistributionUpload}
                                                disabled={uploadingProbabilityDistribution}
                                            >
                                                {uploadingProbabilityDistribution
                                                    ? "Hochladen..."
                                                    : "Speichern"}
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </Box>
                            <Divider sx={{ my: 3 }} />
                            <Box>
                                <Typography variant="h5">
                                    Abbruch Threshold
                                </Typography>

                                <TextField
                                    label="Threshold"
                                    type="number"
                                    value={survey.adaptiveThreshold ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (value === "") {
                                            setSurvey(prev =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        adaptiveThreshold: null,
                                                    }
                                                    : prev
                                            );
                                            return;
                                        }

                                        const numberValue = Number(value);

                                        if (numberValue >= 0 && numberValue <= 1) {
                                            setSurvey(prev =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        adaptiveThreshold: numberValue,
                                                    }
                                                    : prev
                                            );
                                        }
                                    }}
                                    slotProps={{htmlInput: {min: 0, max: 1, step: 0.01,},}}
                                    helperText="Schwellenwert zwischen 0 und 1 (z.B. 0.8 = 80%)."
                                    sx={{ maxWidth: 400 }}
                                />

                                <Box sx={{ mt: 2 }}>
                                    <Button variant="contained" onClick={handleSaveAdaptiveThreshold} disabled={saving}>
                                        {saving ? "Speichern..." : "Threshold speichern"}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>

                )}

                {survey.mode === "DESIGN" && (
                <Paper sx={{ p: 3 }}>
                    <Typography sx={{ pb: 3 }} variant="h5" gutterBottom>Aufgaben Zuordnung (Booklet)</Typography>
                    <Tooltip title={survey.hasActiveInstance ? "Die Design-Matrix kann nicht geändert werden, solange aktive Durchführungen existieren." : ""} arrow>
                       <span>
                        <Button disabled={survey.hasActiveInstance || saving} variant="contained" color="primary" onClick={() => {setFile1(null);setFile2(null);setUploadDialogOpen(true);}}>
                            Design-Matrix hochladen
                        </Button></span>
                    </Tooltip>
                </Paper> )}

                {survey.mode === "DESIGN" && booklets.length > 0 && (
                    <Paper sx={{ p: 3 }}>
                        <Typography sx={{ pb: 3 }} variant="h5">Booklets</Typography>
                        <Typography sx={{ pb: 1 }}>Zuvor hochgeladene Booklets werden hier angezeigt. Bei erneutem hochladen der Design-Matrix, werden alte Booklets automatisch gelöscht und die Versions Zahl erhöht.</Typography>
                        <Typography sx={{ pb: 1 }}>
                            {booklets.length > 0 && `Booklet Version: ${booklets[0].version}`}
                        </Typography>
                        <Typography sx={{ pb: 1 }}>  {booklets.length > 0 && `Anzahl Slots: ${uniqueQuestionCount}`}</Typography>
                        <Typography sx={{ pb: 1 }}>  {booklets.length > 0 && `Anzahl Booklets: ${booklets.length}`}</Typography>

                        <Button variant="outlined" sx={{mr: 2}} onClick={() => setBookletDialogOpen(true)}>
                            Booklets anzeigen ({booklets.length})
                        </Button>
                        <Dialog open={bookletDialogOpen} onClose={() => setBookletDialogOpen(false)} fullScreen maxWidth="sm">
                            <DialogTitle>Booklets</DialogTitle>
                            <DialogContent>
                                {booklets.map((b) => (
                                    <Box key={b.id} sx={{ mb: 2, p: 1, border: "1px solid #ccc", borderRadius: 1 }}>
                                        <Typography variant="subtitle1">Booklet {b.bookletId}</Typography>
                                        <Typography variant="body2">Fragen: {b.bookletQuestion.map(q => `ID: ${q.questionId}`).join(", ")}</Typography>
                                        <Typography variant="body2">Erstellt am: {new Date(b.createdAt).toLocaleDateString()}</Typography>
                                        {b.excelFileUrl && (
                                            <Button variant="text" href={b.excelFileUrl} target="_blank">Excel herunterladen</Button>
                                        )}
                                    </Box>
                                ))}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setBookletDialogOpen(false)}>Schließen</Button>
                            </DialogActions>
                        </Dialog>
                    </Paper>
                )}
                <Paper sx={{ p: 3 }}>
                    <Typography sx={{ pb: 3 }} variant="h5">Exports</Typography>
                    {survey.mode === "DESIGN" && (<Button variant="outlined" sx={{ mr: 2 }} startIcon={<FileDownload />} onClick={handleExportClick} disabled={saving || preparingExport}>
                        {preparingExport ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} />
                                Exportiere...
                            </Box>
                        ) : (
                            <>Booklet Items (PDF)</>
                        )}
                    </Button>)}
                    <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExcelExportClick} disabled={saving || excelExport}>
                        {excelExport ? (
                            <Box display="flex" alignItems="center" gap={1}>
                                <CircularProgress size={20} />
                                Laden...
                            </Box>) : (
                            <>Aufgaben Details (XLSX)
                            </>
                        )}
                    </Button>
                </Paper>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5">Zuweisung an alle Lehrpersonen</Typography>
                    <Typography sx={{ pb: 3 }}  color="text.secondary" >Schaltet die Erhebung für alle Lehrer frei, die Lehrperson kann dann eigenständig die Erhebung für einzelne Klassen aktivieren/deaktivieren.</Typography>
                    <Button variant="contained" onClick={handleSurveyAssignmentClick}>
                        {survey.teacherAssigned ? "Zuweisung entfernen" : "Zuweisen"}
                    </Button>
                </Paper>
                <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Excel Dateien hochladen</DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2} mt={1}>
                            <Button variant={file1 ? "contained" : "outlined"} component="label">
                                {file1 ? `Datei 1: ${file1.name}` : "Upload: TestId - Testheft"}
                                <input hidden type="file" accept=".xlsx, .xls" onChange={(e) => e.target.files && setFile1(e.target.files[0])}/>
                            </Button>

                            <Button variant={file2 ? "contained" : "outlined"} component="label">
                                {file2 ? `Datei 2: ${file2.name}` : "Upload: Designmatrix (Booklet - Testheft)"}
                                <input hidden type="file" accept=".xlsx, .xls" onChange={(e) => e.target.files && setFile2(e.target.files[0])}/>
                            </Button>

                            {(!file1 || !file2) && (
                                <Typography color="error">
                                    Beide Dateien müssen hochgeladen werden!
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)}>Abbrechen</Button>
                        <Button variant="contained" onClick={handleSaveFiles} disabled={!file1 || !file2 || saving}>
                            {saving ? "Speichern..." : "Speichern"}
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Excel Validierungsfehler</DialogTitle>
                    <DialogContent dividers>
                        {validationErrors.map((e, index) => (
                            <Box
                                key={index}
                                sx={{mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fafafa"}}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Booklet {e.bookletId}
                                </Typography>

                                {e.missingQuestionIds?.length > 0 && (
                                    <Tooltip title="Diese Aufgaben existieren nicht in der Datenbank oder wurden gelöscht." arrow>
                                    <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                        Fehlende Aufgaben: {e.missingQuestionIds.join(", ")}
                                    </Typography></Tooltip>
                                )}

                                {e.unfinishedQuestionIds?.length > 0 && (
                                    <Tooltip title="Diese Aufgaben haben nicht den Status 'abgeschlossen', schliessen Sie die Aufgabe ab." arrow>
                                    <Typography color="warning.main" variant="body2" sx={{ mt: 1 }}>
                                        Nicht abgeschlossene Aufgaben: {e.unfinishedQuestionIds.join(", ")}
                                    </Typography></Tooltip>
                                )}
                            </Box>
                        ))}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setErrorDialogOpen(false)} variant="contained">
                            Verstanden
                        </Button>
                    </DialogActions>
                </Dialog>
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
                </Snackbar>
                <Snackbar open={exportProgress.open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                    <Alert severity="info" variant="filled">
                        Exportiere PDF {exportProgress.current} von {exportProgress.total}...
                    </Alert>
                </Snackbar>
                <Box sx={{position: "fixed", left: "-10000px", top: 0, width: "210mm", backgroundColor: "white", p: 2,}}>
                    <Box ref={exportRef}>
                        {exportQuestion && (
                            <>
                                <Typography variant="h5">Aufgabe ID {exportQuestion.id}</Typography>
                                <QuestionPdfPreview key={exportQuestion.id} content={exportQuestion.contentJson}/>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </MainLayout>
    );
};

export default SurveyUpdatePage;
