import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { GeoGebraAnswerComponent } from './GeoGebraAnswerComponent';

export const GeoGebraAnswerNodeView = ({ node, editor }: any) => {
    const { materialId, width, height, maxPoints, maxLines, variant, value } = node.attrs;
    const geoGebraExtension = editor.extensionManager.extensions.find((ext: any) => ext.name === 'geoGebra');
    const onAnswerChange = geoGebraExtension?.options?.onAnswerChange;

    return (
        <NodeViewWrapper className="geogebra-node">
            <GeoGebraAnswerComponent
                materialId={materialId}
                width={width}
                height={height}
                maxPoints={maxPoints}
                maxLines={maxLines}
                variant={variant}
                value={value}
                onAnswerChange={(answer) => {
                    if (onAnswerChange) onAnswerChange({ id: node.attrs.id, ...answer });
                }}
            />
        </NodeViewWrapper>
    );
};
