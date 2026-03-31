import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { userToken } = useContext(AuthContext);

    if (!userToken) {
        return <Navigate to="/login" replace />;
    }

    return children;
};
