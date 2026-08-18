import React, {useEffect, useState} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {v4 as uuidv4} from 'uuid';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Typography
} from '@mui/material';
import QuestionLayout from '../../layouts/QuestionLayout';
import MainLayout from '../../layouts/MainLayout.tsx';
import {
    Algebra,
    FreeText,
    FreeTextInline,
    GeoGebra, GeoGebraSlopeNode,
    LatexDisplay,
    LineEquation,
    MCChoice,
    NumericInput,
    SingleChoice
} from "../../components/Editor/NodeEditorPlugins.tsx";
import Link from '@tiptap/extension-link';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import EditorToolbar from "../../components/Editor/EditorToolbar.tsx";
import TextAlign from '@tiptap/extension-text-align';
import {FontFamily, FontSize, TextStyle} from '@tiptap/extension-text-style';
import AddIcon from '@mui/icons-material/Add';
import {Preview} from "../../components/Editor/Preview.tsx";
import {loadQuestionForm, type Question, updateQuestionContent} from '../../services/EditorService.tsx';
import {useNavigate, useParams} from "react-router-dom";
import {Save as SaveIcon} from "@mui/icons-material";
import {MathJaxContext} from 'better-react-mathjax';
import Underline from '@tiptap/extension-underline';
import {InlineResizableImage} from "../../components/Editor/InlineResizableImage.tsx";

export default function QuestionEditorPage() {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({bulletList: {keepMarks: true}, orderedList: {keepMarks: true}}),
            TextStyle, FontSize, FontFamily, Underline, TextAlign.configure({ types: ['heading', 'paragraph', 'bulletList', 'orderedList'] }),
            Link, Table.configure({resizable: true, allowTableNodeSelection: true}), TableRow, TableCell, TableHeader, InlineResizableImage,
            MCChoice, FreeText, FreeTextInline, NumericInput, LineEquation, GeoGebraSlopeNode, GeoGebra, LatexDisplay, SingleChoice, Algebra
        ],
        content: '<p>Erstelle hier deine Aufgabe...</p>',
    });
    const navigate = useNavigate();
    const { id } = useParams();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const handleClickMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);
    const [openPreview, setOpenPreview] = React.useState(false);
    const handleOpenPreview = () => setOpenPreview(true);
    const handleClosePreview = () => setOpenPreview(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [question, setQuestion] = useState<Question>();

    const addMCChoiceBlock = () => {
        if (!editor) return;

        editor.chain().focus().insertContent({
            type: 'mcChoice', attrs: {
            id: uuidv4(), groupId: '', checked: false,},
            content: [{type: 'paragraph', content: [{ type: 'text', text: 'Option 1' }]}]
        }).run();
    };

    const addSingleChoiceBlock = () => {
        if (!editor) return;

        editor.chain().focus().insertContent({
            type: 'singleChoice',
            attrs: {id: uuidv4(), groupId: '', checked: false,},
            content: [{type: 'paragraph', content: [{ type: 'text', text: 'Option 1' }]}]
        }).run();
    };

    const addFreeText = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'freeText',
            attrs: { id: uuidv4() },
        }).run();
    };

    const addFreeTextInline = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'freeTextInline',
            attrs: { id: uuidv4(), placeholder: 'Antwort...' },
        }).run();
    };

    const addNumeric = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'numericInput',
            attrs: {id: uuidv4(), mode: 'numeric',},
        }).run();
    };

    const addLineEquation = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'lineEquation',
            attrs: {id: uuidv4(), mode: 'lineEquation',},
        }).run();
    };

    const addAlgebra = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'algebra',
            attrs: {id: uuidv4(), mode: 'algebra',},
        }).run();
    };

    const addGeoGebraPoints = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'geoGebra',
            attrs: {
                id: uuidv4(),
                variant: 'points',
                materialId: '',
                maxPoints: 1,
                maxLines: 0,
            },
        }).run();
    };

    const addGeoGebraLines = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'geoGebra',
            attrs: {
                id: uuidv4(),
                variant: 'lines',
                materialId: '',
                maxPoints: 0,
                maxLines: 1,
            },
        }).run();
    };

    const addGeoGebraSlopes = () => {
        if (!editor) return;
        editor.chain().focus().insertContent({
            type: 'geoGebraSlope',
            attrs: {
                id: uuidv4(),
                materialId: '',
            },
        }).run();
    };

    const handleSave = async () => {
        if (!editor || !id) return;
        const contentJson = editor.getJSON();
        const contentHtml = editor.getHTML();

        const mcChoicesWithoutGroup: string[] = [];
        const singleChoicesWithoutGroup: string[] = [];

        const checkMCChoices = (nodes: any[]) => {
            nodes.forEach((node) => {
                if (node.type === 'mcChoice' && (!node.attrs.groupId || node.attrs.groupId.trim() === '')) {
                    mcChoicesWithoutGroup.push(node.attrs.id || 'unknown');
                }
                if (node.content) checkMCChoices(node.content);
            });
        };

        const checkSCChoices = (nodes: any[]) => {
            nodes.forEach((node) => {
                if (node.type === 'singleChoice' && (!node.attrs.groupId || node.attrs.groupId.trim() === '')) {
                    singleChoicesWithoutGroup.push(node.attrs.id || 'unknown');
                }
                if (node.content) checkSCChoices(node.content);
            });
        };
        checkMCChoices(contentJson.content || []);
        checkSCChoices(contentJson.content || []);
        if (mcChoicesWithoutGroup.length > 0) {
            setSnackbar({
                open: true,
                message: `Bitte weisen Sie jeder MC Option eine Gruppe zu!`,
                severity: "error",
            });
            return;
        }

        if (singleChoicesWithoutGroup.length > 0) {
            setSnackbar({
                open: true,
                message: `Bitte weisen Sie jeder Single Choice Option eine Gruppe zu!`,
                severity: "error",
            });
            return;
        }
        try {
            await updateQuestionContent(id, contentJson, contentHtml);
            navigate(`/answers/${id}`);
            setSnackbar({
                open: true,
                message: "Aufgabe erfolgreich gespeichert!",
                severity: "success",
            });
        } catch (err) {
            console.error("Failed to save question:", err);
            setSnackbar({
                open: true,
                message: "Fehler beim Speichern der Aufgabe.",
                severity: "error",
            });
        }
    };

    useEffect(() => {
        if (!id || !editor) return;
        (async () => {
            try {
                const question = await loadQuestionForm(id);
                setQuestion(question);
                if (editor && question.contentJson) {
                    editor.commands.setContent(question.contentJson);
                }
            } catch (err) {
                console.error("Failed to load question:", err);
            }
        })();
    }, [id, editor]);

    return (
        <MainLayout>
            <QuestionLayout question={question}>
                <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3, px: 2, display: 'flex', flexDirection: 'column', mt: 6 }}>
                    <Paper elevation={0} sx={{ padding: 3, border: '2px solid #000' }}>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                            Aufgabe Erstellen
                        </Typography>
                        <Box sx={{border: '1px solid #ccc', borderRadius: 1, minHeight: 200, '& .ProseMirror': {outline: 'none'}}}>
                            <MathJaxContext>
                                <EditorToolbar editor={editor} />
                                <EditorContent editor={editor} />
                            </MathJaxContext>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Button variant="contained" onClick={handleClickMenu} startIcon={<AddIcon />}>
                                Antwort Typen hinzufügen
                            </Button>
                            <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseMenu}>
                                <MenuItem onClick={addMCChoiceBlock}>Multiple Choice Option</MenuItem>
                                <MenuItem onClick={addSingleChoiceBlock}>Single Choice Option</MenuItem>
                                <MenuItem onClick={addFreeText}>Freitext Block</MenuItem>
                                <MenuItem onClick={addFreeTextInline}>Freitext Inline</MenuItem>
                                <MenuItem onClick={addNumeric}>Numerisch</MenuItem>
                                <MenuItem onClick={addAlgebra}>Algebra</MenuItem>
                                <MenuItem onClick={addLineEquation}>Geradengleichung</MenuItem>
                                <MenuItem onClick={addGeoGebraPoints}>GeoGebra Applet – Punkte</MenuItem>
                                <MenuItem onClick={addGeoGebraLines}>GeoGebra Applet – Strecke, Gerade, etc.</MenuItem>
                                <MenuItem onClick={addGeoGebraSlopes}>GeoGebra Applet – Steigungsdreieck</MenuItem>
                            </Menu>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button variant="outlined" onClick={() => {navigate(`/meta/${id}`)}}>Zurück</Button>
                            <Button variant="outlined" onClick={handleOpenPreview}>Vorschau</Button>
                            <Button variant="contained" disabled={!question?.isEditable} startIcon={<SaveIcon />} onClick={handleSave}>Speichern</Button>
                        </Box>

                        <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullScreen>
                            <DialogTitle>Vorschau</DialogTitle>
                            <DialogContent dividers>
                                <Preview content={editor?.getJSON() || ''} />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleClosePreview}>Schließen</Button>
                            </DialogActions>
                        </Dialog>
                    </Paper>
                </Box>
            </QuestionLayout>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </MainLayout>
    );
}
