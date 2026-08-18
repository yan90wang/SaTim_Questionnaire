import React, {useEffect, useState} from "react";
import MainLayout from "../layouts/MainLayout";
import {Box, Card, CardContent, CardHeader, TextField, Typography} from "@mui/material";
import {useAuth} from "../contexts/AuthContext.tsx";
import {type FullUser, getUserById} from "../services/UserService.tsx";

const ProfilePage = () => {
    const {userId} = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<FullUser>({
        id: "",
        first_name: "",
        last_name: "",
        email: "",
    });
    useEffect(() => {
        if (!userId) return;
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const data = await getUserById(userId);
                setUser({
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                });
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [userId]);


    const handleChange = (field: "first_name" | "last_name" | "email", value: string) => {
        setUser(prev => ({...prev, [field]: value}));
    };

    return (
        <MainLayout>
            <Box sx={{minHeight: '100vh', py: 3, px: 2, display: 'flex', flexDirection: 'column', mt: 6}}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">Mein Profil</Typography>
                        <Typography color="textSecondary">Persönliche Daten bearbeiten</Typography>
                    </Box>
                </Box>
                <Card>
                    <CardHeader title="Benutzerdaten"/>
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2}}>
                        <TextField label="Vorname" fullWidth value={user.first_name}
                                   onChange={(e) => handleChange("first_name", e.target.value)} disabled={isLoading}/>
                        <TextField label="Nachname" fullWidth value={user.last_name}
                                   onChange={(e) => handleChange("last_name", e.target.value)} disabled={isLoading}/>
                        <TextField label="E-Mail" type="email" fullWidth value={user.email}
                                   onChange={(e) => handleChange("email", e.target.value)} disabled={isLoading}/>
                    </CardContent>
                </Card>
            </Box>
        </MainLayout>
    );
};

export default ProfilePage;
