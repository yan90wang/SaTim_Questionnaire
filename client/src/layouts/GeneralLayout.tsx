import Box from '@mui/material/Box';
import type { ReactNode } from "react";

interface GeneralLayoutProps {
    children: ReactNode;
}

export default function GeneralLayout({ children }: GeneralLayoutProps) {
    return (
        <Box
            sx={{minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 3,}}
        >
            <main>
                {children}
            </main>
        </Box>
    );
}
