import React, { useRef, useEffect } from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import { TextField } from '@mui/material'

export const FreeTextAnswerComponent: React.FC<NodeViewProps> = ({node, updateAttributes}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const autoResize = () => {
        if (!textareaRef.current) return
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }

    useEffect(() => {
        autoResize()
    }, [])

    return (
        <NodeViewWrapper className="free-text" style={{ width: '100%', margin: '8px 0' }}>
            <TextField onChange={(e) => updateAttributes?.({ value: e.target.value })} value={node.attrs.value || ''} inputRef={textareaRef} id={node.attrs.id} placeholder="Antwort hier eingeben..." multiline minRows={3} fullWidth variant="outlined" onInput={autoResize}/>
        </NodeViewWrapper>
    )
}
