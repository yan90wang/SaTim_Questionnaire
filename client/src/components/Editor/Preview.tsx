import React from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Algebra,
    FreeText,
    FreeTextInline,
    GeoGebra, GeoGebraSlopeNode,
    LineEquation,
    MCChoice,
    NumericInput,
    SingleChoice
} from './NodeAnswerPlugins.tsx';
import Link from '@tiptap/extension-link';
import {Table} from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import {FontFamily, FontSize, TextStyle} from '@tiptap/extension-text-style';
import type {JSONContent} from '@tiptap/core';
import {LatexDisplay} from "./NodeEditorPlugins.tsx";
import {MathJaxContext} from "better-react-mathjax";
import Underline from '@tiptap/extension-underline';
import type {GeoGebraLine, GeoGebraPoint, GeoGebraSlope} from "../../pages/utils/AnswerUtils.tsx";
import {InlineResizableImage} from "./InlineResizableImage.tsx";
import {Box} from "@mui/material";

interface PreviewProps {
    content: JSONContent | null;
    editorRef?: React.RefObject<ReturnType<typeof useEditor> | null>;
    onGeoGebraChange?: (answer: GeoGebraAnswer) => void;
}

export interface GeoGebraAnswer {
    id: string;
    kind: 'points' | 'lines' | 'slopes';
    value: GeoGebraPoint[] | GeoGebraLine[] | GeoGebraSlope[];
}

export const Preview: React.FC<PreviewProps> = ({ content, editorRef: previewEditorRef, onGeoGebraChange }) => {
    const previewEditor = useEditor({
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
            GeoGebra.configure({
                onAnswerChange: (answer: GeoGebraAnswer) => {
                    if (onGeoGebraChange) onGeoGebraChange(answer);
                },
            }),
            GeoGebraSlopeNode.configure({
                onAnswerChange: (answer: GeoGebraAnswer) => {
                    if (onGeoGebraChange) onGeoGebraChange(answer);
                },
            }),
            FreeText,
            FreeTextInline,
            NumericInput,
            LineEquation, Algebra,
            MCChoice, LatexDisplay, SingleChoice
        ],
        content: content || { type: 'doc', content: [] },
    });
    React.useEffect(() => {
        if (previewEditorRef) previewEditorRef.current = previewEditor;
        return () => {
            if (previewEditorRef) previewEditorRef.current = null;
        };
    }, [previewEditor, previewEditorRef]);

    return (
        <MathJaxContext>
            <Box
                sx={{width: "100%", backgroundColor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: 2, overflow: "hidden",
                    "& .tiptap": {maxWidth: "900px", margin: "0 auto", padding: {xs: "1.5rem", sm: "2.5rem",}, color: "text.primary", fontSize: "1rem", lineHeight: 1.7, "&:focus": {outline: "none",},
                        // TEXT
                        "& p": {margin: "0 0 1rem",},
                        "& h1": {fontSize: {xs: "1.7rem", sm: "2.1rem",}, fontWeight: 700, lineHeight: 1.25, margin: "1.5rem 0 1rem",},
                        "& h2": {fontSize: {xs: "1.4rem", sm: "1.7rem",}, fontWeight: 700, lineHeight: 1.3, margin: "1.5rem 0 1rem",},
                        "& h3": {fontSize: "1.25rem", fontWeight: 600, margin: "1.25rem 0 0.75rem",},

                        // LISTS
                        "& ul, & ol": {paddingLeft: "2rem", marginBottom: "1rem",},
                        "& li": {marginBottom: "0.4rem",},

                        // LINKS
                        "& a": {color: "primary.main", textDecoration: "underline",},

                        // BLOCKQUOTE

                        "& blockquote": {margin: "1.5rem 0", padding: "1rem 1.25rem", borderLeft: "4px solid", borderColor: "primary.main", backgroundColor: "action.hover", borderRadius: "0 8px 8px 0",},

                        // TABLES
                        "& table": {width: "100%", borderCollapse: "collapse", margin: "1.5rem 0",},
                        "& th, & td": {border: "1px solid", borderColor: "divider", padding: "0.7rem 0.9rem", verticalAlign: "top",},
                        "& th": {fontWeight: 700, backgroundColor: "action.hover",},

                        // IMAGES
                        "& img": {
                        display: "block", maxWidth: "100%", height: "auto", margin: "1.5rem auto", borderRadius: 2,},

                        // FREE TEXT
                        "& .free-text": {margin: "1rem 0", backgroundColor: "action.hover"},
                        "& .free-text-inline": {display: "inline-flex", alignItems: "center", margin: "0 0.25rem", border: "1px solid", borderColor: "divider", borderRadius: 1, backgroundColor: "action.hover", verticalAlign: "middle",},

                        // MC
                        "& .mc-choice": {
                        display: "flex", flexDirection: "column", width: "100%", margin: "1rem 0", padding: 0,},
                        "& .mc-choice-wrapper": {
                        display: "flex", width: "100%", boxSizing: "border-box", margin: "0.5rem 0", padding: "0.8rem 1rem", border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "background.default", transition: "border-color 0.15s ease, background-color 0.15s ease",
                            "&:hover": {
                            borderColor: "text.secondary", backgroundColor: "action.hover",},},

                        // SINGLE CHOICE
                        "& .single-choice": {display: "flex", flexDirection: "column", width: "100%", margin: "1rem 0", padding: 0,},
                        "& .single-choice-wrapper": {display: "flex", width: "100%", boxSizing: "border-box", margin: "0.5rem 0", padding: "0.8rem 1rem", border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "background.default", transition: "border-color 0.15s ease, background-color 0.15s ease",
                            "&:hover": {borderColor: "text.secondary", backgroundColor: "action.hover",},},

                        // NUMERIC INPUT
                        '& [data-type="numeric-input"]': {
                        display: "inline-flex", alignItems: "center", minWidth: "110px", height: "38px", margin: "0 0.25rem", padding: "0 0.75rem", border: "1px solid", borderColor: "divider", borderRadius: 1, backgroundColor: "action.hover", verticalAlign: "middle", transition: "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                            "&:hover": {
                            backgroundColor: "action.selected", borderColor: "text.secondary", boxShadow: 1,},
                        },
                        "& .numeric-input": {display: "inline-flex", verticalAlign: "middle", margin: "0 0.25rem",},
                        "& .numeric-input .MuiOutlinedInput-root": {
                        backgroundColor: "action.hover", borderRadius: 1, transition: "background-color 0.15s ease, box-shadow 0.15s ease",
                            "&:hover": {
                                backgroundColor: "action.selected",
                                "& .MuiOutlinedInput-notchedOutline": {borderColor: "text.secondary",},},
                            "&.Mui-focused": {
                                backgroundColor: "background.paper",
                                boxShadow: 2,
                                "& .MuiOutlinedInput-notchedOutline": {borderColor: "primary.main", borderWidth: 2,},},
                        },
                        "& .numeric-input .MuiInputBase-input": {backgroundColor: "transparent",},

                        // ALGEBRA
                        "& .algebra": {display: "inline-flex", alignItems: "center", minWidth: "160px", minHeight: "38px", margin: "0 0.25rem", padding: "0", verticalAlign: "middle",},


                        // LINE EQUATION
                        "& .line-equation": {
                        display: "inline-flex", alignItems: "center", minWidth: "180px", minHeight: "38px", margin: "0 0.25rem", padding: "0 0.75rem", border: "1px solid", borderColor: "divider", borderRadius: 1, backgroundColor: "background.default", verticalAlign: "middle",},

                        // MATH INPUTS (Algebra + Line Equation)
                        "& .mathfield-input": {
                            backgroundColor: "action.hover",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            padding: "4px 8px",
                            minHeight: "38px",
                            boxSizing: "border-box",

                            transition: "background-color 0.15s ease, border-color 0.15s ease",

                            "&:hover": {
                                backgroundColor: "action.selected",
                                borderColor: "text.secondary",
                            },

                            "&:focus-within": {
                                backgroundColor: "background.paper",
                                borderColor: "primary.main",
                            },
                        },

                        // GEOGEBRA
                        '& [data-type="geoGebra"]': {width: "100%", margin: "2rem 0", padding: "1rem", border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "background.default", overflow: "hidden",},
                        '& [data-type="geoGebraSlope"]': {width: "100%", margin: "2rem 0", padding: "1rem", border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "background.default", overflow: "hidden",},

                        // HORIZONTAL RULE
                        "& hr": {border: 0, borderTop: "1px solid", borderColor: "divider", margin: "2rem 0",},
                    },
                }}
            >
                <EditorContent editor={previewEditor}/>
            </Box>
        </MathJaxContext>
    );
};
