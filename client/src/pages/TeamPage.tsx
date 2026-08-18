import React, {useEffect, useState} from "react";
import MainLayout from "../layouts/MainLayout";
import {Alert, Box, Button, Card, CardContent, CardHeader, Snackbar, TextField, Typography} from "@mui/material";
import {useAuth} from "../contexts/AuthContext.tsx";
import {addUserToTeam, getUserTeam, type Team} from "../services/TeamService.tsx";
import {Add} from "@mui/icons-material";
import {searchUsers} from "../services/UserService.tsx";
import {Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Chip,} from "@mui/material";

const TeamPage = () => {
    const {userId} = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [team, setTeam] = useState<Team|null>(null);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [snackbar, setSnackbar] = useState({open: false, message: "", severity: "success" as "success" | "error",});

    useEffect(() => {
        if (!userId) return;
        const fetchTeam = async () => {
            setIsLoading(true);
            try {
                const teamData = await getUserTeam();
                setTeam(teamData);
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeam();
    }, [userId]);

    const handleSearch = async (value: string) => {
        setSearch(value);
        if (value.length < 2) {
            setResults([]);
            return;
        }
        setLoadingSearch(true);
        try {
            const data = await searchUsers(value);
            setResults(data);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleAddTeamMember = async (memberId: number) => {
        if (!team?.id) return;

        try {
            await addUserToTeam(team.id, memberId);
            const updated = await getUserTeam();
            setTeam(updated);
            setSnackbar({open: true, message: "Mitglied hinzugefügt", severity: "success",});
            setOpenAddDialog(false);
        } catch (err) {
            console.error("Failed to add member:", err);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <Typography>Loading...</Typography>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{minHeight: '100vh', py: 3, px: 2, display: 'flex', flexDirection: 'column', mt: 6}}>
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled" sx={{ width: "100%" }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4">Team Übersicht</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddDialog(true)}>
                        Mitglied hinzufügen
                    </Button>
                </Box>
                <Card>
                    <CardHeader title="Details"/>
                    <CardContent sx={{display: "flex", flexDirection: "column", gap: 2}}>
                        <TextField label="Team Id" fullWidth value={team?.id} slotProps={{input: { readOnly: true}}}/>
                        <TextField label="Team Name" fullWidth value={team?.name} slotProps={{input: { readOnly: true}}}/>
                        <TextField label="Team Beschreibung" type="email" fullWidth value={team?.description} slotProps={{input: { readOnly: true}}}/>
                    </CardContent>
                </Card>
                <br></br>
                <Card>
                    <CardHeader title="Mitglieder"></CardHeader>
                    <CardContent
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}>
                        {team?.users?.length ? (
                            team.users.map((member) => (
                                <Card
                                    key={member.id}
                                    variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1">
                                            {member.first_name} {member.last_name}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary">
                                            {member.email}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Typography color="text.secondary">
                                Keine Mitglieder gefunden
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth>
                <DialogTitle>Mitglied hinzufügen</DialogTitle>

                <DialogContent>
                    <TextField fullWidth label="Name oder Email" value={search} onChange={(e) => handleSearch(e.target.value)} sx={{ mt: 1 }}/>

                    <List>
                        {loadingSearch ? (
                            <Typography sx={{ mt: 2 }}>Suche...</Typography>
                        ) : (
                            results.map((user) => {
                                const alreadyInTeam =
                                    team?.users?.some((u) => u.id === user.id);

                                return (
                                    <ListItem
                                        key={user.id}
                                        secondaryAction={
                                            alreadyInTeam ? (<Chip label="Schon im Team" color="default" />) : (
                                                <Button size="small" variant="contained" onClick={() => handleAddTeamMember(user.id)}>
                                                    Hinzufügen
                                                </Button>)}>
                                        <ListItemText
                                            primary={`${user.first_name} ${user.last_name}`}
                                            secondary={user.email}
                                        />
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>
                        Schließen
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

export default TeamPage;
