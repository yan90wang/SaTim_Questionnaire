import React, {useEffect, useRef, useState} from 'react'
import {NodeViewWrapper, NodeViewContent, type NodeViewProps} from '@tiptap/react'
import {Button, ButtonGroup, TextField} from '@mui/material'

export const FreeTextInlineEditorComponent: React.FC<NodeViewProps> = ({node, updateAttributes}) => {
    const [showButtons, setShowButtons] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const currentSize = (node.attrs.size as "s" | "m" | "l") || "l";
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
        <NodeViewWrapper
            as="span"
            ref={wrapperRef}
            className="free-text-inline"
            style={{display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 4px", border: "1px solid #ccc", borderRadius: 6, backgroundColor: "#fafafa", margin: "0 4px", position: "relative", overflow: "visible",}}>
            <TextField
                variant="outlined"
                size="small"
                slotProps={{input: {readOnly: true,},}}
                onClick={(e) => {e.stopPropagation();setShowButtons(prev => !prev);}}
                placeholder="Freitext"
                style={{ width: '6rem', minWidth: '3rem' }}
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
            <NodeViewContent />
        </NodeViewWrapper>
    )
}
