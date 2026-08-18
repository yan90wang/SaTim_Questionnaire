import React, { useEffect, useState } from "react";
import {
    Alert,
    Box, Button, Chip,
    CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, Snackbar, TextField, Typography,
} from "@mui/material";
import MainLayout from "../layouts/MainLayout.tsx";
import {DataGrid, type GridColDef, type GridRowId} from "@mui/x-data-grid";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {duplicateQuestion, loadAllQuestions, loadQuestionForm, type Question} from "../services/EditorService.tsx";
import {type FullUser, getUserById} from "../services/UserService.tsx";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from '@mui/icons-material/Visibility';
import {Preview} from "../components/Editor/Preview.tsx";

type QuestionRow = {
    id: number;
    status: string;
    metadata: {
        key: string;
        label: string;
        value: string;
    }[];
    createdBy?: { id: number, first_name: string, last_name: string, email: string };
    updatedBy?: { id: number, first_name: string, last_name: string, email: string };
};

export default function QuestionsTablePage() {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [rows, setRows] = useState<QuestionRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
    const [createdByUser, setCreatedByUser] = useState<FullUser | null>(null);
    const [updatedByUser, setUpdatedByUser] = useState<FullUser | null>(null);
    const [duplicating, setDuplicating] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [searchTitle, setSearchTitle] = useState<string>("");
    const [filterCreatedBy, setFilterCreatedBy] = useState<string>("");
    const [filterUpdatedBy, setFilterUpdatedBy] = useState<string>("");
    const [previewOpen, setPreviewOpen] = useState(false);

    const transformedRows = rows.map((row) => {
        const flatRow: Record<string, any> = {
            id: row.id,
            status: row.status,
            createdBy:
                row.createdBy?.first_name + " " + row.createdBy?.last_name,
            updatedBy:
                row.updatedBy?.first_name + " " + row.updatedBy?.last_name,
        };

        row.metadata.forEach((meta: any) => {
            if (meta.type === "checkbox") {
                flatRow[meta.key] = Object.keys(meta.optionsValue || {})
                    .filter((key) => meta.optionsValue[key])
                    .join(", ");
            } else {
                flatRow[meta.key] = meta.value ?? "";
            }
        });
        return flatRow;
    });

    const columns: GridColDef[] = [];
    if (rows.length > 0) {
        columns.push({ field: "id", headerName: "ID", width: 80 });
        columns.push({ field: "status", headerName: "Status", width: 140,   renderCell: (params) => {
                const value = params.value as string;
                switch (value) {
                    case "ACTIVE":
                        return <Chip label="In Bearbeitung" color="info" size="small" />;
                    case "DELETED":
                        return <Chip label="Gelöscht" color="secondary" size="small" />;
                    case "FINISHED":
                        return <Chip label="Abgeschlossen" color="primary" size="small" />;
                    case "LECTURE":
                        return <Chip label="Lektorat" color="success" size="small" />;
                    default:
                        return <Chip label={value || "Unbekannt"} size="small" />;
                }
            }, });
        columns.push({field: "createdBy", headerName: "Erstellt von", width: 140});
        columns.push({field: "updatedBy", headerName: "Geändert von", width: 140});
        rows[0].metadata.forEach((meta) => {
            columns.push({ field: meta.key, headerName: meta.label, width: 200 });
        });
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data: QuestionRow[] = await loadAllQuestions();
                setRows(data);
            } catch (error) {
                console.error("Aufgaben konnten nicht geladen werden: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredRows = transformedRows.filter((row) => {
        const searchId = parseInt(searchText, 10);
        const matchesId = searchText ? row.id === searchId : true;
        const matchesTitle = searchTitle
            ? row.title?.toLowerCase().includes(searchTitle.toLowerCase())
            : true;
        const matchesCreatedBy = filterCreatedBy
            ? row.createdBy?.toLowerCase().includes(filterCreatedBy.toLowerCase())
            : true;
        const matchesUpdatedBy = filterUpdatedBy
            ? row.updatedBy?.toLowerCase().includes(filterUpdatedBy.toLowerCase())
            : true;

        let statusCode: string;
        switch (filterStatus) {
            case "In Bearbeitung":
                statusCode = "ACTIVE";
                break;
            case "Gelöscht":
                statusCode = "DELETED";
                break;
            case "Abgeschlossen":
                statusCode = "FINISHED";
                break;
            case "Lektorat":
                statusCode = "LECTURE";
                break;
            default:
                statusCode = "";
        }
        const matchesStatus = !filterStatus || row.status === statusCode;
        return (
            matchesId &&
            matchesTitle &&
            matchesCreatedBy &&
            matchesUpdatedBy &&
            matchesStatus
        );
    });

    const handleRowClick = async (id: GridRowId) => {
        setDialogOpen(true);
        setDetailsLoading(true);
        setCreatedByUser(null);
        setUpdatedByUser(null);

        try {
            const details = await loadQuestionForm(id.toString());
            setSelectedQuestion(details);
            if (details.createdById) {
                const createdUser = await getUserById(details.createdById);
                setCreatedByUser(createdUser);
            }
            if (details.updatedById) {
                const updatedUser = await getUserById(details.updatedById);
                setUpdatedByUser(updatedUser);
            }
        } catch (error) {
            console.error("Fehler beim Laden der Aufgabendetails: ", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDuplicateQuestion = async () => {
        if (!selectedQuestion) return;
        setDuplicating(true);
        try {
            const duplicatedQuestion = await duplicateQuestion(selectedQuestion.id);
            setSnackbarMessage(`Aufgabe ${duplicatedQuestion.id} erfolgreich dupliziert`);
            setSnackbarOpen(true);
            const data: QuestionRow[] = await loadAllQuestions();
            setRows(data);
        } catch (error) {
            console.error("Fehler beim Duplizieren:", error);
            setSnackbarMessage("Fehler beim Duplizieren der Aufgabe.");
            setSnackbarOpen(true);
        } finally {
            setDuplicating(false);
            setDialogOpen(false);
        }
    };


    return (
        <MainLayout>
            <Box sx={{ minHeight: "100vh", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6 }}>
                {(loading || detailsLoading) && (
                    <Box sx={{position: "absolute", top: 0, left: 0, width: "100%", height: "100%", bgcolor: "rgba(255,255,255,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",}}>
                        <CircularProgress size={60} />
                    </Box>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">Aufgabenübersicht</Typography>
                        <Typography color="textSecondary">Alle Aufgaben mit Filter- und Suchoptionen</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/meta")}>
                        Neue Aufgabe erstellen
                    </Button>
                </Box>
                {/* ---Filter--- */}
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    <TextField
                        label="Suche nach ID"
                        size="small"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <TextField
                        label="Titel"
                        size="small"
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                    />
                    <TextField
                        label="Erstellt von"
                        size="small"
                        value={filterCreatedBy}
                        onChange={(e) => setFilterCreatedBy(e.target.value)}
                    />
                    <TextField
                        label="Geändert von"
                        size="small"
                        value={filterUpdatedBy}
                        onChange={(e) => setFilterUpdatedBy(e.target.value)}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}>
                            <MenuItem value="">Alle</MenuItem>
                            <MenuItem value="In Bearbeitung">In Bearbeitung</MenuItem>
                            <MenuItem value="Gelöscht">Gelöscht</MenuItem>
                            <MenuItem value="Lektorat">Lektorat</MenuItem>
                            <MenuItem value="Abgeschlossen">Abgeschlossen</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                {/* --- Table --- */}
                <Box sx={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
                    {(!loading) &&
                    <DataGrid
                        rows={filteredRows}
                        columns={columns}
                        pageSizeOptions={[20, 60, 100]}
                        initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                        showToolbar
                        loading={loading}
                        onRowClick={(params) => handleRowClick(params.id)}
                        slotProps={{
                            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 200 } },
                        }}
                        sx={{ flex: 1 }}
                    />}
                </Box>
                {/* --- Question Details Dialog --- */}
                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{display: "flex", justifyContent: "space-between", alignItems: "center",}}>Aufgabendetails   <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton></DialogTitle>
                    <DialogContent dividers>
                        { selectedQuestion ? (
                            <Box display="flex" flexDirection="column" gap={1.5}>
                                <Typography variant="h6">
                                    {selectedQuestion.metadata?.[0]?.value ?? ""}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>Erstellt von:</strong>{" "}
                                    {createdByUser
                                        ? `${createdByUser.first_name} ${createdByUser.last_name}`
                                        : selectedQuestion.createdById}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <strong>Erstellt am:</strong>{" "}
                                    {new Date(selectedQuestion.createdAt).toLocaleString()}
                                </Typography>
                                    <><Typography variant="body2" color="textSecondary">
                                        <strong>Zuletzt bearbeitet von:</strong>{" "}
                                        {updatedByUser
                                            ? `${updatedByUser.first_name} ${updatedByUser.last_name}`
                                            : selectedQuestion.updatedById}
                                    </Typography>
                                        <Typography variant="body2" color="textSecondary"><strong>Zuletzt bearbeitet am:</strong>{" "}{new Date(selectedQuestion.updatedAt!).toLocaleString()}</Typography></>
                            </Box>) : (<Typography>Keine Details verfügbar.</Typography>)}
                    </DialogContent>
                    <DialogActions sx={{justifyContent: "center"}}>
                        <Button variant="outlined" onClick={() => setPreviewOpen(true)} startIcon={<VisibilityIcon/>}>Vorschau</Button>
                        <Button variant="outlined" onClick={handleDuplicateQuestion} disabled={duplicating}>
                            {duplicating ? <CircularProgress color="inherit" /> : "Aufgabe duplizieren"}
                        </Button>
                        <Button variant="contained" onClick={() => {
                            if (selectedQuestion) {
                                navigate(`/meta/${selectedQuestion.id}`);}
                        }}>Aufgabe bearbeiten
                        </Button>
                    </DialogActions>
                </Dialog>
                {/* --- Preview Dialog --- */}
                <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Vorschau</DialogTitle>
                    <DialogContent dividers>
                        {selectedQuestion ? (
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Typography variant="h5">
                                    {selectedQuestion.title}
                                </Typography>
                                <Typography variant="body1">
                                    <Preview content={selectedQuestion.contentJson}/>
                                </Typography>
                            </Box>) : (<Typography>Keine Vorschau verfügbar.</Typography>)}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPreviewOpen(false)}>
                            Schließen
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
            <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </MainLayout>
    );
}
