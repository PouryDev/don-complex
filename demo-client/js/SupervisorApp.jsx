import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import SupervisorLayout from './Components/Supervisor/Layout';
import SupervisorProtectedRoute from './Components/Supervisor/ProtectedRoute';
import Login from './Pages/Supervisor/Login';
import Dashboard from './Pages/Supervisor/Dashboard';
import Sessions from './Pages/Supervisor/Sessions';
import SessionDetails from './Pages/Supervisor/SessionDetails';
import ReservationDetails from './Pages/Supervisor/ReservationDetails';
import GameResults from './Pages/Supervisor/GameResults';
import NotFound from './Pages/NotFound';

function SupervisorApp() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Routes>
                    <Route path="/supervisor/login" element={<Login />} />
                    <Route element={<SupervisorLayout />}>
                        <Route 
                            path="/supervisor/dashboard" 
                            element={
                                <SupervisorProtectedRoute>
                                    <Dashboard />
                                </SupervisorProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/supervisor/sessions" 
                            element={
                                <SupervisorProtectedRoute>
                                    <Sessions />
                                </SupervisorProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/supervisor/sessions/:id" 
                            element={
                                <SupervisorProtectedRoute>
                                    <SessionDetails />
                                </SupervisorProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/supervisor/reservations/:id" 
                            element={
                                <SupervisorProtectedRoute>
                                    <ReservationDetails />
                                </SupervisorProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/supervisor/game-results" 
                            element={
                                <SupervisorProtectedRoute>
                                    <GameResults />
                                </SupervisorProtectedRoute>
                            } 
                        />
                        <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </ToastProvider>
        </AuthProvider>
    );
}

export default SupervisorApp;

