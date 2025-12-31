import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getToastStyles = () => {
        const styles = {
            success: {
                gradient: 'from-green-500 to-emerald-600',
                bg: 'bg-green-50',
                border: 'border-green-300',
                text: 'text-green-800',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
            },
            error: {
                gradient: 'from-red-500 to-rose-600',
                bg: 'bg-red-50',
                border: 'border-red-300',
                text: 'text-red-800',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
            },
            warning: {
                gradient: 'from-yellow-500 to-red-600',
                bg: 'bg-yellow-50',
                border: 'border-yellow-300',
                text: 'text-yellow-800',
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
            },
            info: {
                gradient: 'from-blue-500 to-cyan-600',
                bg: 'bg-blue-50',
                border: 'border-blue-300',
                text: 'text-blue-800',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
            },
        };
        return styles[type] || styles.info;
    };

    const getIcon = () => {
        const icons = {
            success: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            ),
            error: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ),
            warning: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            info: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        };
        return icons[type] || icons.info;
    };

    const styles = getToastStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
            }}
            className={`relative ${styles.bg} ${styles.border} border-2 rounded-xl shadow-2xl overflow-hidden min-w-[320px] max-w-[90vw] sm:max-w-md`}
            dir="rtl"
        >
            {/* Gradient accent bar */}
            <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${styles.gradient}`} />
            
            <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <div className={`${styles.iconBg} ${styles.iconColor} rounded-full p-2 flex-shrink-0`}>
                    {getIcon()}
                </div>
                
                {/* Message */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`${styles.text} font-semibold text-sm leading-relaxed`}>
                        {message}
                    </p>
                </div>
                
                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`${styles.iconColor} hover:opacity-70 transition-opacity flex-shrink-0 p-1 rounded-lg hover:bg-white/50`}
                    aria-label="بستن"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
}

export default Toast;

