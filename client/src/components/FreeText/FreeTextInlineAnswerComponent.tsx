import React, {useRef} from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {TextField} from '@mui/material'

export const FreeTextInlineAnswerComponent: React.FC<NodeViewProps> = ({node, updateAttributes}) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const sizeMap: Record<"s" | "m" | "l", number> = {s: 120, m: 260, l: 380,};
    const size = (node.attrs.size as "s" | "m" | "l") || "l";
    const width = sizeMap[size];

    return (
        <NodeViewWrapper as="span" className="free-text-inline" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px' }}>
            <TextField value={node.attrs.value || ''} onChange={(e) => updateAttributes?.({ value: e.target.value })} inputRef={inputRef} id={node.attrs.id} placeholder="Antwort..." size="small" variant="outlined" style={{ width }}/>
        </NodeViewWrapper>
    )
}
