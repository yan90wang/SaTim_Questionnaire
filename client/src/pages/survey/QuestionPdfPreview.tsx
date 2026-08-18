import {EditorContent, useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {Box} from "@mui/material";
import {
    Algebra,
    FreeText,
    FreeTextInline,
    GeoGebra,
    GeoGebraSlopeNode,
    LineEquation,
    MCChoice,
    NumericInput,
    SingleChoice
} from "../../components/Editor/NodeAnswerPlugins";
import {FontFamily, FontSize, TextStyle} from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {InlineResizableImage} from "../../components/Editor/InlineResizableImage.tsx";
import {LatexDisplay} from "../../components/Editor/NodeEditorPlugins.tsx";
import {MathJaxContext} from "better-react-mathjax";
import React from "react";

interface Props {
    content: any;
}

const QuestionPdfPreview = ({ content }: Props) => {
    const editor = useEditor({
        editable: false,
        extensions: [
            StarterKit,
            TextStyle,
            FontSize,
            Underline,
            FontFamily,
            TextAlign.configure({ types: ['heading', 'paragraph', 'bulletList', 'orderedList'] }),
            Link,
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            InlineResizableImage,
            GeoGebra,
            GeoGebraSlopeNode,
            FreeText,
            FreeTextInline,
            NumericInput,
            LineEquation, Algebra,
            MCChoice, LatexDisplay, SingleChoice
        ],
        content,
        immediatelyRender: false,
    });

    if (!editor) return null;

    return (
        <Box sx={{width: "100%", backgroundColor: "white",}}>
            <MathJaxContext> <EditorContent editor={editor} /></MathJaxContext>;
        </Box>
    );
};

export default QuestionPdfPreview;