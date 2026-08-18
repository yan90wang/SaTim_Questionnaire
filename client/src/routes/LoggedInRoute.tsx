import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

interface LoggedInRouteProps {
    children: ReactNode;
}

const LoggedInRoute = ({ children }: LoggedInRouteProps) => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default LoggedInRoute;