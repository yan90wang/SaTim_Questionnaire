import React, {useEffect, useState} from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import {ExpandMore, Save} from "@mui/icons-material";
import {useNavigate, useParams} from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import QuestionLayout from "../../layouts/QuestionLayout";
import {loadQuestionForm, type Question, updateQuestionAnswers} from "../../services/EditorService.tsx";
import {Preview} from "../../components/Editor/Preview";
import type {JSONContent} from "@tiptap/core";
import {type Block, type Choice, parseContentToBlocks} from "../utils/AnswerUtils.tsx";
import {NumericAnswer} from "../../components/Editor/AnswerEditor/NumericAnswer.tsx";
import {LineEquationAnswer} from "../../components/Editor/AnswerEditor/LineEquationAnswer.tsx";
import {GeoGebraPointAnswer} from "../../components/Editor/AnswerEditor/GeoGebraPointAnswer.tsx";
import {GeoGebraLineAnswer} from "../../components/Editor/AnswerEditor/GeoGebraLineAnswer.tsx";
import {MathJax, MathJaxContext} from "better-react-mathjax";
import type {LineConditions, PointConditions} from "../../components/Editor/AnswerEditor/AnswerTypes.tsx";
import {checkLineEquationHasErrors, checkPointHasErrors} from "../../components/MathHelper/LineEquationValidator.tsx";
import { AlgebraAnswer } from "../../components/Editor/AnswerEditor/AlgebraAnswer.tsx";


export default function AnswerEditorPage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [questionContentJson, setQuestionContentJson] = useState<JSONContent>({});
    const [question, setQuestion] = useState<Question>();
    const getGeoGebraPointName = (index: number, blockKey: string) => {return `P${index + 1} (${blockKey})`;};
    const getGeoGebraLineName = (index: number, blockKey: string) => {return `L${index + 1} (${blockKey})`;};

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        (async () => {
            try {
                const question = await loadQuestionForm(id);
                setQuestion(question);
                const contentJson = question.contentJson;
                setQuestionContentJson(contentJson);
                const parsedBlocks = parseContentToBlocks(contentJson);
                setBlocks(parsedBlocks);
                const persisted = question.correctAnswers ?? {};
                initAnswers(parsedBlocks, persisted);
            } catch (err) {
                console.error("Failed to load question:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);
    const initAnswers = (parsedBlocks: Block[], persisted?: Record<string, any>) => {
        const initial: Record<string, any> = {};
        parsedBlocks.forEach((b) => {
            switch (b.kind) {
                case "mc":
                    initial[b.key] = [];
                    break;
                case "sc":
                    initial[b.key] = null;
                    break;
                case "numeric":
                    initial[b.key] = [{operator: "=", value: ""}];
                    break;
                case "lineEquation":
                    initial[b.key] = {m: [{operator: "=", value: ""}], c: [{operator: "=", value: ""}]};
                    break;
                case "freeText":
                case "freeTextInline":
                case "algebra":
                    initial[b.key] = "";
                    break;
                case "geoGebraPoints": {
                    const maxPoints = b.attrs?.maxPoints ?? 1;
                    for (let i = 0; i < maxPoints; i++) {
                        const pointName = getGeoGebraPointName(i, b.key);
                        initial[pointName] = {
                            x: [{operator: "=", value: "", logic: "and"}],
                            y: [{operator: "=", value: "", logic: "and"}]
                        };
                    }
                    break;
                }
                case "geoGebraLines": {
                    const maxLines = b.attrs?.maxLines ?? 0;
                    for (let i = 0; i < maxLines; i++) {
                        const name = getGeoGebraLineName(i, b.key);
                        initial[name] = {
                            m: [{operator: "=", value: "", logic: "and"}],
                            c: [{operator: "=", value: "", logic: "and"}]
                        };
                    }
                    break;
                }
                case "geoGebraSlope": {
                    initial[b.key] = [{operator: "=", value: ""}];
                }
            }

        });
        if (persisted) {
            Object.entries(persisted).forEach(([key, obj]) => {
                if (obj.type === "geoGebraPoints" && obj.value) {
                    Object.entries(obj.value as Record<string, PointConditions>).forEach(([pName, conds]) => {
                        if (initial[pName]) {
                            initial[pName] = {
                                ...initial[pName],
                                x: conds.x ?? initial[pName].x,
                                y: conds.y ?? initial[pName].y
                            };
                        } else {
                            initial[pName] = {
                                x: conds.x ?? [],
                                y: conds.y ?? []
                            };
                        }
                    });
                } else if (obj.type === "geoGebraLines" && obj.value) {
                    Object.entries(obj.value as Record<string, LineConditions>).forEach(([lName, conds]) => {
                        if (initial[lName]) {
                            initial[lName] = {
                                ...initial[lName],
                                m: conds.m ?? initial[lName].m,
                                c: conds.c ?? initial[lName].c
                            };
                        } else {
                            initial[lName] = {
                                m: conds.m ?? [],
                                c: conds.c ?? []
                            };
                        }
                    });
                } else if (key in initial) {
                    initial[key] = obj.value ?? initial[key];
                }
            });
        }
        setAnswers(initial);

    };
    const toggleChoice = (blockKey: string, choiceId: string) => {
        setAnswers(prev => {
            const block = blocks.find(b => b.key === blockKey);
            if (!block) return prev;

            if (block.kind === "sc") {
                return {...prev, [blockKey]: choiceId};
            }

            if (block.kind === "mc") {
                const arr = prev[blockKey] ?? [];
                const newArr = arr.includes(choiceId)
                    ? arr.filter((id: string) => id !== choiceId)
                    : [...arr, choiceId];

                return {...prev, [blockKey]: newArr};
            }

            return prev;
        });
    };

    const handleAnswerChange = (blockKey: string, value: any) =>
        setAnswers(prev => ({...prev, [blockKey]: value}));

    const validateAnswersBeforeSave = () => {
        const errors: string[] = [];
        const hasValid = (conds: any[]) => conds.every(c => {return c.value?.toString().trim() !== "";});
        blocks.forEach((b, index) => {
            const val = answers[b.key];
            switch (b.kind) {
                case "sc":
                    if (val === null) errors.push(`Single Choice (${index+1}) braucht eine Auswahl.`);
                    break;
                case "numeric":
                    if (!Array.isArray(val) || !hasValid(val)) errors.push(`Numerische Eingabe (${index+1}) braucht gültige Werte.`);
                    break;
                case "lineEquation":
                    if (!val?.m || !hasValid(val.m)) errors.push(`Geradengleichung (${index+1}): m benötigt eine Bedingung.`);
                    if (!val?.c || !hasValid(val.c)) errors.push(`Geradengleichung (${index+1}): c benötigt eine Bedingung.`);
                    break;
                case "freeText":
                case "freeTextInline":
                    if (!val || !val.trim()) errors.push(`Freitext Eingabe (${index+1}) darf nicht leer sein.`);
                    break;
                case "algebra":
                    if (!val || !val.trim()) errors.push(`Algebra Eingabe (${index+1}) darf nicht leer sein.`);
                    break;
                case "geoGebraPoints":
                    for (let i = 0; i < (b.attrs?.maxPoints ?? 0); i++) {
                        const pointName = getGeoGebraPointName(i, b.key);
                        const conds = answers[pointName];
                        if (!conds || !hasValid(conds.x) || !hasValid(conds.y)) {
                            errors.push(`GeoGebra Punkt ${pointName} (${index+1}) benötigt gültige Bedingungen für x und y.`);
                        }
                    }
                    break;
                case "geoGebraLines":
                    for (let i = 0; i < (b.attrs?.maxLines ?? 0); i++) {
                        const lineName = getGeoGebraLineName(i, b.key);
                        const conds = answers[lineName];
                        if (!conds || !hasValid(conds.m) || !hasValid(conds.c)) {
                            errors.push(`GeoGebra Linie ${lineName} (${index+1}) benötigt gültige Bedingungen für m und c.`);
                        }
                    }
                    break;
                case "geoGebraSlope":
                    if (!Array.isArray(val) || !hasValid(val)) errors.push(`Geogebra Steigung (${index+1}) braucht gültige Werte.`);
                    break;
            }
        });
        return errors;
    };

    const handleSaveAnswers = async () => {
        if (!id) return;
        const errors = validateAnswersBeforeSave();
        setLoading(true);
        try {
            const payload: Record<string, any> = {};
            blocks.forEach((b) => {
                let value: any;
                switch (b.kind) {
                    case "geoGebraPoints": {
                        value = {};
                        for (let i = 0; i < (b.attrs?.maxPoints ?? 0); i++) {
                            const pointName = getGeoGebraPointName(i, b.key);
                            if (answers[pointName]) {
                                const transformed = checkPointHasErrors(answers[pointName]);
                                if ("error" in transformed) {
                                    errors.push(`Geogebra Punkt (${b.key}): ${transformed.error}`);
                                    return;
                                }
                                value[pointName] = {x: answers[pointName]?.x?.map((e: any) => ({ ...e })) ?? [], y: answers[pointName]?.y?.map((e: any) => ({ ...e })) ?? [],};
                            }
                        }
                        break;
                    }
                    case "geoGebraLines": {
                        value = {};
                        for (let i = 0; i < (b.attrs?.maxLines ?? 0); i++) {
                            const lineName = getGeoGebraLineName(i, b.key);
                            if (answers[lineName]) {
                                const transformed = checkLineEquationHasErrors(answers[lineName]);
                                if ("error" in transformed) {
                                    errors.push(`Geogebra Linie (${b.key}): ${transformed.error}`);
                                    return;
                                }
                                value[lineName] = {m: answers[lineName]?.m?.map((e: any) => ({ ...e })) ?? [], c: answers[lineName]?.c?.map((e: any) => ({ ...e })) ?? [],};
                            }
                        }
                        break;
                    }
                    case "lineEquation": {
                        const rawAnswer = answers[b.key];
                        const transformed = checkLineEquationHasErrors(rawAnswer);
                        if ("error" in transformed) {
                            errors.push(`Geradengleichung (${b.key}): ${transformed.error}`);
                            return;
                        }
                        value = {m: rawAnswer?.m?.map((e: any) => ({ ...e })) ?? [], c: rawAnswer?.c?.map((e: any) => ({ ...e })) ?? [],};
                        break;
                    }
                    case "mc":
                        { const oldAnswers = answers[b.key] ?? [];
                        value = b.choices
                            .filter(choice => oldAnswers.includes(choice.id))
                            .map(choice => choice.id);
                        break; }
                    default:
                        value = answers[b.key] ?? [];
                }
                payload[b.key] = {type: b.kind, value};
            });
            if (errors.length > 0) {
                setSnackbarMessage(errors.join("\n"));
                setSnackbarOpen(true);
                return;
            }
            await updateQuestionAnswers(id, payload);
            navigate(`/preview/${id}`);
        } catch (err) {
            console.error("Failed to save answers:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <QuestionLayout question={question}>
                <MathJaxContext>
                    <Box sx={{minHeight: "100vh", py: 3, px: 2, display: "flex", flexDirection: "column", mt: 6}}>
                        <Paper elevation={0} sx={{p: 3, border: "2px solid #000"}}>
                            <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold">
                                Antworten definieren
                            </Typography>

                            {loading && <Typography>Loading…</Typography>}
                            {!loading && blocks.length === 0 && (
                                <Typography sx={{my: 2}}>Keine Antwort-Blöcke gefunden.</Typography>
                            )}

                            {!loading &&
                                blocks.map((b, idx) => (
                                    <Accordion key={b.key} sx={{mb: 1}}>
                                        <AccordionSummary expandIcon={<ExpandMore/>}>
                                            <Typography variant="subtitle1">
                                                {b.kind === "mc" ? `Multiple Choice (${b.key})` :
                                                    b.kind === "sc" ? `Single Choice (${b.key})` :
                                                        b.kind === "freeText" ? `Freitext (${idx + 1})` :
                                                            b.kind === "freeTextInline" ? `Freitext Inline (${idx + 1})` :
                                                                b.kind === "algebra" ? `Algebra Eingabe (${idx + 1})` :
                                                                    b.kind === "numeric" ? `Numerische Eingabe (${idx + 1})` :
                                                                        b.kind === "lineEquation" ? `Geradengleichung (${idx + 1})` :
                                                                           b.kind === "geoGebraSlope" ? `GeoGebra Steigungsdreieck (${idx + 1})` :
                                                                               b.kind === "geoGebraPoints" ? `GeoGebra Punkte (${idx + 1})` : `GeoGebra Linien (${idx + 1})`}
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {/* Multiple Choice */}
                                            {b.kind === "mc" && (
                                                <FormControl fullWidth>
                                                    <FormGroup>
                                                        {b.choices.map((choice: Choice) => (
                                                            <FormControlLabel
                                                                key={choice.id}
                                                                control={<Checkbox checked={(answers[b.key] ?? []).includes(choice.id)} onChange={() => toggleChoice(b.key, choice.id)}/>}
                                                                label={ <Box sx={{maxWidth: 400, width: 400, overflow: "hidden", wordBreak: "break-word",}}><MathJax dynamic><span dangerouslySetInnerHTML={{__html: choice.html || choice.text,}}/></MathJax></Box>}
                                                            />
                                                        ))}
                                                    </FormGroup>
                                                </FormControl>
                                            )}

                                            {/* Single Choice */}
                                            {b.kind === "sc" && (
                                                <FormControl fullWidth>
                                                    <FormGroup>
                                                        {b.choices.map((choice: Choice) => (
                                                            <FormControlLabel
                                                                key={choice.id}
                                                                control={<Checkbox checked={answers[b.key] === choice.id} onChange={() => toggleChoice(b.key, choice.id)}/>}
                                                                label={<MathJax dynamic><span dangerouslySetInnerHTML={{__html: choice.html || choice.text}}/></MathJax>}/>
                                                        ))}
                                                    </FormGroup>
                                                </FormControl>
                                            )}

                                            {/* Free Text */}
                                            {(b.kind === "freeText" || b.kind === "freeTextInline") && (
                                                <FormControl fullWidth>
                                                    <TextField
                                                        label="Erwartete Textantwort"
                                                        value={answers[b.key] ?? ""}
                                                        onChange={(e) => handleAnswerChange(b.key, e.target.value)}
                                                    />
                                                </FormControl>
                                            )}

                                            {/* Numeric */}
                                            {b.kind === "numeric" && (
                                                <NumericAnswer
                                                    conditions={answers[b.key] ?? [{operator: "=", value: ""}]}
                                                    onChange={(val) => handleAnswerChange(b.key, val)}
                                                />
                                            )}

                                            {/* Algebra */}
                                            {(b.kind === "algebra") && (
                                                <AlgebraAnswer
                                                    value={answers[b.key] ?? ""}
                                                    onChange={(val:string) =>{handleAnswerChange(b.key, val)}}
                                                />
                                            )}

                                            {/* Line Equation */}
                                            {b.kind === "lineEquation" && (
                                                <LineEquationAnswer
                                                    conditions={answers[b.key] ?? {
                                                        m: [{operator: "=", value: ""}],
                                                        c: [{operator: "=", value: ""}]
                                                    }}
                                                    onChange={(val) =>{handleAnswerChange(b.key, val)}}
                                                />
                                            )}

                                            {b.kind === "geoGebraLines" &&
                                                Array.from({length: b.attrs?.maxLines ?? 0}).map((_, i) => {
                                                    const lineName = getGeoGebraLineName(i, b.key);
                                                    const conds = answers[lineName] ?? {m: [{operator: "=", value: "", logic: "and"}], c: [{operator: "=", value: "", logic: "and"}]};
                                                    return (
                                                        <GeoGebraLineAnswer key={lineName} data={{name: lineName}} conditions={conds}
                                                            onChange={(next) => {
                                                                handleAnswerChange(lineName, next)
                                                            }}
                                                        />
                                                    );
                                                })
                                            }

                                            {b.kind === "geoGebraPoints" &&
                                                Array.from({length: b.attrs?.maxPoints ?? 0}).map((_, i) => {
                                                    const pointName = getGeoGebraPointName(i, b.key);
                                                    const conds = answers[pointName] ?? {
                                                        x: [{
                                                            operator: "=",
                                                            value: "",
                                                            logic: "and"
                                                        }], y: [{operator: "=", value: "", logic: "and"}]
                                                    };
                                                    return (
                                                        <GeoGebraPointAnswer key={pointName} data={{name: pointName}} conditions={conds}
                                                            onChange={(next) => {
                                                                handleAnswerChange(pointName, next)
                                                            }}
                                                        />
                                                    );
                                                })
                                            }

                                            {b.kind === "geoGebraSlope" &&
                                                <NumericAnswer
                                                    conditions={answers[b.key] ?? [{operator: "=", value: ""}]}
                                                    onChange={(val) => handleAnswerChange(b.key, val)}
                                                    alternateText={"Der korrekte Wert für Steigung m ist:"}
                                                />}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}

                            <Box sx={{mt: 3, display: "flex", justifyContent: "center", gap: 2}}>
                                <Button variant="outlined" onClick={() => navigate(`/editor/${id}`)}>Zurück</Button>
                                <Button variant="outlined" onClick={() => setOpenPreview(true)}>Vorschau</Button>
                                <Button variant="contained" startIcon={<Save/>} onClick={handleSaveAnswers}
                                        disabled={loading || !question?.isEditable}>
                                    {loading ? "Speichern…" : "Speichern"}
                                </Button>
                            </Box>

                            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
                                <DialogTitle>Vorschau</DialogTitle>
                                <DialogContent dividers>
                                    <Preview content={questionContentJson}/>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => setOpenPreview(false)}>Schließen</Button>
                                </DialogActions>
                            </Dialog>
                        </Paper>
                    </Box>

                    <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}
                              anchorOrigin={{vertical: "bottom", horizontal: "center"}}>
                        <Alert onClose={() => setSnackbarOpen(false)} severity="error" variant="filled"
                               sx={{whiteSpace: "pre-line"}}>
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>
                </MathJaxContext>
            </QuestionLayout>
        </MainLayout>
    );
}
