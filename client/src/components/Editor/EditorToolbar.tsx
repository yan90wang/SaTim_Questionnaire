import React, {useEffect, useReducer, useState} from 'react';
import {Editor} from '@tiptap/react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import ImageIcon from '@mui/icons-material/Image';
import FunctionsIcon from '@mui/icons-material/Functions';
import {uploadImage} from '../../services/EditorService.tsx';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CodeIcon from "@mui/icons-material/Code";

const fontFamilies = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
const fontSizes = ['12px', '14px', '16px', '18px', '24px', '32px'];

interface EditorToolbarProps {
    editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [open, setOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [tableDialogOpen, setTableDialogOpen] = useState(false);
    const [tableRows, setTableRows] = useState(2);
    const [tableCols, setTableCols] = useState(2);
    const [cellWidth, setCellWidth] = useState(100);
    const [latexDialogOpen, setLatexDialogOpen] = useState(false);
    const [latexCode, setLatexCode] = useState('');
    const [withHeaderRow, setWithHeaderRow] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [imageWidth, setImageWidth] = useState<number>(300);
    const [imageHeight, setImageHeight] = useState<number>(200);
    const [htmlDialogOpen, setHtmlDialogOpen] = useState(false);
    const [htmlCode, setHtmlCode] = useState("");

    useEffect(() => {
        if (!editor) return;
        editor.on('selectionUpdate', forceUpdate);
        editor.on('transaction', forceUpdate);
        return () => {
            editor.off('selectionUpdate', forceUpdate);
            editor.off('transaction', forceUpdate);
        };
    }, [editor]);

    if (!editor) return null;

    const handleInsertImage = async (url: string) => {
        (editor.chain().focus() as any).setImage({ src: url, width: imageWidth,height: imageHeight }).run();
        setImageUrl('');
        setOpen(false);
    };

    const handleFileUpload = async (file: File) => {
        try {
            setUploading(true);
            const data = await uploadImage(file);
            await handleInsertImage(data.url);
        } catch (err: any) {
            console.error(err);
            setErrorMessage('Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.');
            setShowError(true);
        } finally {
            setUploading(false);
        }
    };

    const handleInsertTable = (rows: number, cols: number, width: number, header: boolean) => {
        if (!editor) return;

        editor.chain().focus().insertTable({ rows, cols, withHeaderRow: header }).run();

        const { tr, doc } = editor.state;
        const tablePos = editor.state.selection.$from.before();
        const tableNode = doc.nodeAt(tablePos);
        if (tableNode?.type.name === 'table') {
            tableNode.descendants((node, pos) => {
                if (node.type.name === 'tableCell') {
                    tr.setNodeMarkup(pos, undefined, { colwidth: [width] });
                }
            });
            editor.view.dispatch(tr);
        }

        setTableDialogOpen(false);
    };

    const insertLatex = (code: string) => {
        editor.chain().focus().insertContent({ type: 'latex', attrs: { latex: code } }).run();
        setLatexCode('');
        setLatexDialogOpen(false);
    };

    const insertHtml = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        editor.chain().focus().insertContent(doc.body).run();
        setHtmlCode("");
        setHtmlDialogOpen(false);
    };

    return (
        <>
            {/* Toolbar */}
            <Paper elevation={1}
                sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, p: 1, mb: 2, backgroundColor: 'background.paper', borderRadius: 0,}}>
                <Select size="small" value={editor.getAttributes('textStyle').fontFamily || ''} onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()} displayEmpty sx={{ minWidth: 140 }}>
                    <MenuItem value="">Schriftart</MenuItem>
                    {fontFamilies.map(font => (
                        <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                            {font}
                        </MenuItem>
                    ))}
                </Select>

                <Select size="small" value={editor.getAttributes('textStyle').fontSize || ''} onChange={e => editor.chain().focus().setFontSize(e.target.value).run()} displayEmpty sx={{ minWidth: 120 }}>
                    <MenuItem value="">Schriftgröße</MenuItem>
                    {fontSizes.map(size => (
                        <MenuItem key={size} value={size} sx={{ fontSize: size }}>
                            {size}
                        </MenuItem>
                    ))}
                </Select>

                {/* Bold/Italic/Strike */}
                <Tooltip title="Fett">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        sx={{ color: editor.isActive('bold') ? 'primary.main' : 'text.secondary' }}>
                        <FormatBoldIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Kursiv">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        sx={{ color: editor.isActive('italic') ? 'primary.main' : 'text.secondary' }}>
                        <FormatItalicIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Durchgestrichen">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        sx={{ color: editor.isActive('strike') ? 'primary.main' : 'text.secondary' }}
                    >
                        <StrikethroughSIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Unterstrichen">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        sx={{ color: editor.isActive('underline') ? 'primary.main' : 'text.secondary' }}>
                        <FormatUnderlinedIcon />
                    </IconButton>
                </Tooltip>

                {/* Headings */}
                <Tooltip title="Überschrift 1">
                    <IconButton
                        onClick={() => {
                            if (editor.isActive('heading', { level: 1 })) {editor.chain().focus().setParagraph().run();
                            } else {editor.chain().focus().setHeading({ level: 1 }).run();}
                        }}
                        sx={{ color: editor.isActive('heading', { level: 1 }) ? 'primary.main' : 'text.secondary' }}>
                        <LooksOneIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Überschrift 2">
                    <IconButton
                        onClick={() => {
                            if (editor.isActive('heading', { level: 2 })) {editor.chain().focus().setParagraph().run();
                            } else {editor.chain().focus().setHeading({ level: 2 }).run();}
                        }}
                        sx={{ color: editor.isActive('heading', { level: 2 }) ? 'primary.main' : 'text.secondary' }}>
                        <LooksTwoIcon />
                    </IconButton>
                </Tooltip>


                {/* Lists */}
                <Tooltip title="Aufzählung">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        sx={{ color: editor.isActive('bulletList') ? 'primary.main' : 'text.secondary' }}
                    >
                        <FormatListBulletedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Nummerierte Liste">
                    <IconButton
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        sx={{ color: editor.isActive('orderedList') ? 'primary.main' : 'text.secondary' }}>
                        <FormatListNumberedIcon />
                    </IconButton>
                </Tooltip>

                {/* Align */}
                <Tooltip title="Links ausrichten">
                    <IconButton
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        sx={{ color: editor.isActive({ textAlign: 'left' }) ? 'primary.main' : 'text.secondary' }}
                    >
                        <FormatAlignLeftIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Zentrieren">
                    <IconButton
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        sx={{ color: editor.isActive({ textAlign: 'center' }) ? 'primary.main' : 'text.secondary' }}
                    >
                        <FormatAlignCenterIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Rechts ausrichten">
                    <IconButton
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        sx={{ color: editor.isActive({ textAlign: 'right' }) ? 'primary.main' : 'text.secondary' }}
                    >
                        <FormatAlignRightIcon />
                    </IconButton>
                </Tooltip>

                {/* Image */}
                <Tooltip title="Bild einfügen">
                    <IconButton sx={{ color: 'text.secondary' }} onClick={() => setOpen(true)}>
                        <ImageIcon />
                    </IconButton>
                </Tooltip>

                {/* Table */}
                <Tooltip title="Tabelle einfügen">
                    <IconButton sx={{ color: 'text.secondary' }} onClick={() => setTableDialogOpen(true)}>
                        <PlaylistAddIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Tabelle löschen">
                    <IconButton sx={{color: 'text.secondary'}} onClick={() => editor?.chain().focus().deleteTable().run()} disabled={!editor?.isActive('table')}>
                    <PlaylistRemoveIcon/>
                    </IconButton>
                </Tooltip>

                {/* LaTeX */}
                <Tooltip title="LaTeX einfügen">
                    <IconButton sx={{ color: 'text.secondary' }} onClick={() => setLatexDialogOpen(true)}>
                        <FunctionsIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="HTML einfügen">
                    <IconButton sx={{ color: "text.secondary" }} onClick={() => setHtmlDialogOpen(true)}><CodeIcon />
                    </IconButton>
                </Tooltip>
            </Paper>

            {/* Image Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Bild einfügen</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={1}>
                        Fügen Sie eine Bild-URL ein oder laden Sie eine Datei hoch.
                    </Typography>
                    <TextField fullWidth label="Bild URL" size="small" value={imageUrl} onChange={e => setImageUrl(e.target.value)} sx={{ mb: 2 }}/>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField label="Breite (px)" type="number" size="small" value={imageWidth} onChange={e => setImageWidth(Number(e.target.value))}/>
                        <TextField label="Höhe (px)" type="number" size="small" value={imageHeight} onChange={e => setImageHeight(Number(e.target.value))}/>
                    </Box>
                    <Box textAlign="center" sx={{ position: 'relative', display: 'inline-block' }}>
                        <Button variant="outlined" component="label" disabled={uploading} sx={{ minWidth: 160 }}>
                            {uploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
                            <input hidden type="file" accept="image/*" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);}}/>
                        </Button>

                        {uploading && (
                            <CircularProgress size={24} sx={{position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px',}}/>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Abbrechen</Button>
                    <Button disabled={!imageUrl} onClick={() => handleInsertImage(imageUrl)} variant="contained">
                        Einfügen
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Table Dialog */}
            <Dialog fullWidth open={tableDialogOpen} onClose={() => setTableDialogOpen(false)}>
                <DialogTitle>Neue Tabelle erstellen</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1}}>
                    <TextField type="number" label="Zeilen" value={tableRows} sx={{ mt: 2}} onChange={e => setTableRows(Number(e.target.value))} inputProps={{ min: 1 }}/>
                    <TextField type="number" label="Spalten" value={tableCols} onChange={e => setTableCols(Number(e.target.value))}/>
                    <TextField type="number" label="Zellenbreite (px)" value={cellWidth} onChange={e => setCellWidth(Number(e.target.value))} inputProps={{ min: 10 }}/>
                    <FormControlLabel control={<Checkbox checked={withHeaderRow} onChange={e => setWithHeaderRow(e.target.checked)} />} label="Mit Kopfzeile"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTableDialogOpen(false)}>Abbrechen</Button>
                    <Button variant="contained" onClick={() => handleInsertTable(tableRows, tableCols, cellWidth, withHeaderRow)}>
                        Einfügen
                    </Button>
                </DialogActions>
            </Dialog>

            {/* LaTeX Dialog */}
            <Dialog open={latexDialogOpen} onClose={() => setLatexDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>LaTeX Formel einfügen</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={1}>
                        Geben Sie die LaTeX-Formel ein (z.B. x^2 + y^2 = z^2)
                    </Typography>
                    <TextField fullWidth multiline minRows={2} label="LaTeX Code" value={latexCode} onChange={e => setLatexCode(e.target.value)}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLatexDialogOpen(false)}>Abbrechen</Button>
                    <Button disabled={!latexCode} onClick={() => insertLatex(latexCode)} variant="contained">
                        Einfügen
                    </Button>
                </DialogActions>
            </Dialog>

            {/* HTML Dialog */}
            <Dialog open={htmlDialogOpen} onClose={() => setHtmlDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>HTML einfügen</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" mb={1}>
                        HTML-Code einfügen
                    </Typography>
                    <TextField fullWidth multiline minRows={12} label="HTML" value={htmlCode} onChange={(e) => setHtmlCode(e.target.value)} sx={{"& textarea": {fontFamily: "monospace",},}}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHtmlDialogOpen(false)}>
                        Abbrechen
                    </Button>
                    <Button variant="contained" disabled={!htmlCode.trim()} onClick={() => insertHtml(htmlCode)}>
                        Einfügen
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={showError} autoHideDuration={5000} onClose={() => setShowError(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default EditorToolbar;
