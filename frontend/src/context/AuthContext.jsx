import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setUserToken(token);
        }
        setLoading(false);
    }, []);

    const loginUser = (token) => {
        localStorage.setItem('token', token);
        setUserToken(token);
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        setUserToken(null);
    };

    if (loading) return <div>Loading Auth...</div>;

    return (
        <AuthContext.Provider value={{ userToken, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};
