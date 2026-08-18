import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";

interface StudentLayoutProps {
    children: ReactNode;
}

export default function StudentLayout({
                                          children,
                                      }: StudentLayoutProps) {
    const handleLogout = () => {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("studentId");

        window.location.href = "/";
    };

    return (
        <>
            <AppBar position="fixed" sx={{ width: "100%" }}>
                <Toolbar
                    sx={{
                        width: "100%",
                        px: 2,
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        <Link
                            component={RouterLink}
                            to="/student/tests"
                            color="inherit"
                            underline="none"
                            sx={{ mr: 3 }}
                            variant="button"
                        >
                            Tests
                        </Link>

                        <Link
                            component={RouterLink}
                            to="/student/profile"
                            color="inherit"
                            underline="none"
                            variant="button"
                        >
                            Profil
                        </Link>
                    </Box>

                    <Box>
                        <Button
                            color="inherit"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>

            </AppBar>

            <main style={{padding: "2rem", marginTop: "64px",}}>
                {children}
            </main>
        </>
    );
}