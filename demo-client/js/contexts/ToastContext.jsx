import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../Components/Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full sm:w-auto pointer-events-none" dir="rtl">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast, index) => (
                        <div
                            key={toast.id}
                            className="pointer-events-auto"
                            style={{
                                zIndex: 50 + toasts.length - index,
                            }}
                        >
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                duration={toast.duration}
                                onClose={() => removeToast(toast.id)}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

