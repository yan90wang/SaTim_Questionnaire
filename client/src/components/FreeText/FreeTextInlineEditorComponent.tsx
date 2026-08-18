import React from 'react'
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { TextField } from '@mui/material'

export const FreeTextInlineEditorComponent: React.FC<NodeViewProps> = () => {
    return (
        <NodeViewWrapper
            as="span"
            className="free-text-inline"
            style={{display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 6, backgroundColor: '#fafafa', margin: '0 4px',}}
        >
            <TextField
                variant="outlined"
                size="small"
                disabled={true}
                placeholder="Freitext"
                style={{ width: '6rem', minWidth: '3rem' }}
            />
            <NodeViewContent />
        </NodeViewWrapper>
    )
}
