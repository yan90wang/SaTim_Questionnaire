import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";

interface TeacherLayoutProps {
    children: ReactNode;
}

export default function TeacherLayout({
                                          children,
                                      }: TeacherLayoutProps) {
    const handleLogout = () => {
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherId");

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
                            to="/teacher/classes"
                            color="inherit"
                            underline="none"
                            sx={{ mr: 3 }}
                            variant="button"
                        >
                            Klassen
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/teacher/testboard"
                            color="inherit"
                            underline="none"
                            sx={{ mr: 3 }}
                            variant="button"
                        >
                            Testübersicht
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/teacher/profile"
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

            <main
                style={{
                    padding: "2rem",
                    marginTop: "64px",
                }}
            >
                {children}
            </main>
        </>
    );
}