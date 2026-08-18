import React, {useEffect, useRef, useState} from 'react'
import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react'
import {Box} from '@mui/material'
import 'mathlive'
import {getInterpretedValue} from "../MathHelper/LineEquationValidator.tsx";

export const LineEquationAnswerComponent: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const mathfieldRef = useRef<any>(null)
    const [interpretation, setInterpretation] = useState<{ value: string, error: boolean }>({value: "", error: false});
    const value = node.attrs.value ?? "";

    useEffect(() => {
        const id = setTimeout(() => {
            if (!value) {
                setInterpretation({value: "", error: false});
                return;
            }
            const result = getInterpretedValue(value);
            setInterpretation(result);
        }, 120);
        return () => clearTimeout(id);
    }, [value]);

    useEffect(() => {
        if (mathfieldRef.current) {
            const mf = mathfieldRef.current
            mf.virtualKeyboardMode = "manual"
            mf.virtualKeyboardPolicy = "sandboxed";
            mf.smartMode = false;
            mf.menuBar = false
            window.mathVirtualKeyboard.layouts = {
                label: 'Custom',
                tooltip: 'Variables and numbers',
                rows: [
                    ['0','1','2','3','4','5','6','7','8','9','.', { label: '⌫', command: 'deleteBackward' }],
                    ['x', 'y'],
                    ['[+]', '[-]', '[*]', { label: ':', command: ['insert', "\\frac{#@}{#?}", '(', ')'] }, '[=]', "\\frac{#@}{#?}", '(', ')'],
                    [], [], []
                ]
            }
            document.body.style.setProperty('--keycap-height', '32px')
            document.body.style.setProperty('--keycap-font-size', '15px')
            mf.value = value || '';
            const handleInput = () => {
                const latex = mf.getValue('latex-expanded');
                updateAttributes({ value: latex });
            }
            const handleToggle = () => {
                window.mathVirtualKeyboard.show()
            }
            mf.addEventListener('input', handleInput);
            mf.addEventListener("focusin", handleToggle)
            return () => {
                mf.removeEventListener('input', handleInput);
                mf.removeEventListener("focusin", handleToggle)
            };
        }
    }, [updateAttributes]);

    return (
        <NodeViewWrapper as="span" className="numeric-input" style={{display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 0', margin: '0 2px',}}>
                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                    {/*// @ts-ignore*/}
                    <math-field
                        ref={mathfieldRef}
                        id={node.attrs.id}
                        style={{width: 380, border: '1px solid #ccc', borderRadius: 4, padding: '4px 8px', fontSize: '1rem',}}
                        virtual-keyboard-mode="manual"
                        virtual-keyboards="custom"
                    />
                    <Box sx={{mt: 0.5, fontSize: "0.75rem", color: interpretation?.error ? "warning.main" : "text.secondary", transition: "opacity 0.15s ease",}}>
                        {interpretation?.value && !interpretation.error && (
                            <>
                                <span>Interpretiert als: </span>
                                {/*// @ts-ignore*/}
                                <math-field
                                    read-only
                                    value={interpretation.value}
                                    style={{ fontSize: "0.85rem", minWidth: 100 }}
                                />                                   </>
                        )}
                        {interpretation?.error && (
                            <>
                                <span>Bitte einen korrekten Ausdruck eingeben.</span>
                            </>
                        )}
                    </Box>
                </Box>
        </NodeViewWrapper>
    )
}
