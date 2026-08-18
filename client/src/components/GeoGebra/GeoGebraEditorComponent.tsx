import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { TextField } from '@mui/material';

export const GeoGebraEditorComponent = ({ node, updateAttributes }: any) => {
    const { materialId, width, height, maxPoints, maxLines, variant } = node.attrs;

    return (
        <NodeViewWrapper
            className="geogebra-node"
            style={{border: '1px solid #ddd', padding: '16px', borderRadius: '8px', textAlign: 'center', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',}}>
            <p style={{ fontWeight: 'bold' }}>
                GeoGebra Applet – {variant === 'points' ? 'Punkte' : 'Linien'}
            </p>

            <TextField fullWidth label="GeoGebra Material ID" placeholder="z. B. mnb8hv7g" value={materialId} size="small" onChange={(e) => updateAttributes({ materialId: e.target.value })} sx={{ maxWidth: 400 }}/>

            {variant === 'points' && (
                <TextField
                    fullWidth
                    type="number"
                    label="Anzahl Antwortpunkte"
                    helperText="Wie viele Punkte sind erlaubt?"
                    value={maxPoints ?? ''}
                    size="small"
                    inputProps={{ min: 0 }}
                    onChange={(e) =>
                        updateAttributes({ maxPoints: Number(e.target.value) || 0 })
                    }
                    sx={{ maxWidth: 400 }}
                />
            )}

            {variant === 'lines' && (
                <TextField
                    fullWidth
                    type="number"
                    label="Anzahl Antwortlinien"
                    helperText="Wie viele Linien sind erlaubt?"
                    value={maxLines ?? ''}
                    size="small"
                    inputProps={{ min: 0 }}
                    onChange={(e) =>
                        updateAttributes({ maxLines: Number(e.target.value) || 0 })
                    }
                    sx={{ maxWidth: 400 }}
                />
            )}

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
