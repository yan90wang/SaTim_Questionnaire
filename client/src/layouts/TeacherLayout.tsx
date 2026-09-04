import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import {Link as RouterLink, useNavigate} from "react-router-dom";
import type {ReactNode} from "react";

interface TeacherLayoutProps {
    children: ReactNode;
    adminView?: boolean;
    teacherId?: string;
}

export default function TeacherLayout({children, adminView = false, teacherId}: TeacherLayoutProps) {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (adminView) {
            navigate("/teachers");
            return;
        }
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherId");
        window.location.href = "/";
    };

    const getTeacherPath = (path: string) => {
        if (adminView && teacherId) {
            return `/admin/teacher/${teacherId}/${path}`;
        }

        return `/teacher/${path}`;
    };

    return (
        <>
            {adminView && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "48px",
                        zIndex: 1301,
                        backgroundColor: "#c2410c",
                        color: "white",
                        px: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",

                        boxShadow: 2,
                    }}>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>
                            Administrator-Ansicht - Lehrer
                        </Typography>
                    </Box>

                    <Button
                        size="small"
                        onClick={() => navigate("/teachers")}
                        sx={{
                            backgroundColor: "white",
                            color: "#9a3412",

                            "&:hover": {
                                backgroundColor: "#ffedd5",
                            },
                        }}
                    >
                        Lehrpersonenansicht verlassen
                    </Button>
                </Box>
            )}

            <AppBar
                position="fixed"
                sx={{
                    width: "100%",
                    top: adminView ? "48px" : 0,
                }}
            >
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
                            to={getTeacherPath("classes")}
                            color="inherit"
                            underline="none"
                            sx={{mr: 3}}
                            variant="button"
                        >
                            Klassen
                        </Link>

                        <Link
                            component={RouterLink}
                            to={getTeacherPath("testboard")}
                            color="inherit"
                            underline="none"
                            sx={{mr: 3}}
                            variant="button"
                        >
                            Testübersicht
                        </Link>

                        <Link
                            component={RouterLink}
                            to={getTeacherPath("profile")}
                            color="inherit"
                            underline="none"
                            variant="button"
                        >
                            Profil
                        </Link>
                    </Box>

                    <Box>
                        {adminView ? (
                            <Typography variant="body2" fontWeight={700}>
                                Administrator-Ansicht
                            </Typography>
                        ) : (
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <main
                style={{
                    padding: "2rem",
                    marginTop: adminView
                        ? "112px"
                        : "64px",
                }}>
                {children}
            </main>
        </>
    );
}