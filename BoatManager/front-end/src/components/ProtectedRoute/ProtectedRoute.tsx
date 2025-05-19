import React, { useState, useEffect } from "react";
import { Navigate } from 'react-router-dom';
import { Links } from '../../constants';

interface ProtectedRouteProps {
    component: React.ComponentType;
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, allowedRoles }) => {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5000/check", {
                    method: "GET",
                    credentials: "include", // Importante per inviare i cookie
                });

                if (!response.ok) {
                    throw new Error("Errore nella verifica del ruolo");
                }

                const data = await response.json();
                setRole(data.role);
            } catch (err) {
                setError("Errore durante la verifica delle credenziali");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkUserRole();
    }, []);

    if (loading) {
        return <div>Caricamento in corso...</div>;
    }

    if (error || !role) {
        return <Navigate to={Links[5]} />; // Redirect a SignIn
    }

    if (allowedRoles.includes(role)) {
        return <Component />;
    } else {
        return <Navigate to="/unauthorized" />;
    }
};

export default ProtectedRoute;
