import React, {useEffect, useState} from 'react';
import MainLayout from '../../layouts/MainLayout.tsx';
import QuestionLayout from '../../layouts/QuestionLayout.tsx';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    Snackbar,
    Typography,
} from '@mui/material';
import {Save} from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import {type GeoGebraAnswer, Preview} from '../../components/Editor/Preview';
import {loadQuestionForm, type Question, updateQuestionStatus} from '../../services/EditorService.tsx';
import type {JSONContent} from '@tiptap/core';
import {
    type Block,
    extractAnswersFromJson,
    mapQuestionsStatus,
    mergeGeoGebraAnswers,
    parseContentToBlocks, type QuizStatus,
} from "../utils/AnswerUtils.tsx";
import type {useEditor} from '@tiptap/react';
import {evaluateAnswers} from "../../services/SolverService.tsx";
import PrettyTestResult from "./PrettyTestResult.tsx";

export default function AnswerPreviewPage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [questionContent, setQuestionContent] = useState<JSONContent | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [quizStatus, setQuizStatus] = useState<QuizStatus>('in bearbeitung');
    const [loading, setLoading] = useState(false);
    const editorRef = React.useRef<ReturnType<typeof useEditor> | null>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'error' | 'success' | 'info'
    }>({
        open: false,
        message: '',
        severity: 'info',
    });
    const [question, setQuestion] = useState<Question>();
    const [geoGebraAnswers, setGeoGebraAnswers] = useState<GeoGebraAnswer[]>([]);
    const handleGeoGebraChange = (answer: GeoGebraAnswer) => {
        setGeoGebraAnswers(prev => {
            const idx = prev.findIndex(a => a.id === answer.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = answer;
                return updated;
            }
            return [...prev, answer];
        });
    };

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        (async () => {
            try {
                const question = await loadQuestionForm(id);
                setQuestion(question);
                const content = question.contentJson;
                setQuestionContent(content);
                setQuizStatus(mapQuestionsStatus(question.status));
                const parsedBlocks: Block[] = parseContentToBlocks(content);
                setBlocks(parsedBlocks);
            } catch (err) {
                console.error('Failed to load question:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleTestAnswers = async () => {
        if (!id || !editorRef.current) return;
        const json = editorRef.current.getJSON();
        let answers = extractAnswersFromJson(json, blocks);
        try {
            answers = mergeGeoGebraAnswers(answers, geoGebraAnswers);
            const response = await evaluateAnswers(id, answers);
            setTestResult(response);
            setTestDialogOpen(true);
        } catch (err: any) {
            setSnackbar({open: true, message: err.message ?? 'Fehler bei der Verarbeitung.', severity: 'error',});
            return;
        }
    };

    const handleResetAnswers = () => {
        if (!blocks) return;
        blocks.forEach(block => {
            switch (block.kind) {
                case 'sc': {
                    const checkboxNodes = document.querySelectorAll<HTMLInputElement>(
                        `div.mc-choice-wrapper input[name="group-${block.key}"]`
                    );
                    checkboxNodes.forEach(input => input.checked = false);
                    break;
                }
            }
        });
    };

    const handleSaveStatus = async () => {
        if (!id) return;
        setLoading(true);
        try {
            await updateQuestionStatus(id, quizStatus);
            navigate('/table');
        } catch (err) {
            console.error('Failed to save status:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <QuestionLayout question={question}>
                <Box sx={{minHeight: '100vh', backgroundColor: 'background.default', py: 3, px: 2, display: 'flex', flexDirection: 'column', mt: 6}}>
                    <Paper elevation={0} sx={{padding: 3, border: '2px solid #000'}}>
                        <Typography variant="h4" gutterBottom sx={{textAlign: 'center', fontWeight: 'bold'}}>
                            Status setzen
                        </Typography>

                        <FormControl component="fieldset">
                            <RadioGroup sx={{justifyContent: 'center', display: 'flex', gap: 3}} value={quizStatus}
                                        onChange={(e) => setQuizStatus(e.target.value as typeof quizStatus)}>
                                <FormControlLabel   disabled={!question?.isEditable}
                                                    value="in bearbeitung" control={<Radio/>} label="In Bearbeitung"/>
                                <FormControlLabel   disabled={!question?.isEditable}
                                                    value="abgeschlossen" control={<Radio/>} label="Abgeschlossen"/>
                                <FormControlLabel   disabled={!question?.isEditable}
                                                    value="lektorat" control={<Radio/>} label="Lektorat"/>
                                <FormControlLabel   disabled={!question?.isEditable}
                                                    value="gelöscht" control={<Radio/>} label="Gelöscht"/>
                            </RadioGroup>
                        </FormControl>

                        <Typography variant="h4" gutterBottom sx={{textAlign: 'center', fontWeight: 'bold'}}>
                            Vorschau des Quiz
                        </Typography>

                        {loading && <Typography>Loading…</Typography>}

                        {!loading && questionContent && (
                            <>
                                <Preview content={questionContent} editorRef={editorRef}
                                         onGeoGebraChange={handleGeoGebraChange}/>
                                <Box sx={{mt: 3, display: 'flex', gap: 2, justifyContent: 'center'}}>
                                    <Button variant="outlined" onClick={() => navigate(-1)}>
                                        Zurück
                                    </Button>
                                    <Button variant="outlined" onClick={handleTestAnswers}>
                                        Antworten testen
                                    </Button>
                                    <Button variant="outlined" onClick={handleResetAnswers}>
                                        Single Choice zurücksetzen
                                    </Button>
                                    <Button variant="contained" startIcon={<Save/>} disabled={!question?.isEditable} onClick={handleSaveStatus}>
                                        Speichern
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>
            </QuestionLayout>
            <Dialog
                open={testDialogOpen}
                onClose={() => setTestDialogOpen(false)}
                maxWidth="sm"
                fullWidth>
                <DialogTitle>Testergebnis</DialogTitle>

                <DialogContent dividers>
                    <PrettyTestResult result={testResult}/>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setTestDialogOpen(false)}>Schließen</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                      onClose={() => setSnackbar((prev) => ({...prev, open: false}))}
                      anchorOrigin={{vertical: "bottom", horizontal: "center"}}>
                <Alert
                    onClose={() => setSnackbar((prev) => ({...prev, open: false}))}
                    severity={snackbar.severity}
                    sx={{width: "100%"}}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainLayout>
    );
}
