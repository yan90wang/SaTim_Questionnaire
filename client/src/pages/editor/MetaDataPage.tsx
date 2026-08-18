import React, {useEffect, useState} from "react";
import MainLayout from "../../layouts/MainLayout.tsx";
import {
    Alert,
    Backdrop,
    Box,
    Button,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    FormGroup,
    MenuItem,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {Save as SaveIcon} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import {initialFormSchema} from "../utils/FormSchema.tsx";
import {
    createQuestionForm,
    loadQuestionForm,
    type Question,
    updateQuestionForm
} from "../../services/EditorService.tsx";
import QuestionLayout from "../../layouts/QuestionLayout.tsx";

type FieldType = "text" | "textarea" | "checkbox" | "select";

export interface MetaField {
    key: string;
    label: string;
    type: FieldType;
    value?: string;
    options?: string[];
    optionsValue?: Record<string, boolean>;
    placeholder?: string;
    required?: boolean;
}

export default function MetaDataPage() {
    const navigate = useNavigate();
    const [formSchema, setFormSchema] = useState<MetaField[]>(initialFormSchema);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const { id } = useParams<{ id: string }>();
    const [question, setQuestion] = useState<Question>();

    const handleTextChange = (key: string, value: string) => {
        setFormSchema((prev) =>
            prev.map((field) =>
                field.key === key ? { ...field, value } : field
            )
        );
        setErrors((prev) => ({ ...prev, [key]: false }));
    };

    const handleCheckboxChange = (key: string, option: string, checked: boolean) => {
        setFormSchema((prev) =>
            prev.map((field) =>
                field.key === key
                    ? {...field, optionsValue: { ...(field.optionsValue || {}), [option]: checked },} : field)
        );
    };

    const handleSave = async () => {
        const newErrors: Record<string, boolean> = {};
        formSchema.forEach((field) => {
            if (field.required && !field.value?.trim()) {
                newErrors[field.key] = true;
            }
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSnackbar({
                open: true,
                message: "Bitte füllen Sie alle Pflichtfelder aus.",
                severity: "error",
            });
            return;
        }
        setErrors({});
        setLoading(true);
        try {
            if (id) {
                const questionResponse = await updateQuestionForm(id, formSchema);
                setSnackbar({
                    open: true,
                    message: "Aufgabe erfolgreich aktualisiert!",
                    severity: "success",
                });
                navigate(`/editor/${questionResponse.id}`);
            } else {
                const questionResponse = await createQuestionForm(formSchema);
                setSnackbar({
                    open: true,
                    message: "Aufgabe erfolgreich gespeichert!",
                    severity: "success",
                });
                navigate(`/editor/${questionResponse.id}`);
            }
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err?.message || "Fehler beim Speichern der Aufgabe.",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            loadQuestionForm(id)
                .then((data) => {
                    setQuestion(data);
                    setFormSchema(data.metadata ?? []);
                })
                .catch((err) => console.error("Error loading question form data", err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    return (
        <MainLayout>
            <QuestionLayout question={question}>
                <Box sx={{minHeight: "100vh", backgroundColor: "background.default", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6,}}>
                    <Paper elevation={0} sx={{ padding: 3, border: "2px solid #000" }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: "center", fontWeight: "bold" }}>
                            Aufgabe anlegen
                        </Typography>

                        <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                            {formSchema.map((field) => {
                                if (field.type === "text" || field.type === "textarea") {
                                    return (
                                        <Box key={field.key}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                {field.label}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline={field.type === "textarea"}
                                                value={field.value || ""}
                                                onChange={(e) => handleTextChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                error={errors[field.key]}
                                                helperText={
                                                    errors[field.key]
                                                        ? "Dieses Feld ist erforderlich"
                                                        : field.required
                                                            ? "Pflichtfeld"
                                                            : ""
                                                }
                                            />
                                        </Box>);}
                                if (field.type === "select") {
                                    return (
                                        <Box key={field.key}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                {field.label}
                                            </Typography>

                                            <TextField
                                                select
                                                fullWidth
                                                value={field.value || ""}
                                                onChange={(e) => handleTextChange(field.key, e.target.value)}
                                                required={field.required}
                                                error={errors[field.key]}
                                                helperText={
                                                    errors[field.key]
                                                        ? "Bitte wählen Sie eine Option"
                                                        : field.required
                                                            ? "Pflichtfeld"
                                                            : ""
                                                }
                                            >
                                                {field.options?.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                    );
                                }

                                if (field.type === "checkbox") {
                                    return (
                                        <Box key={field.key}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                {field.label}
                                            </Typography>
                                            <FormGroup row>
                                                {field.options?.map((option) => (
                                                    <FormControlLabel
                                                        key={option}
                                                        control={<Checkbox
                                                            checked={field.optionsValue?.[option] || false}
                                                            onChange={(e) =>
                                                                handleCheckboxChange(field.key, option, e.target.checked)}/>}
                                                        label={option}/>))}
                                            </FormGroup>
                                        </Box>
                                    );
                                }

                                return null;
                            })}

                            <Box sx={{ display: "flex", gap: 2 }}>
                                <Button variant="outlined" fullWidth onClick={() => navigate("/table")}>
                                    Abbrechen
                                </Button>
                                <Button variant="contained" disabled={id ? !question?.isEditable : false} fullWidth startIcon={<SaveIcon />} onClick={handleSave}>
                                    Speichern
                                </Button>
                            </Box>
                        </CardContent>
                    </Paper>
                </Box>
            </QuestionLayout>
            <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={loading}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </MainLayout>
    );
}
