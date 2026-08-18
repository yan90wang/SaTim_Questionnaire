import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import React, { useState } from "react";
import {MathJax} from "better-react-mathjax";

export const MCChoiceAnswerComponent: React.FC<NodeViewProps> = ({ node }) => {
    const { groupId, selected } = node.attrs as { groupId?: string; selected?: boolean };
    const [isChecked, setIsChecked] = useState(selected || false);

    const renderChildren = (fragment: any): React.ReactNode[] => {
        const nodes: React.ReactNode[] = [];
        fragment?.forEach((child: any) => {
            if (child.type.name === "paragraph") {
                if (!child.content || child.content.size === 0) {
                    nodes.push(<p key={nodes.length}>&nbsp;</p>);
                } else {
                    nodes.push(
                        <div key={nodes.length} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {renderChildren(child.content)}
                        </div>
                    );
                }
            } else if (child.type.name === "text") {
                nodes.push(<span key={nodes.length}>{child.text}</span>);
            } else if (child.type.name === "latex") {
                const latex = child.attrs?.latex || "";
                nodes.push(<MathJax key={nodes.length} dynamic><span>{`\\(${latex}\\)`}</span></MathJax>);
            } else if (child.type.name === "image") {
                nodes.push(
                    <img key={nodes.length} src={child.attrs.src} style={{width: child.attrs.width || "auto", height: child.attrs.height || "auto",}}/>
                );
            } else if (child.content && child.content.size > 0) {
                nodes.push(<React.Fragment key={nodes.length}>{renderChildren(child.content)}</React.Fragment>);
            }
        });
        return nodes;
    };

    const toggle = () => {
        setIsChecked(prev => !prev);
    };

    return (
        <NodeViewWrapper
            className="mc-choice-wrapper"
            onClick={toggle}
            style={{display: "inline-flex", flexDirection: "row", alignItems: "center", padding: "0.5rem 1rem", marginRight: "0.5rem", verticalAlign: "top", gap: "0.5rem", cursor: "pointer", userSelect: "none",}}>
            <input type="checkbox" name={`group-${groupId || "default"}`} checked={isChecked} onClick={(e) => e.stopPropagation()} onChange={toggle} style={{marginBottom: "0.25rem", flexShrink: 0,}}/>

            <div className="mc-choice-content" style={{display: "flex", flexDirection: "column", gap: "4px", whiteSpace: "pre-wrap",}}>
                {renderChildren(node.content)}
            </div>
        </NodeViewWrapper>
    );
};
