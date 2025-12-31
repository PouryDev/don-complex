import React from 'react';
import { motion } from 'framer-motion';

function Checkbox({ 
    label, 
    name, 
    checked, 
    onChange, 
    error, 
    className = '',
    disabled = false,
    ...props 
}) {
    const handleChange = (e) => {
        if (!disabled && onChange) {
            onChange(e);
        }
    };

    return (
        <div className={`mb-5 ${className}`}>
            <label 
                className={`
                    flex items-center gap-3 cursor-pointer
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {/* Custom Checkbox */}
                <div className="relative flex-shrink-0">
                    <input
                        type="checkbox"
                        name={name}
                        checked={checked}
                        onChange={handleChange}
                        disabled={disabled}
                        className="sr-only"
                        {...props}
                    />
                    <motion.div
                        className={`
                            w-12 h-7 rounded-full
                            border-2 transition-all duration-200
                            flex items-center relative
                            ${error 
                                ? 'border-red-400 bg-red-100' 
                                : checked
                                    ? 'border-red-600 bg-gradient-to-r from-red-600 to-red-700'
                                    : 'border-red-900/50 bg-gray-800 hover:border-red-800'
                            }
                            ${disabled ? 'opacity-50' : 'shadow-sm hover:shadow-md'}
                        `}
                        whileTap={!disabled ? { scale: 0.95 } : {}}
                    >
                        <motion.div
                            className={`
                                w-5 h-5 rounded-full bg-white
                                shadow-md absolute
                                ${error && checked ? 'bg-red-50' : ''}
                            `}
                            style={{
                                right: '2px',
                            }}
                            initial={false}
                            animate={{
                                x: checked ? 0 : -24,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                        />
                    </motion.div>
                </div>

                {/* Label */}
                {label && (
                    <span className={`
                        text-sm font-bold text-gray-700
                        select-none
                        ${disabled ? 'text-gray-400' : ''}
                    `}>
                        {label}
                    </span>
                )}
            </label>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </motion.p>
            )}
        </div>
    );
}

export default Checkbox;

