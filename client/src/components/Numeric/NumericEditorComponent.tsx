import React, {useEffect, useRef, useState} from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {Button, ButtonGroup, TextField} from '@mui/material'

export const NumericEditorComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const currentSize = node.attrs.size || 'l'
    const setSize = (size: 's' | 'm' | 'l') => {updateAttributes({ size })}
    const [showButtons, setShowButtons] = useState(false)
    const wrapperRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowButtons(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <NodeViewWrapper ref={wrapperRef} key={node.attrs.size} as="span" className="numeric-editor" style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '2px 4px', border: '1px solid #ccc', borderRadius: 6, backgroundColor: '#fafafa', margin: '0 4px', position: 'relative'}}>
            <TextField
                variant="outlined"
                size="small"
                inputProps={{ readOnly: true }}
                placeholder="Num"
                style={{ width: '4rem'}}
                onClick={() => setShowButtons((prev) => !prev)}
            />
            {showButtons && (
            <ButtonGroup size="small" variant="outlined" style={{position: 'absolute', top: '100%', left: 0, marginTop: 2, pointerEvents: 'auto', zIndex: 10,}}>
                <Button variant={currentSize === 's' ? 'contained' : 'outlined'} onClick={() => setSize('s')}>S</Button>
                <Button variant={currentSize === 'm' ? 'contained' : 'outlined'} onClick={() => setSize('m')}>M</Button>
                <Button variant={currentSize === 'l' ? 'contained' : 'outlined'} onClick={() => setSize('l')}>L</Button>
            </ButtonGroup>)}
        </NodeViewWrapper>
    )
}
