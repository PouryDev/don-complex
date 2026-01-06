import React from 'react';
import { motion } from 'framer-motion';

function Loading({ message = 'در حال بارگذاری...' }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <div className="text-center">
                {/* Modern animated loader */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    {/* Outer rotating ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent"
                        style={{
                            borderTopColor: '#ef4444',
                            borderRightColor: '#ef4444',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    
                    {/* Middle pulsing ring */}
                    <motion.div
                        className="absolute inset-2 rounded-full border-4 border-transparent"
                        style={{
                            borderBottomColor: '#dc2626',
                            borderLeftColor: '#dc2626',
                        }}
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                    
                    {/* Inner pulsing dot */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <motion.div
                            className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </motion.div>
                    
                    {/* Glowing effect */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                        }}
                        animate={{
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
                
                {/* Loading text with fade animation */}
                <motion.p
                    className="text-gray-300 text-sm font-medium"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {message}
                </motion.p>
            </div>
        </div>
    );
}

export default Loading;
