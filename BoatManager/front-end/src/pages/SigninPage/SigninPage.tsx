import React, { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { TextField, Button, Container, Typography, Box } from "@mui/material";

const SignIn: React.FC = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        name: "",
        surname: "",
    });

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true)

        setError("");

        try {
            console.log(formData);
            const response = await axios.post("http://138.197.187.41:5000/signin", formData);


            console.log("Response:", response);
            alert("Sign in successful!");

            setFormData({
                username: "",
                password: "",
                email: "",
                name: "",
                surname: "",
            });
        } catch (error) {
            console.error("Error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
            navigate("/");
        }
    };


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
                    padding: "3rem",
                    //borderRadius: "3rem",
                    background: "white"
                }}
            >

                <Typography variant="h4" color="black" gutterBottom>
                    Sign In
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Surname"
                        name="surname"
                        value={formData.surname}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Sign In
                    </Button>
                </form>
            </Container >
        </Box>
    );
};

export default SignIn;

