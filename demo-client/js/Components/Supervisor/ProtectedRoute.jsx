import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Loading';

function SupervisorProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/supervisor/login" state={{ from: location.pathname }} replace />;
    }

    if (user.role !== 'supervisor') {
        return <Navigate to="/supervisor/login" replace />;
    }

    return children;
}

export default SupervisorProtectedRoute;


