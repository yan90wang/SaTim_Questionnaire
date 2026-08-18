import React, {useEffect, useRef, useState} from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {TextField} from '@mui/material'
import 'mathlive'

export const NumericAnswerComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [value, setValue] = useState(node.attrs.value || '')
    const sizeMap: Record<'s' | 'm' | 'l', number> = {
        s: 100,
        m: 220,
        l: 380,
    }
    const size = (node.attrs.size as 's' | 'm' | 'l') || 'l'
    const width = sizeMap[size]

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [value])

    return (
        <NodeViewWrapper as="span" className="numeric-input" style={{display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 0', margin: '0 2px',}}>
        <TextField
                    value={value}
                    id={node.attrs.id}
                    onChange={e => {
                        let input = e.target.value;
                        input = input.replace(',', '.');
                        input = input.replace(/[^0-9.-]/g, '');
                        if ((input.match(/-/g) || []).length > 1) {
                            input = input.replace(/-/g, '');
                            input = '-' + input;
                        } else if (input.indexOf('-') > 0) {
                            input = input.replace(/-/g, '');
                            input = '-' + input;
                        }
                        const parts = input.split('.');
                        if (parts.length > 2) {
                            input = parts[0] + '.' + parts.slice(1).join('');
                        }
                        if (parts[1]?.length > 5) {
                            input = parts[0] + '.' + parts[1].slice(0, 5);
                        }
                        setValue(input);
                        updateAttributes({ value: input });
                    }}
                    placeholder="1.12345"
                    size="small"
                    variant="outlined"
                    inputRef={textareaRef}
                    sx={{ width , backgroundColor: "white"}}
        />
        </NodeViewWrapper>
    )
}
