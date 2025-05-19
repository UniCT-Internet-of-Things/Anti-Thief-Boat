
import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavBar } from "../../components";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ContentWrapper } from "../../components/Wrapper/style";


interface User {
    id: number;
    firstName: string;
    lastName: string;
    deviceId: string;
    devEui: string;
}

const columns: GridColDef[] = [

    { field: 'id', headerName: 'N°', width: 30 },
    { field: 'deviceId', headerName: 'DeviceId', width: 230 },
    { field: 'nome', headerName: 'Nome', width: 130 },
    { field: 'cognome', headerName: 'Cognome', width: 130 },
    { field: 'targa', headerName: 'Targa', width: 130 },
];

const DeviceListPage: React.FC = () => {
    const [rows, setRows] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);


    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get("http://138.197.187.41:5000/devices");
                //response.data.end_devices.... per leggere da ttn
                const fetchedDevices: User[] = response.data.map((device: any, index: number) => ({
                    id: index + 1,
                    deviceId: device.deviceId,
                    //devEui: device.ids.dev_eui,
                    nome: device.nome,
                    cognome: device.cognome,
                    targa: device.targa,
                }));
                setRows(fetchedDevices);
            } catch (error) {
                console.error("Error fetching devices", error);
            } finally { setLoading(false) }
        };
        fetchDevices();
    }, []);


    const MultipleDelete = async () => {
        if (selectedRows.length === 0) return;

        const devicesToDelete = rows.filter((row) => selectedRows.includes(row.id));

        const deleteRequests = devicesToDelete.map((device) =>
            axios.get(`http://138.197.187.41:5000/delete/${device.deviceId}`).catch((err) => { throw (err) }) // Catch errors to avoid stopping execution
        );

        const results = await Promise.allSettled(deleteRequests);

        const flag = results.every((result) => result.status === "fulfilled");
        results.every((result) => { console.log(result.status) });

        if (flag) {
            console.log("Selected devices deleted successfully");
            setRows((prevRows) => prevRows.filter((row) => !selectedRows.includes(row.id)));
            setSelectedRows([]);
        } else {
            console.error("Some deletions failed.");
        }
    };

    return (
        <>
            <NavBar />
            <ContentWrapper>
                <h1>Device List</h1>
                <Box>
                    <Paper sx={{ height: '100%', width: '100%' }}>
                        <DataGrid sx={{ height: '100%', width: '100%' }}
                            rows={rows}
                            columns={columns}
                            loading={loading}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            pageSizeOptions={[10]}
                            checkboxSelection
                            disableRowSelectionOnClick
                            onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                        />
                    </Paper>
                </Box>
                <Button variant="contained" sx={{ margin: "1rem" }} onClick={MultipleDelete}>Delete device</Button>
            </ContentWrapper>
        </>
    );
};

export default DeviceListPage;

