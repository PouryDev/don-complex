import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
        opacity: 1,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
        opacity: 0,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
};

const logoVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            duration: 0.6, 
            ease: [0.4, 0, 0.2, 1],
            delay: 0.1
        }
    },
    exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: { 
            duration: 0.4, 
            ease: [0.4, 0, 0.2, 1]
        }
    }
};

function Intro({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check if intro has been shown in this session
        const introShown = sessionStorage.getItem('intro_shown');
        
        if (introShown === 'true') {
            setIsVisible(false);
            if (onComplete) onComplete();
            return;
        }

        // Mark intro as shown
        sessionStorage.setItem('intro_shown', 'true');

        // Set timer for 3 seconds, then fade out
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Call onComplete after fade out animation completes (0.4s)
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 400);
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    variants={overlayVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
                >
                    <motion.img
                        src="/logo.png"
                        alt="DON CLUB Logo"
                        variants={logoVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-[200px] md:w-[300px] max-w-[90vw] h-auto"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Intro;

