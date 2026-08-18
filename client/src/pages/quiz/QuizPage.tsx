import React, {useEffect, useState} from 'react';
import {useParams, useSearchParams} from "react-router-dom";
import {v4 as uuidv4} from "uuid";
import {
    type AnswerDTO,
    endQuestionSession,
    endQuizSession,
    getQuiz,
    type Quiz,
    type Quiz as QuizType,
    skipQuestion,
    startQuestionSession,
    submitAnswer,
    submitTwoTierFeedback, syncAnonymousUser,
    trackQuestionTime
} from "../../services/QuizService.tsx";
import GeneralLayout from "../../layouts/GeneralLayout.tsx";
import type {useEditor} from "@tiptap/react";
import {type GeoGebraAnswer, Preview} from "../../components/Editor/Preview.tsx";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {Alert, Button, CircularProgress, Paper, Snackbar, Stack, Tooltip} from '@mui/material';
import {
    type Block,
    extractAnswersFromJson,
    type LineEquationAnswer,
    mergeGeoGebraAnswers,
    parseContentToBlocks
} from '../utils/AnswerUtils.tsx';
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {enrichQuizWithAnswers, feedbackQuestions} from "./utils/EnrichQuizWithAnswers.tsx";
import SaveIcon from "@mui/icons-material/Save";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function QuizPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const freeParam = searchParams.get("freeParam");
    const [userId, setUserId] = useState<string | null>(null);
    const [internalUserId, setInternalUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const editorRef = React.useRef<ReturnType<typeof useEditor> | null>(null);
    const [quizFinished, setQuizFinished] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [geoGebraAnswers, setGeoGebraAnswers] = useState<GeoGebraAnswer[]>([]);
    const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'error' | 'success' | 'info' | 'warning'
    }>({
        open: false,
        message: '',
        severity: 'info',
    });
    const [questionIds, setQuestionIds] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const questionStartRef = React.useRef<number>(Date.now())
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

    const handleSosciRedirect = async () => {
        if (!userId || !id) return;
        try {
            await endQuizSession(userId, id);
        } catch (err) {
            console.error(err);
        } finally {
            window.location.href = `https://www.soscisurvey.de/Erhebung032026_1/?ref=${userId}`;
        }
    };

    useEffect(() => {
        if (!quiz?.question || !quiz?.question?.id || !userId || !id) return;
        startQuestionSession(id, quiz.question.id, userId).catch(console.error);
        return () => {
            if (!quiz?.question || !quiz?.question?.id || !userId || !id) return;
            endQuestionSession(id, quiz.question.id, userId).catch(console.error);
        };
    }, [quiz?.question, quiz?.question?.id, id, userId]);

    useEffect(() => {
        const handler = () => {
            endQuestionSession(id!, quiz!.question!.id, userId!).catch(() => {});
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [quiz, quiz?.question, quiz?.question?.id, id, userId]);

    useEffect(() => {
        const initUser = async () => {
            const studentId = localStorage.getItem("studentId");
            if (studentId) {
                setUserId(studentId);
                setInternalUserId(studentId);
                return;
            }

            const key = "quizUserId";
            const expiryKey = "quizUserIdExpiry";

            let storedUser = localStorage.getItem(key);
            const expiry = localStorage.getItem(expiryKey);
            const now = Date.now();

            if (!storedUser || !expiry || now > parseInt(expiry, 10)) {
                storedUser = uuidv4();
                const fourteenDays = 14 * 24 * 60 * 60 * 1000;
                localStorage.setItem(key, storedUser);
                localStorage.setItem(expiryKey, (now + fourteenDays).toString());
            }
            setUserId(storedUser);
            try {
                const user = await syncAnonymousUser(storedUser);
                setInternalUserId(user.id);
            } catch (err) {
                console.error("Failed to sync anonymous user:", err);
            }
        };
        initUser();
    }, []);

    useEffect(() => {
        fetchQuizData();
    }, [userId, id]);

    const fetchQuizData = async (qid?: number, nextQid?: number) => {
        if (!userId || !id) return;
        setLoading(true);
        setError(null);
        try {
            let data: Quiz;
            if (qid) {
                data = await getQuiz(id, userId, qid, undefined, freeParam);
            } else {
                if (nextQid) {
                    data = await getQuiz(id, userId, undefined, nextQid, freeParam);
                } else {
                    data = await getQuiz(id, userId, undefined, undefined, freeParam);
                }}
            if (data?.question) {
                const contentWithAnswers = enrichQuizWithAnswers(typeof data.question.contentJson === "string" ? JSON.parse(data.question.contentJson) : data.question.contentJson, data.previousAnswer);
                data.question.contentJson = contentWithAnswers;
            }
            setQuiz(data);
            setFeedback(data.feedback || {});
            if (data.isAdaptive) {
                setQuizFinished(!data.question);
            } else {
                setQuizFinished(data.answeredQuestions !== undefined && data.totalQuestions !== undefined && data.answeredQuestions === data.totalQuestions);
                if (!questionIds.length && data.questionIds) {
                    setQuestionIds(data.questionIds);
                }
                if (data.question && data.questionIds) {
                    const idx = data.questionIds.indexOf(data.question.id);
                    setCurrentIndex(idx >= 0 ? idx : 0);
                }
            }
            setGeoGebraAnswers([]);
        } catch (err: any){
            if (err.message==="NOT_ACTIVE"){
                setError("Der Testlauf ist nicht aktiv, Sie können den Test nicht durchführen.")
            } else {
                setError(err.message || "Failed to load quiz");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTestAnswers = async (solved: boolean) => {
        if (!editorRef.current || !quiz || !quiz.question || !userId) return;
        const question = quiz.question;
        const parsedBlocks: Block[] = parseContentToBlocks(typeof question.contentJson === 'string' ? JSON.parse(question.contentJson) : question.contentJson);
        const editorJson = editorRef.current.getJSON();
        let extractedAnswers = extractAnswersFromJson(editorJson, parsedBlocks);
        extractedAnswers = mergeGeoGebraAnswers(extractedAnswers, geoGebraAnswers);
        if (!id) return;
        const answerDTO: AnswerDTO = {
            questionId: question.id,
            instanceId: id!,
            answer: extractedAnswers.map(a => {
                if (a.kind === 'lineEquation') {
                    return {key: a.key, kind: a.kind, value: a.value} as LineEquationAnswer;
                }  else {
                    return { value: a.value, key: a.key, kind: a.kind } as any;
                }
            }),
            solved: solved || quiz.previousAnswer?.solved
        };
        try {
            setSubmitting(true);
            await submitAnswer(answerDTO, userId);
            if (quiz.isAdaptive) {
                setSnackbar({open: true, message: `Die Antwort ist gespeichert.`, severity: 'success',});
                await fetchQuizData(answerDTO.questionId);
                return;
            }
            if (solved) {
                setSnackbar({open: true, message: `Die Antwort ist gespeichert, du kannst sie jederzeit wieder ändern.`, severity: 'success',});
            }
            await fetchQuizData(answerDTO.questionId)
        } catch (err) {
            console.error(err);
            setSnackbar({open: true, message: `Fehler beim Absenden der Antwort.`, severity: 'error',});
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = async () => {
        if (!quiz?.question || !userId || !id) return;
        try {
            setSubmitting(true);
            await handleTestAnswers(false);
            await skipQuestion(quiz.question.id, id, userId);
            setSnackbar({open: true, message: `Die Aufgabe wurde übersprungen, du kannst sie jederzeit wieder ändern.`, severity: 'warning',});
            await fetchQuizData(quiz.question.id)
        } catch (err) {
            console.error(err);
            setSnackbar({open: true, message: "Fehler beim Überspringen der Frage.", severity: "error",});
        } finally {
            setSubmitting(false);
        }
    };

    const flushQuestionTime = async () => {
        if (!quiz?.question || !userId || !id) return
        const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000)
        try {
            await trackQuestionTime(id, quiz.question.id, userId, elapsed)
            questionStartRef.current = Date.now()
        } catch (e) {
            console.error("Time tracking failed", e)
        }
    }

    useEffect(() => {
        const interval = setInterval(() => {flushQuestionTime()}, 2000)
        return () => clearInterval(interval)
    }, [quiz, userId, id])

    if (loading)
        return (
            <GeneralLayout>
                <Stack direction="column" justifyContent="center" alignItems="center" sx={{ height: '60vh' }}><CircularProgress />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Laden...
                    </Typography>
                </Stack>
            </GeneralLayout>
        );

    const handleFeedbackChange = async (key: string, value: string) => {
        if (!id || !quiz?.question?.id || !userId) return;
        const updatedFeedback = {...feedback, [key]: value};
        setFeedback(updatedFeedback);
        try {
            await submitTwoTierFeedback(id!, quiz!.question!.id, userId!, updatedFeedback);
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: "Feedback konnte nicht gespeichert werden.",
                severity: "error",
            });
        }
    };

    if (error) {
        return (
            <GeneralLayout>
                <Box sx={{minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center",}}>
                    <Paper elevation={3} sx={{padding: 6, maxWidth: 500, textAlign: "center", borderRadius: 3,}}>
                        <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }}></ErrorOutlineIcon>
                        <Typography variant="h5" fontWeight={600} gutterBottom>Fehler beim Laden des Tests</Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
                        <Button variant="contained" onClick={() => window.location.reload()}>
                            Erneut versuchen
                        </Button>
                    </Paper>
                </Box>
            </GeneralLayout>
        );
    }
    return (
        <>
            <AppBar position="static" sx={{ width: '100%' }}>
                <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, px: 2 }}>
                    {!quiz?.isAdaptive && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                        {questionIds.map((qid, index) => {
                            const isCurrent = quiz?.question?.id === qid;
                            const isAnswered = quiz?.answeredQuestionIds?.includes(qid);
                            const isSkipped = quiz?.skippedQuestions?.includes(qid);
                            let title = "";
                            if (isAnswered && !isSkipped) {
                                    title = "Die Antwort ist gespeichert.";
                            }
                            if (isSkipped) {
                                title = "Die Antwort ist übersprungen.";
                            }
                            return (
                                <Tooltip title={title} arrow>
                                <Button key={qid} size="small" variant={isCurrent ? "outlined" : "contained"} onClick={async () => {await handleTestAnswers(false); await fetchQuizData(qid); setQuizFinished(false)}} sx={{color: "white", borderColor: "white", backgroundColor: isCurrent ? "rgba(255,255,255,0.2)" : "transparent", minWidth: 36, position: "relative", "&:hover": {backgroundColor: "grey", borderColor: "white",},}}>
                                    Aufgabe {index + 1}
                                    {isAnswered && !isSkipped &&(
                                        <Box component="span" sx={{position: "absolute", top: -4, right: -4, width: 16, height: 16, backgroundColor: "green", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontSize: 12, fontWeight: "bold",
                                        }}>✓</Box>)}
                                    {isSkipped && (
                                        <Box component="span" sx={{position: "absolute", top: -4, right: -4, width: 16, height: 16, backgroundColor: "#fbc02d", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", color: "black", fontSize: 12, fontWeight: "bold",}}>
                                            ⏭</Box>)}
                                </Button></Tooltip>
                            );
                        })}
                    </Box>)}
                    {quiz?.isAdaptive ? (
                        <Typography variant="body2">Adaptiver Test</Typography>) : (
                        <Typography variant="body2">AufgabenId: {quiz?.question?.id}</Typography>
                    )}
                    <Box sx={{ color: "white", ml: 2 }}>
                        <Stack spacing={0.5}>
                            <Typography variant="body2">UserId: {internalUserId ?? userId}</Typography>
                            <Typography variant="body2">AufgabenId: {quiz?.question?.id}</Typography>
                        </Stack>
                    </Box>
                </Toolbar>
            </AppBar>

            <main style={{padding: '2rem'}}>
                {!quizFinished ? (
                    <Box sx={{mb: 4, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", width: "100%"}}>
                        {!quiz?.isAdaptive && (<Box sx={{ display: "flex", gap: 1, position: "absolute", left: 0}}>
                                <Button
                                variant="outlined"
                                onClick={async () => {
                                    await handleTestAnswers(false);
                                    if (currentIndex > 0) {
                                        const prevQuestionId = questionIds[currentIndex - 1];
                                        await fetchQuizData(prevQuestionId);
                                    }
                                }}
                                startIcon={<ArrowBackIcon />}
                                disabled={currentIndex === 0}>
                                Zurück
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={async () => {
                                    await handleTestAnswers(false);
                                    if (currentIndex < questionIds.length - 1) {
                                        const nextQuestionId = questionIds[currentIndex + 1];
                                        await fetchQuizData(nextQuestionId);
                                    }
                                }}
                                endIcon={<ArrowForwardIcon />}
                                disabled={currentIndex >= questionIds.length - 1}>
                                Weiter
                            </Button>
                        </Box>)}
                        <Box sx={{display: "flex", gap: 1}}>
                            {!quiz?.isAdaptive && (
                                <Button startIcon={<SkipNextIcon />} variant="outlined" color="warning" onClick={handleSkip} disabled={submitting}>
                                Überspringen
                            </Button>)}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {handleTestAnswers(true)}}
                                disabled={submitting || loading}
                                startIcon={!submitting ? <SaveIcon /> : null}>
                                {submitting ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "Antwort speichern"
                                )}
                            </Button>
                        </Box>
                    </Box>
                ) : (<></>)}
                <Box sx={{border: '2px solid', borderRadius: 2, p: 3, mb: 4}}>
                    {quizFinished ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <Typography variant="body1">
                                Vielen Dank für Ihre Teilnahme.
                            </Typography>
                            <Button variant="contained" color="primary" onClick={handleSosciRedirect}>
                                Bitte füllen Sie jetzt diese Umfrage aus!
                            </Button>
                            <Box sx={{pb: 4}}></Box>
                            {!quiz?.isAdaptive && (
                                <Button color="secondary" onClick={() => {setQuizFinished(false)}}>
                                Zurück zu den Aufgaben
                            </Button>)}
                        </Box>
                    ) : (quiz?.question && (<Preview content={quiz.question.contentJson} editorRef={editorRef} onGeoGebraChange={handleGeoGebraChange}/>))}
                </Box>
                {quiz?.isTwoTier && !quizFinished  && (
                    <><Box sx={{border: '2px solid black', borderRadius: 2, p: 2, mt: 3, maxWidth: 600, margin: 'auto', mb: 3}}>
                        <Typography variant="h6"    sx={{mb: 2, borderBottom: '1px solid #ccc', pb: 1}}>Dein Feedback</Typography>
                        {feedbackQuestions.map((q) => (
                            <Box key={q.key}>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                    {q.text}
                                </Typography>
                                {q.options.map((opt) => (
                                    <label key={opt} style={{ display: 'block', marginBottom: 4 }}>
                                        <input
                                            type="radio"
                                            name={q.key}
                                            value={opt}
                                            checked={feedback?.[q.key] === opt}
                                            onChange={(e) => handleFeedbackChange(q.key, e.target.value)}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </Box>
                        ))}</Box>
                    </>)}
                {!quizFinished ? (
                    <Box sx={{mt: 4, display: "flex", alignItems: "center", margin: "auto", mb: 4,}}>
                        <Box sx={{display: "flex", gap: 1, mx: "auto",}}>
                            {!quiz?.isAdaptive && (
                                <Button startIcon={<SkipNextIcon />} variant="outlined" color="warning" onClick={handleSkip} disabled={submitting}>
                            Überspringen
                        </Button>)}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {handleTestAnswers(true)}}
                            disabled={submitting || loading}
                            startIcon={!submitting ? <SaveIcon /> : null}>
                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Antwort speichern"}
                        </Button></Box>
                    </Box>
                ) : (<></>)}
            </main>
            <Snackbar open={snackbar.open} autoHideDuration={1500} onClose={() => setSnackbar((prev) => ({...prev, open: false}))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert
                    onClose={() => setSnackbar((prev) => ({...prev, open: false}))}
                    severity={snackbar.severity}
                    sx={{width: "100%"}}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
