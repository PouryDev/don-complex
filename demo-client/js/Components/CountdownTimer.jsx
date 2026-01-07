import React, { useState, useEffect } from 'react';

function CountdownTimer({ expiresAt, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiresAt) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const difference = expiry - now;

            if (difference <= 0) {
                setTimeLeft({ minutes: 0, seconds: 0 });
                setIsExpired(true);
                if (onExpire) {
                    onExpire();
                }
                return;
            }

            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({ minutes, seconds });
            setIsExpired(false);
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpire]);

    if (!expiresAt || !timeLeft) {
        return null;
    }

    const isUrgent = timeLeft.minutes < 5;
    const isVeryUrgent = timeLeft.minutes < 2;

    return (
        <div className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg backdrop-blur-sm transition-all duration-300 ${
            isExpired 
                ? 'bg-gradient-to-r from-red-600/30 to-red-700/30 text-red-300 border-2 border-red-500/50' 
                : isVeryUrgent
                ? 'bg-gradient-to-r from-red-500/30 to-red-600/30 text-red-300 border-2 border-red-400/60 animate-pulse shadow-red-500/20'
                : isUrgent
                ? 'bg-gradient-to-r from-orange-500/30 to-orange-600/30 text-orange-300 border-2 border-orange-400/50 shadow-orange-500/20'
                : 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 text-yellow-300 border-2 border-yellow-400/50 shadow-yellow-500/20'
        }`}>
            {/* Animated background glow */}
            {(isVeryUrgent || isUrgent) && (
                <div className={`absolute inset-0 rounded-xl sm:rounded-2xl blur-sm ${
                    isVeryUrgent ? 'bg-red-500/20 animate-pulse' : 'bg-orange-500/20'
                }`}></div>
            )}
            
            <div className="relative flex items-center gap-1.5 sm:gap-2">
                <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                        isExpired || isVeryUrgent ? 'animate-spin' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono tracking-wider">
                    {isExpired 
                        ? 'منقضی شده' 
                        : `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`
                    }
                </span>
            </div>
        </div>
    );
}

export default CountdownTimer;

