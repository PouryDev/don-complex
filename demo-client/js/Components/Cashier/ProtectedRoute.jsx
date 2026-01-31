import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Loading';

function CashierProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/cashier/login" state={{ from: location.pathname }} replace />;
    }

    if (user.role !== 'cashier') {
        return <Navigate to="/cashier/login" replace />;
    }

    return children;
}

export default CashierProtectedRoute;

