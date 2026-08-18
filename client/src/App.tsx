import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AppRoutes from "./routes/AppRoutes.tsx";
import theme from "./styles/theme.ts";
import { AuthProvider } from "./contexts/AuthContext.tsx";

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}
