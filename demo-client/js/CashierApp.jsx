import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import CashierLayout from './Components/Cashier/Layout';
import CashierProtectedRoute from './Components/Cashier/ProtectedRoute';
import Login from './Pages/Cashier/Login';
import Dashboard from './Pages/Cashier/Dashboard';
import Reservations from './Pages/Cashier/Reservations';
import ReservationDetails from './Pages/Cashier/ReservationDetails';
import Transactions from './Pages/Cashier/Transactions';
import Orders from './Pages/Cashier/Orders';
import NotFound from './Pages/NotFound';

function CashierApp() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Routes>
                    <Route path="/cashier/login" element={<Login />} />
                    <Route element={<CashierLayout />}>
                        <Route 
                            path="/cashier/dashboard" 
                            element={
                                <CashierProtectedRoute>
                                    <Dashboard />
                                </CashierProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/cashier/reservations" 
                            element={
                                <CashierProtectedRoute>
                                    <Reservations />
                                </CashierProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/cashier/reservations/:id" 
                            element={
                                <CashierProtectedRoute>
                                    <ReservationDetails />
                                </CashierProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/cashier/transactions" 
                            element={
                                <CashierProtectedRoute>
                                    <Transactions />
                                </CashierProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/cashier/orders" 
                            element={
                                <CashierProtectedRoute>
                                    <Orders />
                                </CashierProtectedRoute>
                            } 
                        />
                        <Route path="/cashier" element={<Navigate to="/cashier/dashboard" replace />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </AuthProvider>
    );
}

export default CashierApp;


