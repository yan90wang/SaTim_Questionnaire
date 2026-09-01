import React from "react";
import {NodeViewWrapper} from "@tiptap/react";
import {
    GeoGebraSlopeTriangleAnswerComponent
} from "./GeoGebraSlopeTriangleAnswerComponent.tsx";

export const GeoGebraSlopeTriangleAnswerNodeView = ({
    node,
    editor
}: any) => {

    const {
        materialId,
        width,
        height,
        value
    } = node.attrs;

    const extension =
        editor.extensionManager.extensions.find(
            (ext: any) =>
                ext.name === "geoGebraSlopeTriangle"
        );

    const onAnswerChange =
        extension?.options?.onAnswerChange;

    return (
        <NodeViewWrapper className="geogebra-node">

            <GeoGebraSlopeTriangleAnswerComponent
                materialId={materialId}
                width={width}
                height={height}
                value={value}
                onAnswerChange={(answer: any) => {

                    onAnswerChange?.({
                        id: node.attrs.id,
                        ...answer
                    });

                }}
            />

        </NodeViewWrapper>
    );
};