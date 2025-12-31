import React from 'react';
import { motion } from 'framer-motion';

function Input({ label, error, className = '', type = 'text', textarea = false, rows = 4, ...props }) {
    const baseClasses = `
        w-full px-4 py-3.5
        border-2 rounded-xl
        bg-gray-800
        text-white
        placeholder-gray-400
        font-medium text-right
        transition-all duration-200
        ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30' 
            : 'border-red-500/20 hover:border-red-500/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
        }
        shadow-sm hover:shadow-md focus:shadow-lg focus:shadow-red-500/10
        ${className}
    `;

    const InputComponent = textarea ? 'textarea' : 'input';

    return (
        <div className="mb-5">
            {label && (
                <label className="block text-sm font-bold text-white mb-3">
                    {label}
                </label>
            )}
            <InputComponent
                type={textarea ? undefined : type}
                rows={textarea ? rows : undefined}
                className={baseClasses}
                {...props}
            />
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-400 flex items-center gap-1"
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

export default Input;

