import React, {useEffect, useRef, useState} from 'react';
import {Alert, Snackbar} from "@mui/material";
import type {GeoGebraLine, GeoGebraSlope} from '../../../pages/utils/AnswerUtils.tsx';

interface GeoGebraAnswerComponentProps {
    materialId: string;
    width?: string | number;
    height?: string | number;
    onAnswerChange?: (answer: {
        kind: 'slope'
        value: GeoGebraSlope | null
    }) => void;
    value?: GeoGebraSlope
}

function pointUsedByOtherLine(applet: any, pointName: string, ignoreLine: string) {
    const objects = applet.getAllObjectNames();
    for (const name of objects) {
        if (name === ignoreLine) continue;
        const type = applet.getObjectType(name);
        if (["line", "segment", "ray"].includes(type)) {
            const def = applet.getCommandString(name);
            if (def.includes(pointName)) {
                return true;
            }
        }
    }
    return false;
}

function deleteLineAndUnusedPoints(applet: any, lineName: string) {
    const def = applet.getCommandString(lineName);
    const matches = def.match(/[A-Za-z0-9_]+/g);
    if (!matches || matches.length < 3) return;
    const p1 = matches[1];
    const p2 = matches[2];
    applet.deleteObject(lineName);
    if (!pointUsedByOtherLine(applet, p1, lineName)) {
        applet.deleteObject(p1);
    }
    if (!pointUsedByOtherLine(applet, p2, lineName)) {
        applet.deleteObject(p2);
    }
}

export const GeoGebraSlopeAnswerComponent: React.FC<GeoGebraAnswerComponentProps> = ({materialId, width = 800, height = 600, onAnswerChange, value}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<GeoGebraLine[]>([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const initialObjectsRef = useRef<Set<string>>(new Set());
    const [previousAnswerExists, setPreviousAnswerExists] = useState<boolean>(!!value)

    function resyncLines(applet: any) {
        const allObjects = applet.getAllObjectNames();
        const detectedLines: GeoGebraLine[] = [];
        const lineNames: string[] = [];

        allObjects.forEach((name: string) => {
            if (initialObjectsRef.current.has(name)) return;
            const type = applet.getObjectType(name);
            if (["line", "segment", "ray"].includes(type)) {
                lineNames.push(name);
                const line = extractLineData(applet, name);
                if (line) detectedLines.push(line);
            }
        });
        if (lineNames.length > 2) {
            const newest = lineNames[lineNames.length - 1];
            deleteLineAndUnusedPoints(applet, newest);
            applet.setMode(0);
            setSnackbarOpen(true);
        }
        setLines(detectedLines.slice(0, 2));
    }

    useEffect(() => {
        if (lines?.length == 2) {
            const geoGebraSlopeAnswer : GeoGebraSlope = {
                line1: lines[0].name,
                point1Line1: lines[0].point1,
                point2Line1: lines[0].point2,
                line2: lines[1].name,
                point1Line2: lines[1].point1,
                point2Line2: lines[1].point2
            }
            onAnswerChange?.({kind: 'slope', value: geoGebraSlopeAnswer});
        } else {
            onAnswerChange?.({ kind: 'slope', value: null });
        }
        }, [lines, onAnswerChange]);

    useEffect(() => {
        if (!value) return;
        if (value as GeoGebraSlope) {
            setPreviousAnswerExists(true);
        }
    }, [value]);

    useEffect(() => {
        if (!materialId || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        const params = {
            material_id: materialId,
            width,
            height,
            appletOnLoad: (applet: any) => {
                initialObjectsRef.current = new Set(
                    applet.getAllObjectNames()
                );
                setLines([]);
                if (previousAnswerExists && value) {
                    if (value as GeoGebraSlope) {
                        const line1: GeoGebraLine = {
                            name: value.line1,
                            m: 0,
                            c: 0,
                            point1: value.point1Line1,
                            point2: value.point2Line1
                        }
                        const line2: GeoGebraLine = {
                            name: value.line2,
                            m: 0,
                            c: 0,
                            point1: value.point1Line2,
                            point2: value.point2Line2
                        }
                        const newLines = [line1, line2];
                        setLines(newLines);
                        newLines.forEach(l => {
                            applet.evalCommand(`${l.point1.name} = (${l.point1.x}, ${l.point1.y})`);
                            applet.evalCommand(`${l.point2.name} = (${l.point2.x}, ${l.point2.y})`);
                            applet.evalCommand(`${l.name} = Segment(${l.point1.name}, ${l.point2.name})`);
                        });
                        newLines.forEach(l => {
                            applet.setFixed(l.name, true);
                        });
                    }
                }
                if (!previousAnswerExists) {
                    setLines([]);
                 }
                setPreviousAnswerExists(false);
                applet.registerAddListener(() => {
                    resyncLines(applet);
                });
                applet.registerUpdateListener(() => {
                    resyncLines(applet);
                });
                applet.registerRemoveListener(() => {
                    resyncLines(applet);
                });
                applet.registerClearListener(() => {
                    setLines([]);
                });
                applet.registerClientListener((event: any) => {
                    if (event.type === "undo" || event.type === "redo") {
                        resyncLines(applet);
                    }
                });
            }};
        const ggbApplet = new (window as any).GGBApplet(params, true);
        ggbApplet.inject(containerRef.current);
    }, [materialId, width, height]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div ref={containerRef} style={{ width, height }}/>
            <div style={{marginTop: 12, padding: 10, border: "1px solid #ccc", borderRadius: 8, width: typeof width === "number" ? width : `${width}px`, background: "#f3f6ff",}}>
                <strong>Erfasste Segmente für Geradensteigung:</strong>
                {lines.map((l) => (
                    <div key={l.name}>
                        <strong>Segment {l.name}</strong>
                        <div>
                            Punkt 1: ({l.point1.x.toFixed(2)}, {l.point1.y.toFixed(2)})
                        </div>
                        <div>
                            Punkt 2: ({l.point2.x.toFixed(2)}, {l.point2.y.toFixed(2)})
                        </div>
                    </div>
                ))}
            </div>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
                <Alert severity="warning" variant="filled">
                    Du kannst nur zwei Linien für das Steigungsdreieck zeichnen.
                </Alert>
            </Snackbar>
        </div>
    );
};

function extractLineData(applet: any, lineName: string): GeoGebraLine | null {
    try {
        const def = applet.getCommandString(lineName);
        const matches = def.match(/[A-Za-z0-9_]+/g);
        if (!matches || matches.length < 3) return null;

        const p1Name = matches[1];
        const p2Name = matches[2];

        const x1 = applet.getXcoord(p1Name);
        const y1 = applet.getYcoord(p1Name);
        const x2 = applet.getXcoord(p2Name);
        const y2 = applet.getYcoord(p2Name);

        const m = 2
        const c = 1

        return {
            name: lineName,
            m,
            c,
            point1: { name: p1Name, x: x1, y: y1 },
            point2: { name: p2Name, x: x2, y: y2 },
        };
    } catch {
        return null;
    }
}
