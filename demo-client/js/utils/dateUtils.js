import moment from 'moment-jalaali';

/**
 * Convert a date string to Persian (Jalali) format
 * @param {string} dateString - ISO date string or date string
 * @param {object} options - Formatting options
 * @returns {string} Formatted Persian date string
 */
export const formatPersianDate = (dateString, options = {}) => {
    if (!dateString) return '';
    
    const {
        includeTime = false,
        includeYear = true,
        includeMonth = true,
        includeDay = true,
        monthFormat = 'long', // 'long' or 'short' or 'numeric'
        timeFormat = '24h' // '24h' or '12h'
    } = options;

    try {
        const date = moment(dateString);
        
        if (!date.isValid()) {
            return '';
        }

        const parts = [];
        
        if (includeYear) {
            parts.push(date.jYear());
        }
        
        if (includeMonth) {
            if (monthFormat === 'long') {
                const monthNames = [
                    'فروردین', 'اردیبهشت', 'خرداد', 'تیر',
                    'مرداد', 'شهریور', 'مهر', 'آبان',
                    'آذر', 'دی', 'بهمن', 'اسفند'
                ];
                parts.push(monthNames[date.jMonth()]);
            } else if (monthFormat === 'short') {
                const monthNames = [
                    'فر', 'ارد', 'خر', 'تیر',
                    'مر', 'شه', 'مه', 'آبا',
                    'آذر', 'دی', 'به', 'اسف'
                ];
                parts.push(monthNames[date.jMonth()]);
            } else {
                parts.push(date.jMonth() + 1);
            }
        }
        
        if (includeDay) {
            parts.push(date.jDate());
        }

        let formattedDate = parts.join(' ');
        
        if (includeTime) {
            let timeStr = '';
            if (timeFormat === '12h') {
                const hour = date.hour();
                const minute = date.minute();
                const period = hour < 12 ? 'ق.ظ' : 'ب.ظ';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
            } else {
                timeStr = `${date.hour().toString().padStart(2, '0')}:${date.minute().toString().padStart(2, '0')}`;
            }
            formattedDate += ` - ${timeStr}`;
        }

        return formattedDate;
    } catch (error) {
        console.error('Error formatting Persian date:', error);
        return '';
    }
};

/**
 * Format date with time in Persian format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted Persian date with time
 */
export const formatPersianDateTime = (dateString) => {
    return formatPersianDate(dateString, {
        includeTime: true,
        includeYear: true,
        includeMonth: true,
        includeDay: true,
        monthFormat: 'long',
        timeFormat: '24h'
    });
};

/**
 * Format date only (without time) in Persian format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted Persian date
 */
export const formatPersianDateOnly = (dateString) => {
    return formatPersianDate(dateString, {
        includeTime: false,
        includeYear: true,
        includeMonth: true,
        includeDay: true,
        monthFormat: 'long'
    });
};

/**
 * Format time only in Persian format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
export const formatPersianTime = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = moment(dateString);
        if (!date.isValid()) {
            return '';
        }
        return `${date.hour().toString().padStart(2, '0')}:${date.minute().toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Error formatting Persian time:', error);
        return '';
    }
};

