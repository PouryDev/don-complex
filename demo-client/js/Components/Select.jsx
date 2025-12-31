import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Select({ 
    label, 
    value, 
    onChange, 
    options = [], 
    error, 
    className = '',
    placeholder = 'انتخاب کنید...',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both select button and dropdown
            if (
                selectRef.current && 
                !selectRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                // Only close if it's an actual click, not mouse move events
                if (event.type === 'mousedown' || event.type === 'touchstart') {
                    setIsOpen(false);
                    setFocusedIndex(-1);
                }
            }
        };

        if (isOpen) {
            // Use a small delay to prevent immediate closing on mouse re-entry
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside, true);
                document.addEventListener('touchstart', handleClickOutside, true);
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside, true);
                document.removeEventListener('touchstart', handleClickOutside, true);
            };
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setFocusedIndex(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setFocusedIndex(prev => 
                    prev < options.length - 1 ? prev + 1 : prev
                );
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
            }
        } else if (e.key === 'Enter' && isOpen && focusedIndex >= 0) {
            e.preventDefault();
            handleSelect(options[focusedIndex]);
        }
    };

    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
            const focusedElement = dropdownRef.current.children[focusedIndex];
            if (focusedElement) {
                focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [focusedIndex, isOpen]);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && selectRef.current) {
            const updatePosition = () => {
                if (selectRef.current) {
                    const rect = selectRef.current.getBoundingClientRect();
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY + 8, // 8px margin (mt-2)
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen]);

    return (
        <div className={`relative z-[100] ${className}`}>
            {label && (
                <label className="block text-sm font-bold text-white mb-3">
                    {label}
                </label>
            )}
            
            <div className="relative" ref={selectRef}>
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-3.5 
                        border-2 rounded-xl 
                        bg-gray-800 
                        font-medium text-right
                        transition-all duration-200
                        flex items-center justify-between
                        ${error ? 'border-red-500' : 'border-red-500/20'}
                        ${disabled 
                            ? 'opacity-50 cursor-not-allowed bg-gray-700' 
                            : isOpen
                                ? 'border-red-500 ring-2 ring-red-500/30 shadow-md'
                                : 'hover:border-red-500/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/30'
                        }
                    `}
                >
                    <span className={`flex-1 text-right ${selectedOption ? 'text-white' : 'text-gray-400'}`}>
                        {selectedOption ? (
                            <span className="flex items-center gap-2">
                                {selectedOption.icon && <span className="text-xl">{selectedOption.icon}</span>}
                                <span>{selectedOption.label}</span>
                            </span>
                        ) : (
                            placeholder
                        )}
                    </span>
                    <motion.svg
                        className="w-5 h-5 text-red-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </motion.svg>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="fixed inset-0 z-[9998] bg-black/10 pointer-events-auto"
                                onMouseDown={(e) => {
                                    // Only close if clicking directly on backdrop, not when mouse enters
                                    if (e.target === e.currentTarget) {
                                        setIsOpen(false);
                                    }
                                }}
                            />
                            
                            {/* Dropdown - Fixed positioning to avoid stacking context issues */}
                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ 
                                    type: "spring",
                                    damping: 25,
                                    stiffness: 300,
                                    duration: 0.2
                                }}
                                className="fixed z-[9999] bg-gray-800 rounded-xl shadow-2xl border-2 border-red-500/20 overflow-hidden pointer-events-auto"
                                onMouseEnter={() => {
                                    // Keep dropdown open when mouse enters
                                }}
                                onMouseLeave={() => {
                                    // Don't close on mouse leave, only on click outside
                                }}
                                style={{ 
                                    top: `${dropdownPosition.top}px`,
                                    left: `${dropdownPosition.left}px`,
                                    width: `${dropdownPosition.width}px`,
                                    maxHeight: 'min(300px, calc(100vh - 200px))',
                                }}
                            >
                                <div 
                                    className="overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-700"
                                    style={{ maxHeight: 'min(300px, calc(100vh - 200px))' }}
                                >
                                    {options.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-400">
                                            گزینه‌ای موجود نیست
                                        </div>
                                    ) : (
                                        options.map((option, index) => {
                                            const isSelected = value === option.value;
                                            const isFocused = focusedIndex === index;
                                            
                                            return (
                                                <motion.button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleSelect(option)}
                                                    onMouseEnter={() => setFocusedIndex(index)}
                                                    className={`
                                                        w-full px-4 py-3.5
                                                        text-right
                                                        transition-all duration-150
                                                        flex items-center justify-between
                                                        border-b border-red-500/20 last:border-b-0
                                                        ${isSelected
                                                            ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-red-400 font-semibold'
                                                            : isFocused
                                                                ? 'bg-gray-700 text-gray-300'
                                                                : 'text-gray-300 hover:bg-gray-700'
                                                        }
                                                    `}
                                                    whileHover={{ x: -4 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <span className="flex items-center gap-2 flex-1">
                                                        {option.icon && (
                                                            <span className="text-xl">{option.icon}</span>
                                                        )}
                                                        <span>{option.label}</span>
                                                    </span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center flex-shrink-0"
                                                        >
                                                            <svg
                                                                className="w-4 h-4 text-white"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={3}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

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

export default Select;

