import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import {Link as RouterLink} from 'react-router-dom';
import Link from '@mui/material/Link';
import type {ReactNode} from "react";
import {Button} from "@mui/material";
import { useEffect, useState } from "react";
import { getUserTeam } from "../services/TeamService.tsx";

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [teamId, setTeamId] = useState<number | null>(null);
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.href = "/";
    };

    useEffect(() => {
        const loadTeam = async () => {
            try {
                const team = await getUserTeam();
                setTeamId(team.id);
            } catch {
                setTeamId(null);
            }
        };

        loadTeam();
    }, []);

    return (
        <>
            <AppBar position="fixed" sx={{ width: '100%' }}>
                <Toolbar sx={{width: '100%', maxWidth: '100%', px: 2, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between'}}>
                    <Box>
                        {/*<Link component={RouterLink} to="/" color="inherit" underline="none" sx={{ mr: 2 }} variant="button">*/}
                        {/*    Home*/}
                        {/*</Link>*/}

                        {teamId !== null && (
                            <Link component={RouterLink} to="/dashboard" color="inherit" underline="none" sx={{ mr: 2 }} variant="button">
                            Erhebungen
                        </Link>)}

                        {teamId !== null && (
                        <Link component={RouterLink} to="/table" color="inherit" underline="none" sx={{ mr: 2 }} variant="button">
                            Aufgaben
                        </Link>)}

                        {teamId !== null && (
                        <Link component={RouterLink} to="/team" color="inherit" underline="none" sx={{ mr: 2 }} variant="button">
                            Team
                        </Link>)}

                        {teamId !== null && (
                            <Link component={RouterLink} to="/teachers" color="inherit" underline="none" sx={{ mr: 2 }} variant="button">
                                Lehrer
                            </Link>)}

                        <Link component={RouterLink} to="/profile" color="inherit" underline="none" variant="button">
                            Profil
                        </Link>
                    </Box>

                    <Box>
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <main style={{ padding: '2rem' }}>
                {children}
            </main>
        </>
    );
}
