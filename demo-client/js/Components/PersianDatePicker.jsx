import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import moment from 'moment-jalaali';

/**
 * Persian Date Picker Component
 * 
 * Logic:
 * - Calendar displays Persian dates (Jalali)
 * - Each cell stores both Persian day number (for display) and Gregorian date (for selection)
 * - When user clicks a day, the Gregorian date is selected and sent to parent
 * - Display value is converted to Persian format for user visibility
 * - Parent receives Gregorian date in ISO format (YYYY-MM-DD)
 * - Uses moment-jalaali library for accurate date conversion
 */
const PersianDatePicker = ({ 
    value, 
    onChange, 
    placeholder = "تاریخ را انتخاب کنید",
    className = "",
    disabled = false,
    min = null
}) => {
    // Persian month names
    const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
        'مرداد', 'شهریور', 'مهر', 'آبان',
        'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [displayValue, setDisplayValue] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [currentYear, setCurrentYear] = useState(() => {
        // Initialize with current Persian year using moment-jalaali
        const now = moment();
        return now.jYear();
    });
    const [currentMonth, setCurrentMonth] = useState(() => {
        // Initialize with current Persian month using moment-jalaali
        const now = moment();
        return now.jMonth() + 1; // jMonth() returns 0-based, we need 1-based
    });
    const containerRef = useRef(null);

    // Initialize from value prop only once
    useEffect(() => {
        if (value) {
            const date = moment(value);
            setSelectedDate(date.toDate());
            
            // Convert to Persian for display using moment-jalaali
            const persianDate = moment(date);
            const displayValue = `${persianDate.jYear()}/${(persianDate.jMonth() + 1).toString().padStart(2, '0')}/${persianDate.jDate().toString().padStart(2, '0')}`;
            setDisplayValue(displayValue);
            
            setCurrentYear(persianDate.jYear());
            setCurrentMonth(persianDate.jMonth() + 1);
        } else {
            const now = moment();
            setCurrentYear(now.jYear());
            setCurrentMonth(now.jMonth() + 1);
        }
    }, [value]);

    // Generate calendar days using moment-jalaali
    const getCalendarDays = () => {
        const monthLength = moment.jDaysInMonth(currentYear, currentMonth - 1); // jDaysInMonth expects 0-based month
        const firstDayOfMonth = moment(`${currentYear}/${currentMonth}/1`, 'jYYYY/jM/jD');
        
        // Convert Gregorian day of week to Persian week layout
        // Persian week starts with Saturday (شنبه) = 0, Sunday (یکشنبه) = 1, etc.
        // Gregorian: Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4, Friday = 5, Saturday = 6
        // Persian: Saturday = 0, Sunday = 1, Monday = 2, Tuesday = 3, Wednesday = 4, Thursday = 5, Friday = 6
        const gregorianDayOfWeek = firstDayOfMonth.day();
        const firstDayOfWeek = (gregorianDayOfWeek + 1) % 7; // Convert to Persian week layout
        
        const days = [];
        
        // Previous month days
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const prevMonthLength = moment.jDaysInMonth(prevYear, prevMonth - 1);
        
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLength - i;
            const persianDate = moment(`${prevYear}/${prevMonth}/${day}`, 'jYYYY/jM/jD');
            days.push({
                day, // Persian day number for display
                date: persianDate.toDate(), // Gregorian date for selection
                isCurrentMonth: false,
                isToday: false,
                isSelected: false
            });
        }
        
        // Current month days
        const today = moment();
        
        for (let day = 1; day <= monthLength; day++) {
            const persianDate = moment(`${currentYear}/${currentMonth}/${day}`, 'jYYYY/jM/jD');
            const date = persianDate.toDate();
            
            // Check if date is before min date
            let isDisabled = false;
            if (min) {
                const minDate = moment(min).startOf('day');
                const currentDate = moment(date).startOf('day');
                isDisabled = currentDate.isBefore(minDate);
            }
            
            days.push({
                day, // Persian day number for display
                date, // Gregorian date for selection
                isCurrentMonth: true,
                isToday: today.jYear() === currentYear && today.jMonth() + 1 === currentMonth && today.jDate() === day,
                isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
                isDisabled: isDisabled
            });
        }
        
        // Next month days
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        const remainingDays = 42 - days.length;
        
        for (let day = 1; day <= remainingDays; day++) {
            const persianDate = moment(`${nextYear}/${nextMonth}/${day}`, 'jYYYY/jM/jD');
            days.push({
                day, // Persian day number for display
                date: persianDate.toDate(), // Gregorian date for selection
                isCurrentMonth: false,
                isToday: false,
                isSelected: false
            });
        }
        
        return days;
    };

    const handleDateSelect = (dayInfo) => {
        // Don't allow selection of disabled dates
        if (dayInfo.isDisabled) {
            return;
        }
        
        // Store the Gregorian date as selected
        setSelectedDate(dayInfo.date);
        
        // Convert to Persian for display using moment-jalaali
        const persianDate = moment(dayInfo.date);
        const year = persianDate.jYear();
        const month = persianDate.jMonth() + 1;
        const day = persianDate.jDate();
        
        const displayValue = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
        setDisplayValue(displayValue);
        
        setIsOpen(false);
        
        // Send Gregorian date to parent component using local date
        const year_g = dayInfo.date.getFullYear();
        const month_g = (dayInfo.date.getMonth() + 1).toString().padStart(2, '0');
        const day_g = dayInfo.date.getDate().toString().padStart(2, '0');
        const gregorianDateString = `${year_g}-${month_g}-${day_g}`;
        
        onChange(gregorianDateString);
    };

    const navigateMonth = (direction) => {
        let newYear = currentYear;
        let newMonth = currentMonth + direction;

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
    };

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const dropdownHeight = 400; // Approximate height of dropdown
            
            // Check if dropdown would go off screen
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            let top, left, width;
            
            if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
                // Show below
                top = rect.bottom + window.scrollY + 8;
            } else {
                // Show above
                top = rect.top + window.scrollY - dropdownHeight - 8;
            }
            
            // For mobile, center the dropdown
            if (viewportWidth < 768) {
                width = Math.min(viewportWidth - 16, 350);
                left = (viewportWidth - width) / 2 + window.scrollX;
            } else {
                // For desktop, align with input
                left = Math.max(8, rect.left + window.scrollX);
                width = Math.min(rect.width, viewportWidth - 16);
            }
            
            setPosition({
                top,
                left,
                width,
                minWidth: viewportWidth < 768 ? '300px' : '320px'
            });
        }
    };

    const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
            // Check if click is on the portal dropdown
            const dropdown = document.querySelector('[data-datepicker-dropdown]');
            if (!dropdown || !dropdown.contains(event.target)) {
                setIsOpen(false);
            }
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            
            const handleResize = () => updatePosition();
            const handleScroll = () => updatePosition();
            
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll, true);
            
            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 cursor-pointer ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/15'
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className={displayValue ? 'text-white' : 'text-gray-400'}>
                        {displayValue || placeholder}
                    </span>
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && createPortal(
                <>
                    {/* Mobile Backdrop */}
                    {isMobile && (
                        <div 
                            className="fixed inset-0 bg-black/50 z-[99998]"
                            onClick={() => setIsOpen(false)}
                        />
                    )}
                    
                    {/* Date Picker */}
                    <div 
                        data-datepicker-dropdown
                        className={`fixed bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl z-[99999] overflow-hidden ${
                            isMobile ? 'inset-x-4 top-1/2 -translate-y-1/2' : ''
                        }`}
                        style={isMobile ? {
                            width: 'calc(100vw - 2rem)',
                            maxWidth: '400px',
                            margin: '0 auto'
                        } : {
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            minWidth: position.minWidth
                        }}
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                navigateMonth(1);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        
                        <div className="text-center">
                            <div className="text-white font-bold text-lg">
                                {persianMonths[currentMonth - 1]}
                            </div>
                            <div className="text-gray-400 text-sm">
                                {currentYear}
                            </div>
                        </div>
                        
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                navigateMonth(-1);
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Week days */}
                    <div className="grid grid-cols-7 gap-1 p-2">
                        {persianWeekDays.map((day, index) => (
                            <div key={index} className="text-center text-gray-400 text-sm font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1 p-2">
                        {getCalendarDays().map((dayInfo, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDateSelect(dayInfo);
                                }}
                                disabled={dayInfo.isDisabled}
                                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all duration-200 ${
                                    dayInfo.isDisabled
                                        ? 'text-gray-600 cursor-not-allowed opacity-50'
                                        : dayInfo.isSelected
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold'
                                        : dayInfo.isToday
                                        ? 'bg-purple-500/20 text-purple-400 font-semibold'
                                        : dayInfo.isCurrentMonth
                                        ? 'text-white hover:bg-white/10'
                                        : 'text-gray-500 hover:bg-white/5'
                                }`}
                            >
                                {dayInfo.day}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    const today = moment();
                                    
                                    // Store Gregorian date
                                    setSelectedDate(today.toDate());
                                    
                                    // Convert to Persian for display
                                    const year = today.jYear();
                                    const month = today.jMonth() + 1;
                                    const day = today.jDate();
                                    
                                    const displayValue = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
                                    setDisplayValue(displayValue);
                                    
                                    // Update calendar view
                                    setCurrentYear(year);
                                    setCurrentMonth(month);
                                    
                                    setIsOpen(false);
                                    
                                    // Send Gregorian date to parent using local date
                                    const todayDate = today.toDate();
                                    const year_g = todayDate.getFullYear();
                                    const month_g = (todayDate.getMonth() + 1).toString().padStart(2, '0');
                                    const day_g = todayDate.getDate().toString().padStart(2, '0');
                                    const gregorianString = `${year_g}-${month_g}-${day_g}`;
                                    
                                    onChange(gregorianString);
                                }}
                                className="flex-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                            >
                                امروز
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedDate(null);
                                    setDisplayValue('');
                                    setIsOpen(false);
                                    onChange('');
                                }}
                                className="flex-1 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 text-gray-400 font-medium py-2 px-3 rounded-lg transition-all duration-200 text-sm"
                            >
                                پاک کردن
                            </button>
                        </div>
                    </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default PersianDatePicker;

