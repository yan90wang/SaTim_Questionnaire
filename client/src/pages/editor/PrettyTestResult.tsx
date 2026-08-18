import {Box, Paper, Typography} from "@mui/material";

export default function PrettyTestResult({ result }: { result: any }) {
    if (!result)
        return <Typography>Keine Daten vorhanden.</Typography>;

    if (result.error)
        return (
            <Typography color="error">
                {result.error}
            </Typography>
        );

    function formatValue(value: any) {
        if (value === null || value === undefined) return "–";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
                <Typography variant="h6">
                    Ergebnis
                </Typography>
                <Typography variant="body1">
                    Richtig: <strong>{result.score ?? "-"}</strong> / {result.total ?? "-"}
                </Typography>
            </Box>

            {Array.isArray(result.details) && result.details.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Details:
                    </Typography>

                    {result.details.map((d: any, i: number) => (
                        <Paper
                            key={i}
                            sx={{p: 2, mb: 1, backgroundColor: d.correct ? "#e8f5e9" : "#ffebee", border: "1px solid", borderColor: d.correct ? "#2e7d32" : "#c62828",}}>
                            <Typography variant="body1">
                                <strong>Frage:</strong> {d.key}
                            </Typography>

                            <Typography variant="body2">
                                <strong>Ihre Antwort:</strong>{" "}
                                {formatValue(d.given)}
                            </Typography>

                            <Typography variant="body2">
                                <strong>Erwartet:</strong>{" "}
                                {formatValue(d.expected)}
                            </Typography>

                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                <strong>Status:</strong>{" "}
                                {d.correct ? "✔Richtig" : "Falsch"}
                            </Typography>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
}
