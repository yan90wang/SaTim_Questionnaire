import React, {useRef} from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {TextField} from '@mui/material'

export const FreeTextInlineAnswerComponent: React.FC<NodeViewProps> = ({node, updateAttributes}) => {
    const inputRef = useRef<HTMLInputElement>(null)

    return (
        <NodeViewWrapper as="span" className="free-text-inline" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px' }}>
            <TextField value={node.attrs.value || ''} onChange={(e) => updateAttributes?.({ value: e.target.value })} inputRef={inputRef} id={node.attrs.id} placeholder="Antwort..." size="small" variant="outlined" style={{ width: '8rem', minWidth: '4rem' }}/>
        </NodeViewWrapper>
    )
}
