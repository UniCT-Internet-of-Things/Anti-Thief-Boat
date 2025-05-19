
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
                padding: 2,
                boxSizing: "border-box"
            }}
        >
            <Container
                component="main"
                maxWidth="xs"
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minWidth: 0,
                }}
            >
                <Typography variant="h3" color="error" sx={{ mb: 2 }}>
                    403 - Access Denied
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    You do not have permission to view this page.
                </Typography>
                <Button variant="contained" color="primary" onClick={() => navigate("/")}>
                    Go to Home
                </Button>
            </Container>
        </Box>
    );
};

export default Unauthorized;
