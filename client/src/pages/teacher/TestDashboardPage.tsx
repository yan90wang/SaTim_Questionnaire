import React, {useEffect, useMemo, useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {PlayArrow,} from "@mui/icons-material";

import TeacherLayout from "../../layouts/TeacherLayout";
import {activateTestId, deactivateTest, getClassTests, type TeacherTest,} from "../../services/TestService";

const TestDashboardPage = () => {
    const [tests, setTests] = useState<TeacherTest[]>([]);
    const [search, setSearch] = useState("");

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const testData = await getClassTests();
                setTests(testData);
            } catch (err) {
                console.error(err);
                setSnackbar({open: true, message: "Tests konnten nicht geladen werden.", severity: "error",});
            }
        };

        load();
    }, []);

    /**
     * Filter tests by title or class name.
     */
    const filteredTests = useMemo(() => {
        const searchValue = search.toLowerCase().trim();

        if (!searchValue) {
            return tests;
        }

        return tests.filter((test) =>
            test.title.toLowerCase().includes(searchValue));
    }, [tests, search]);

    const groupedTests = useMemo(() => {
        return filteredTests.reduce<Record<string, TeacherTest[]>>(
            (groups, test) => {
                if (!groups[test.className]) {
                    groups[test.className] = [];
                }

                groups[test.className].push(test);

                return groups;
            },
            {}
        );
    }, [filteredTests]);


    const handleToggleTest = async (test: TeacherTest) => {
        try {
            if (test.active) {
                await deactivateTest(test.id);
            } else {
                await activateTestId(test.id);
            }
            setSnackbar({open: true, message: test.active ? "Test wurde deaktiviert." : "Test wurde aktiviert.", severity: "success",});
            setTests((currentTests) => currentTests.map((currentTest) => currentTest.id === test.id ? {...currentTest, active: !currentTest.active,} : currentTest));
        } catch (err) {
            console.error(err);
            setSnackbar({open: true, message: test.active ? "Test konnte nicht deaktiviert werden." : "Test konnte nicht aktiviert werden.", severity: "error",});
        }
    };

    return (
        <TeacherLayout>
            <Box sx={{maxWidth: 1100, mx: "auto", py: 4,}}>
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({...snackbar, open: false,})}>
                    <Alert severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Header */}
                <Box mb={4}>
                    <Typography variant="h4" fontWeight={600}>
                        Meine Tests
                    </Typography>

                    <Typography color="text.secondary" mt={1}>
                        Tests verwalten und für deine Klassen aktivieren.
                    </Typography>
                </Box>

                {/* Search */}
                <Card sx={{mb: 4}}>
                    <CardHeader title="Tests suchen"/>

                    <CardContent>
                        <TextField
                            fullWidth
                            label="Tests suchen"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* No results */}
                {Object.keys(groupedTests).length === 0 && (
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" textAlign="center">
                                Keine Tests gefunden.
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {/* Classes */}
                <Box display="flex" flexDirection="column" gap={4}>
                    {Object.entries(groupedTests).map(
                        ([className, classTests]) => (
                            <Card key={className}>
                                {/* Class header */}
                                <CardHeader
                                    title={
                                        <Typography variant="h5" fontWeight={600}>
                                            {className}
                                        </Typography>
                                    }
                                    subheader={`${classTests.length} ${classTests.length === 1 ? "Test" : "Tests"}`}
                                />

                                <CardContent sx={{pt: 0}}>
                                    {/* Table */}
                                    <Box sx={{width: "100%", overflowX: "auto",}}>
                                        <Box
                                            component="table"
                                            sx={{width: "100%", borderCollapse: "collapse",}}>
                                            <Box
                                                component="thead"
                                                sx={{borderBottom: "1px solid", borderColor: "divider",}}>
                                                <Box component="tr">
                                                    <Box component="th" sx={{textAlign: "left", p: 1.5,}}>
                                                        Test
                                                    </Box>

                                                    <Box component="th" sx={{textAlign: "left", p: 1.5,}}>
                                                        Status
                                                    </Box>

                                                    <Box component="th" sx={{textAlign: "right", p: 1.5,}}>
                                                        Aktion
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box component="tbody">
                                                {classTests.map(
                                                    (test) => (
                                                        <Box
                                                            component="tr"
                                                            key={test.id}
                                                            sx={{borderBottom: "1px solid", borderColor: "divider", "&:last-child": {borderBottom: "none",},}}>
                                                            {/* Test */}
                                                            <Box component="td" sx={{p: 1.5,}}>
                                                                <Typography fontWeight={500}>
                                                                    {test.title}
                                                                </Typography>

                                                                {test.description && (
                                                                    <Typography variant="body2" color="text.secondary" sx={{mt: 0.5,}}>
                                                                        {test.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>


                                                            {/* Status */}
                                                            <Box component="td" sx={{p: 1.5,}}>
                                                                <Chip
                                                                    size="small"
                                                                    label={test.active ? "Aktiv" : "Inaktiv"}
                                                                    color={test.active ? "success" : "default"}
                                                                />
                                                            </Box>

                                                            {/* Action */}
                                                            <Box component="td" sx={{p: 1.5, textAlign: "right",}}>
                                                                <Tooltip title={"Aktive Tests werden den SuS angezeigt, deaktivierte Tests nicht."}>
                                                                <Button
                                                                    variant={test.active ? "outlined" : "contained"}
                                                                    color={test.active ? "error" : "primary"}
                                                                    size="small"
                                                                    startIcon={!test.active ? (<PlayArrow/>) : undefined}
                                                                    onClick={() => handleToggleTest(test)}>
                                                                    {test.active ? "Deaktivieren" : "Aktivieren"}
                                                                </Button></Tooltip>
                                                            </Box>
                                                        </Box>
                                                    )
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )
                    )}
                </Box>
            </Box>
        </TeacherLayout>
    );
};

export default TestDashboardPage;
