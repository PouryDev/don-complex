import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './Components/ProtectedRoute';
import Layout from './Components/Layout';
import Intro from './Components/Intro';
import Home from './Pages/Home';
import Menu from './Pages/Menu';
import Orders from './Pages/Orders';
import Profile from './Pages/Profile';
import Invoices from './Pages/Invoices';
import Admin from './Pages/Admin';
import MenuManagement from './Pages/Admin/MenuManagement';
import Auth from './Pages/Auth';
import NotFound from './Pages/NotFound';
import Book from './Pages/Book';
import BranchSessions from './Pages/BranchSessions';
import SessionDetails from './Pages/SessionDetails';
import MySessions from './Pages/MySessions';
import News from './Pages/News';
import { registerNavigate } from './helpers/navigation';

function MainApp() {
    const navigate = useNavigate();
    const [showIntro, setShowIntro] = useState(true);

    // Register navigate function for use outside React context (e.g., in axios interceptors)
    useEffect(() => {
        registerNavigate(navigate);
    }, [navigate]);

    // Check if intro should be shown
    useEffect(() => {
        const introShown = sessionStorage.getItem('intro_shown');
        if (introShown === 'true') {
            setShowIntro(false);
        }
    }, []);

    const handleIntroComplete = () => {
        setShowIntro(false);
    };

    return (
        <AuthProvider>
            <ToastProvider>
                <CartProvider>
                {showIntro && <Intro onComplete={handleIntroComplete} />}
                <Routes>
                    {/* All routes with layout */}
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
                        
                        {/* Auth routes - public but inside layout */}
                        <Route path="/login" element={<Auth />} />
                        <Route path="/register" element={<Auth />} />
                        
                        {/* News - public */}
                        <Route path="/news" element={<News />} />
                        
                        {/* Protected routes */}
                        <Route 
                            path="/book" 
                            element={
                                <ProtectedRoute>
                                    <Book />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/book/branch/:branchId/sessions" 
                            element={
                                <ProtectedRoute>
                                    <BranchSessions />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/book/session/:sessionId" 
                            element={
                                <ProtectedRoute>
                                    <SessionDetails />
                                </ProtectedRoute>
                            } 
                        />
                        {/* MySessions is now in Profile page, but keep route for direct access */}
                        <Route 
                            path="/my-sessions" 
                            element={
                                <ProtectedRoute>
                                    <MySessions />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/orders" 
                            element={
                                <ProtectedRoute>
                                    <Orders />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/profile" 
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/invoices" 
                            element={
                                <ProtectedRoute>
                                    <Invoices />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/admin" 
                            element={
                                <ProtectedRoute requireAdmin={true}>
                                    <Admin />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/admin/menu" 
                            element={
                                <ProtectedRoute requireAdmin={true}>
                                    <MenuManagement />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
                </CartProvider>
            </ToastProvider>
        </AuthProvider>
    );
}

export default MainApp;

