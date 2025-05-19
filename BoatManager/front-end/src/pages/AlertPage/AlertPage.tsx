import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    Modal,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    IconButton
} from '@mui/material';
import axios from "axios";
import { NavBar } from "../../components";
import { ContentWrapper } from "../../components/Wrapper/style";
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import SpeedIcon from '@mui/icons-material/Speed';
import ExploreIcon from '@mui/icons-material/Explore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface DeviceData {
    deviceId: string;
    username: string;
    targa: string;
    allerta: boolean;
    status: number;
}

interface DeviceResponse {
    device: DeviceData;
}

interface DeviceMonitorData {
    speed: number;
    direction: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

const AlertPage: React.FC = () => {
    const [devices, setDevices] = useState<DeviceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [monitorData, setMonitorData] = useState<DeviceMonitorData | null>(null);
    const [monitorLoading, setMonitorLoading] = useState<boolean>(false);
    const [monitorError, setMonitorError] = useState<string>("");

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;


        if (modalOpen && selectedDeviceId) {
            fetchDeviceMonitorData(selectedDeviceId);


            intervalId = setInterval(() => {
                fetchDeviceMonitorData(selectedDeviceId);
            }, 5000);
        }


        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [modalOpen, selectedDeviceId]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.post("http://138.197.187.41:5000/devices", { "AuthToken": localStorage.getItem("AuthToken") });

            console.log("API Response:", response.data);

            if (response.data.length > 0) {
                console.log("First device:", response.data[0]);
                console.log("allerta value:", response.data[0].device.allerta);
            }

            const alertDevices = response.data.filter((item: DeviceResponse) => item.device.allerta === true);

            console.log("Filtered devices:", alertDevices);

            setDevices(alertDevices);
            setError("");
        } catch (err) {
            console.error("Error fetching devices", err);
            setError("Impossibile caricare i dispositivi in allerta. Riprova più tardi.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDeviceMonitorData = async (deviceId: string) => {
        try {
            setMonitorLoading(true);
            setMonitorError("");

            console.log("Fetching monitor data for device:", deviceId);

            const response = await axios.post("http://138.197.187.41:5000/alertmonitor", {
                deviceId: deviceId,
                "AuthToken": localStorage.getItem("AuthToken")
            });

            console.log("Monitor data:", response.data);
            setMonitorData(response.data);
        } catch (err) {
            console.error("Error fetching monitor data", err);
            setMonitorError("Impossibile caricare i dati di monitoraggio. Riprova più tardi.");
        } finally {
            setMonitorLoading(false);
        }
    };

    const handleCardClick = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedDeviceId("");
        setMonitorData(null);
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
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
                    Dispositivi in Allerta
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ margin: "1rem 2rem" }}>{error}</Alert>
                )}

                {loading ? (
                    <Typography variant="body1" sx={{ margin: "2rem", color: "white" }}>
                        Caricamento dispositivi in allerta...
                    </Typography>
                ) : devices.length === 0 ? (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '200px',
                        margin: '2rem',
                        padding: '2rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px'
                    }}>
                        <Typography variant="h5" sx={{ color: "white", marginBottom: "1rem" }}>
                            Nessun dispositivo in allerta
                        </Typography>
                        <Typography variant="body1" sx={{ color: "white" }}>
                            Al momento non ci sono dispositivi che richiedono attenzione.
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3} sx={{ padding: "1rem 2rem" }}>
                        {/* Alert device cards */}
                        {devices.map((deviceItem) => (
                            <Grid item xs={12} sm={6} md={4} key={deviceItem.device.deviceId}>
                                <Card
                                    onClick={() => handleCardClick(deviceItem.device.deviceId)}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
                                        animation: 'blinkingBackground 2s infinite',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.03)'
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start'
                                        }}>
                                            <Typography variant="h5" component="div" gutterBottom sx={{ color: 'white' }}>
                                                {deviceItem.device.deviceId}
                                            </Typography>
                                            <Box>
                                                <Chip
                                                    icon={<WarningIcon />}
                                                    label="ALLERTA"
                                                    color="error"
                                                    variant="filled"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </Box>
                                        </Box>
                                        <Typography variant="body1" sx={{ color: 'white' }}>
                                            Utente: {deviceItem.device.username}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: 'white' }}>
                                            Targa: {deviceItem.device.targa}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: 'white',
                                                fontWeight: 'bold',
                                                marginTop: '1rem'
                                            }}
                                        >
                                            STATO: IN ALLARME
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                display: 'block',
                                                marginTop: '0.5rem'
                                            }}
                                        >
                                            Ultimo aggiornamento: {new Date().toLocaleTimeString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Device Details Modal */}
                <Modal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    aria-labelledby="device-details-modal"
                    aria-describedby="device-details-description"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '90%', sm: '80%', md: '60%' },
                        maxWidth: 700,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 2,
                        p: 4
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography id="device-details-modal" variant="h5" component="h2">
                                Dettagli Dispositivo: {selectedDeviceId}
                            </Typography>
                            <IconButton onClick={handleCloseModal} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>

                        {monitorLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {monitorError && (
                            <Alert severity="error" sx={{ mb: 3 }}>{monitorError}</Alert>
                        )}

                        {monitorData && (
                            <>
                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                            <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="h6">Velocità</Typography>
                                            <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                {monitorData.speed} kn/h
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                            <ExploreIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="h6">Direzione</Typography>
                                            <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                                                {monitorData.direction}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <TableContainer component={Paper} sx={{ mb: 3 }}>
                                    <Table aria-label="device data table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Parametro</TableCell>
                                                <TableCell align="right">Valore</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <DirectionsBoatIcon sx={{ mr: 1 }} /> Latitudine
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{monitorData.latitude}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <DirectionsBoatIcon sx={{ mr: 1 }} /> Longitudine
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{monitorData.longitude}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <AccessTimeIcon sx={{ mr: 1 }} /> Timestamp
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{formatTimestamp(monitorData.timestamp)}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Typography variant="caption" color="text.secondary">
                                    Dati aggiornati alle {new Date().toLocaleTimeString()}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Modal>
            </ContentWrapper>

            <style jsx global>{`
                @keyframes blinkingBackground {
                    0% { background-color: rgba(255, 0, 0, 0.7); }
                    50% { background-color: rgba(255, 50, 50, 0.5); }
                    100% { background-color: rgba(255, 0, 0, 0.7); }
                }
            `}</style>
        </>
    );
};

export default AlertPage;
