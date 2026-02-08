import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Default to admin user for a seamless experience
    const [user, setUser] = useState({ username: 'admin', role: 'admin' });
    const [token, setToken] = useState('dummy-token');

    useEffect(() => {
        // Auth barrier removed
    }, [token]);

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                localStorage.setItem('token', data.token);
                setUser({ username: data.username, role: data.role });
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: "Network error" };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
