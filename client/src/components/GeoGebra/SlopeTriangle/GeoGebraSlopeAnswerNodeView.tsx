import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import {GeoGebraSlopeAnswerComponent} from "./GeoGebraSlopeAnswerComponent.tsx";

export const GeoGebraSlopeAnswerNodeView = ({ node, editor }: any) => {
    const { materialId, width, height, value } = node.attrs;
    const geoGebraExtension = editor.extensionManager.extensions.find((ext: any) => ext.name === 'geoGebraSlope');
    const onAnswerChange = geoGebraExtension?.options?.onAnswerChange;

    return (
        <NodeViewWrapper className="geogebra-node">
            <GeoGebraSlopeAnswerComponent
                materialId={materialId}
                width={width}
                height={height}
                value={value}
                onAnswerChange={(answer: any) => {
                    if (onAnswerChange) onAnswerChange({ id: node.attrs.id, ...answer });
                }}
            />
        </NodeViewWrapper>
    );
};
