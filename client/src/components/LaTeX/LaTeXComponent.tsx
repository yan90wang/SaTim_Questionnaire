import {type NodeViewProps, NodeViewWrapper} from '@tiptap/react';
import {MathJax} from 'better-react-mathjax';
import React from "react";

export const LaTeXComponent: React.FC<NodeViewProps> = ({ node }) => {
    const latex = node.attrs.latex || '';

    return (
        <NodeViewWrapper
            as="span"
            style={{display: 'inline-flex', verticalAlign: 'middle', margin: '0 2px', padding: '2px 4px', backgroundColor: '#fefefe',}}>
            <MathJax dynamic>
                <span>{`\\(${latex}\\)`}</span>
            </MathJax>
        </NodeViewWrapper>
    );
};
