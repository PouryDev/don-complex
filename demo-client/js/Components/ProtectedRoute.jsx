import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        // Redirect to login with the current path as state to redirect back after login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;

