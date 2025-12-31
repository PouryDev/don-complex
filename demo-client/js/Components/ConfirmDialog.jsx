import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'تأیید', cancelText = 'لغو', type = 'warning' }) {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        const styles = {
            warning: {
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
                buttonConfirm: 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700',
            },
            danger: {
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                buttonConfirm: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700',
            },
            info: {
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                buttonConfirm: 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
            },
        };
        return styles[type] || styles.warning;
    };

    const styles = getTypeStyles();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    
                    {/* Dialog */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden border-2 border-red-900/50"
                        >
                            {/* Header with gradient */}
                            <div className={`bg-gradient-to-r ${styles.buttonConfirm} p-6`}>
                                <div className="flex items-center gap-4">
                                    <div className={`${styles.iconBg} ${styles.iconColor} rounded-full p-3`}>
                                        {type === 'danger' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        ) : type === 'info' ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{title || 'تأیید عملیات'}</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-gray-700 text-base leading-relaxed mb-6">
                                    {message}
                                </p>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                    >
                                        {cancelText}
                                    </button>
                                    <button
                                        onClick={onConfirm}
                                        className={`flex-1 px-4 py-3 ${styles.buttonConfirm} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all`}
                                    >
                                        {confirmText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

export default ConfirmDialog;

