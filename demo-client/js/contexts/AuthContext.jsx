import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { cartService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/user');
            setUser(response.data);
        } catch (error) {
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (phone, password) => {
        // Get device_id before login
        const deviceId = localStorage.getItem('device_id') || 
            (document.cookie.split(';').find(c => c.trim().startsWith('device_id='))?.split('=')[1]);
        
        const loginData = deviceId ? { phone, password, device_id: deviceId } : { phone, password };
        const response = await api.post('/login', loginData);
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        
        // Merge cart after login (device_id will be handled by middleware in the request)
        if (deviceId) {
            try {
                await cartService.mergeCart();
            } catch (err) {
                console.error('Failed to merge cart on login:', err);
                // Don't fail login if cart merge fails
            }
        }
        
        return response.data;
    };

    const register = async (name, phone, password, password_confirmation) => {
        const response = await api.post('/register', {
            name,
            phone,
            password,
            password_confirmation,
        });
        localStorage.setItem('auth_token', response.data.token);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            // Ignore errors
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

