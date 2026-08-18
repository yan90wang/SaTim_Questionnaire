import React from "react";
import {Box, Typography} from "@mui/material";
import GeneralLayout from "../layouts/GeneralLayout.tsx";

const NoTeamPage = () => {
    return (
        <GeneralLayout>
            <Box sx={{width: 600, mx: 'auto', mt: 12, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3, borderRadius: 2,}}>
                <Typography variant="h5" gutterBottom>
                    {"Sie sind derzeit keinem Team zugeordnet. Bitte wenden Sie sich an ein Teammitglied, damit Sie hinzugefügt werden können."}
                </Typography>
            </Box>
        </GeneralLayout>
    );
};

export default NoTeamPage;
