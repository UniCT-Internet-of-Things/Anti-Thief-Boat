import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Alert, Typography, Card, CardContent, CardActions, Grid, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import axios from "axios";
import { NavBar } from "../../components";
import { ContentWrapper, FormWrapper } from "../../components/Wrapper/style";

interface DeviceData {
    deviceId: string;
    username: string;
    targa: string;
    status?: number;
}

interface DeviceResponse {
    device: DeviceData;
    allerta: boolean;
    status?: number;
}

const ManagementPage: React.FC = () => {
    const [devices, setDevices] = useState<DeviceResponse[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [deviceId, setDeviceId] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [targa, setTarga] = useState<string>("");
    const [devEui, setDevEui] = useState<string>("");
    const [appKey, setAppKey] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        fetchDevices();
    }, []);
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.post("http://138.197.187.41:5000/devices", { "AuthToken": localStorage.getItem("AuthToken") });


            setDevices(response.data);
            setError("");
        } catch (err) {
            console.error("Error fetching devices", err);
            setError("Impossibile caricare i dispositivi. Riprova più tardi.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddDevice = async () => {
        try {
            setMessage("");

            const requestData = {
                deviceId,
                username,
                targa,
            };

            const response = await axios.post("http://138.197.187.41:5000/register", requestData, {
                headers: { "Content-Type": "application/json" }
            });

            console.log(response.data);

            setDevEui(response.data.respons.DevEui);
            setAppKey(response.data.respons.AppKey);
            setMessage("Device added successfully!");


            resetForm();
            fetchDevices();
        } catch (error) {
            console.error("Error adding device", error);
            setMessage("Error adding device.");
        }
    };

    const handleDeleteDevice = async (deviceId: string) => {
        try {
            setMessage("");


            await axios.get(`http://138.197.187.41:5000/delete/${deviceId}`);


            setDevices(devices.filter(item => item.device.deviceId !== deviceId));
            setMessage(`Device ${deviceId} deleted successfully!`);
        } catch (error) {
            console.error("Error deleting device", error);
            setMessage(`Error deleting device ${deviceId}.`);
        }
    };

    const handleAlarmAction = async (deviceId: string, payload: string) => {
        try {
            setMessage("");

            const requestData = {
                deviceId,
                AuthToken: localStorage.getItem("AuthToken"),
                payload
            };

            console.log(requestData);

            await axios.post("http://138.197.187.41:5000/switchst", requestData, {
                headers: { "Content-Type": "application/json" }
            });


            setMessage(`Alarm ${payload === "on" ? "activated" : "deactivated"} for device ${deviceId}`);


            const updatedDevices = devices.map(item => {
                if (item.device.deviceId === deviceId) {
                    return {
                        ...item,
                        device: {
                            ...item.device,
                            status: payload === "on" ? 1 : 0
                        }
                    };
                }
                return item;
            });

            setDevices(updatedDevices);
        } catch (error) {
            console.error(`Error ${payload === "on" ? "activating" : "deactivating"} alarm`, error);
            setMessage(`Error ${payload === "on" ? "activating" : "deactivating"} alarm for device ${deviceId}.`);
        }
    };

    const resetForm = () => {
        setDeviceId("");
        setUsername("");
        setTarga("");
        setShowForm(false);
    };

    const handleOpenForm = () => {
        setShowForm(true);
    };

    const getStatusColor = (status: number = 0) => {
        switch (status) {
            case 1:
                return 'success';
            case 0:
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <>
            <ContentWrapper>
                <NavBar />

                <Typography variant="h3" gutterBottom sx={{
                    color: "white",
                    fontFamily: "sans-serif",
                    margin: "2rem"
                }}>
                    Gestione Dispositivi
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ margin: "1rem 2rem" }}>{error}</Alert>
                )}

                {loading ? (
                    <Typography variant="body1" sx={{ margin: "2rem", color: "white" }}>
                        Caricamento dispositivi...
                    </Typography>
                ) : (
                    <Grid container spacing={3} sx={{ padding: "1rem 2rem" }}>
                        {/* Device cards */}
                        {devices.map((deviceItem) => (
                            <Grid item xs={12} sm={6} md={4} key={deviceItem.device.deviceId}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                                }}>
                                    <CardContent>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start'
                                        }}>
                                            <Typography variant="h5" component="div" gutterBottom>
                                                {deviceItem.device.deviceId}
                                            </Typography>
                                            <Box>
                                                <Chip
                                                    label={deviceItem.device.status ? "active" : "inactive"}
                                                    color={getStatusColor(deviceItem.device.status) as any}
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                />
                                                <IconButton
                                                    aria-label="delete"
                                                    color="error"
                                                    onClick={() => handleDeleteDevice(deviceItem.device.deviceId)}
                                                    sx={{ p: 0.5 }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" color="text.secondary">
                                            Utente: {deviceItem.device.username}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            Targa: {deviceItem.device.targa}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'space-between', padding: '16px' }}>
                                        <Box>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<NotificationsActiveIcon />}
                                                onClick={() => handleAlarmAction(deviceItem.device.deviceId, "on")}
                                                sx={{ mr: 1 }}
                                            >
                                                Allarme ON
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                startIcon={<NotificationsOffIcon />}
                                                onClick={() => handleAlarmAction(deviceItem.device.deviceId, "off")}
                                            >
                                                Allarme OFF
                                            </Button>
                                        </Box>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}

                        {/* Add new device card */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                        transform: 'translateY(-5px)'
                                    }
                                }}
                                onClick={handleOpenForm}
                            >
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <AddIcon sx={{ fontSize: 60, color: '#ffffff', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#ffffff' }}>
                                        Aggiungi Nuovo Dispositivo
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Registration form */}
                {showForm && (
                    <FormWrapper sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        padding: '2rem',
                        maxWidth: '500px',
                        margin: '2rem auto'
                    }}>
                        <Typography variant="h4" gutterBottom sx={{
                            color: "#333",
                            fontFamily: "sans-serif",
                            marginBottom: "1.5rem"
                        }}>
                            Registra nuovo dispositivo
                        </Typography>
                        <Box component="form" sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%"
                        }}>
                            <TextField
                                label="Device ID"
                                placeholder="test-1234"
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value)}
                                sx={{ marginBottom: "1.5rem", width: "100%" }}
                                fullWidth
                            />
                            <TextField
                                label="Username"
                                placeholder="Utente"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                sx={{ marginBottom: "1.5rem", width: "100%" }}
                                fullWidth
                            />
                            <TextField
                                label="Targa"
                                placeholder="LV00000"
                                value={targa}
                                onChange={(e) => setTarga(e.target.value)}
                                sx={{ marginBottom: "1.5rem", width: "100%" }}
                                fullWidth
                            />

                            {/* Buttons container - adjusted to be contained within form */}
                            <Box component="div" sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                width: "100%",
                                mt: 2,
                                px: 0
                            }}>
                                <Button
                                    variant="outlined"
                                    onClick={resetForm}
                                    sx={{ flex: 1, mr: 1 }}
                                >
                                    Annulla
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleAddDevice}
                                    sx={{ flex: 1, ml: 1 }}
                                >
                                    Aggiungi
                                </Button>
                            </Box>
                        </Box>
                    </FormWrapper>
                )}

                {/* Messages and confirmation */}
                <Box component="div" sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    margin: "1rem 2rem"
                }}>
                    {message && <Alert severity="success">{message}</Alert>}
                    {devEui && <Alert severity="info">{"DevEui: " + devEui}</Alert>}
                    {appKey && <Alert severity="info">{"AppKey: " + appKey}</Alert>}
                </Box>
            </ContentWrapper>
        </>
    );
};

export default ManagementPage;

