import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
        opacity: 1,
        transition: { 
            duration: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94] // smooth ease-out
        }
    },
    exit: { 
        opacity: 0,
        transition: { 
            duration: 0.4, 
            ease: [0.55, 0.06, 0.68, 0.19] // smooth ease-in
        }
    }
};

const logoContainerVariants = {
    initial: { 
        opacity: 0, 
        scale: 0.5,
        rotate: -10
    },
    animate: { 
        opacity: 1, 
        scale: 1,
        rotate: 0,
        transition: { 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1], // smooth bounce effect
            delay: 0.1
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.8,
        rotate: 5,
        transition: { 
            duration: 0.4, 
            ease: [0.55, 0.06, 0.68, 0.19]
        }
    }
};

const logoGlowVariants = {
    initial: { 
        opacity: 0,
        scale: 0.8
    },
    animate: { 
        opacity: [0, 0.6, 0.4],
        scale: [0.8, 1.1, 1],
        transition: { 
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
        }
    }
};

function Intro({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Set timer for 1.5 seconds, then fade out
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Call onComplete after fade out animation completes (0.4s)
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 400);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="intro-overlay"
                    variants={overlayVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0a] to-black backdrop-blur-md"
                    style={{ pointerEvents: 'auto' }}
                >
                    {/* Glow effect behind logo */}
                    <motion.div
                        variants={logoGlowVariants}
                        initial="initial"
                        animate="animate"
                        className="absolute w-[220px] md:w-[320px] h-[220px] md:h-[320px] rounded-full bg-gradient-to-br from-red-500/20 via-red-600/10 to-transparent blur-2xl"
                    />
                    
                    {/* Logo container with modern animation */}
                    <motion.div
                        variants={logoContainerVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="relative"
                    >
                        <motion.img
                            src="/logo.png"
                            alt="DON CLUB Logo"
                            className="w-[200px] md:w-[300px] max-w-[90vw] h-[200px] md:h-[300px] object-contain rounded-full shadow-2xl border-4 border-red-500/30 bg-black/50 p-2"
                            style={{
                                boxShadow: '0 0 40px rgba(255, 68, 68, 0.3), 0 0 80px rgba(255, 68, 68, 0.1)'
                            }}
                            onError={(e) => {
                                console.error('Failed to load logo:', e);
                                e.target.src = '/public/logo.png';
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Intro;

