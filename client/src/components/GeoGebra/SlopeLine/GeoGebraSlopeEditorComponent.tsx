import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { TextField } from '@mui/material';

export const GeoGebraSlopeEditorComponent = ({ node, updateAttributes }: any) => {
    const { materialId, width, height} = node.attrs;

    return (
        <NodeViewWrapper
            className="geogebra-node"
            style={{border: '1px solid #ddd', padding: '16px', borderRadius: '8px', textAlign: 'center', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',}}>
            <p style={{ fontWeight: 'bold' }}>
                GeoGebra Applet Steigungsdreieck
            </p>

            <TextField fullWidth label="GeoGebra Material ID" placeholder="z. B. mnb8hv7g" value={materialId} size="small" onChange={(e) => updateAttributes({ materialId: e.target.value })} sx={{ maxWidth: 400 }}/>

            {materialId && (
                <iframe
                    src={`https://www.geogebra.org/material/iframe/id/${materialId}`}
                    width={width}
                    height={height}
                    style={{ border: 'none' }}
                    title="GeoGebra Applet"
                />
            )}
        </NodeViewWrapper>
    );
};
