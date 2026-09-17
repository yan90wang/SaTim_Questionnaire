import React, {useEffect, useRef, useState } from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {Button, ButtonGroup, TextField} from "@mui/material";

export const AlgebraEditorComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const currentSize = (node.attrs.size as "s" | "m" | "l") || "l";
    const [showButtons, setShowButtons] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const setSize = (size: "s" | "m" | "l") => {updateAttributes({size});};

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowButtons(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <NodeViewWrapper as="span" ref={wrapperRef} className="numeric-editor" style={{display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 6, position: "relative", backgroundColor: '#fafafa', margin: '0 4px',}}>
            <TextField
                variant="outlined"
                size="small"
                slotProps={{input: {readOnly: true,},}}
                placeholder="Algebra Eingabe"
                style={{ width: '15rem', minWidth: '3rem' }}
                onClick={() => setShowButtons(prev => !prev)}
            />
            {showButtons && (
            <ButtonGroup size="small" variant="outlined" style={{position: "absolute", top: "100%", left: 0, marginTop: 2, pointerEvents: "auto", zIndex: 10}}>
                <Button variant={currentSize === "s" ? "contained" : "outlined"} onClick={() => setSize("s")}>
                    S
                </Button>
                <Button variant={currentSize === "m" ? "contained" : "outlined"} onClick={() => setSize("m")}>
                    M
                </Button>
                <Button variant={currentSize === "l" ? "contained" : "outlined"} onClick={() => setSize("l")}>
                    L
                </Button>
            </ButtonGroup>
            )}
        </NodeViewWrapper>
    )
}
