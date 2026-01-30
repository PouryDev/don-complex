import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { coinService } from '../services/api';

const CoinIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a3.503 3.503 0 01-1.83-1.234 5.535 5.535 0 01-.44-.677A1 1 0 009 13H8a1 1 0 00-.894.553l-1.991 3.981A.869.869 0 006.839 19H9a1 1 0 001-1v-.092a4.535 4.535 0 001.676-.662C12.398 15.766 13 14.991 13 14c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 11.151V9.309c.382.024.753.065 1.108.121a1 1 0 10.217-1.988A6.832 6.832 0 0010 7.092V6a1 1 0 10-2 0v.092a6.832 6.832 0 00-1.325.242 1 1 0 10.217 1.988c.355-.056.726-.097 1.108-.121v1.842a4.535 4.535 0 00-1.676.662C6.602 10.234 6 11.009 6 12c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a3.503 3.503 0 01-1.83-1.234 5.535 5.535 0 01-.44-.677A1 1 0 009 13h1a1 1 0 00.894-.553l1.991-3.981A.869.869 0 0012.161 9H10a1 1 0 01-1-1V6.309a6.832 6.832 0 011.108-.121 1 1 0 10-.217-1.988A6.832 6.832 0 0010 4.908V4a1 1 0 10-2 0v.908a6.832 6.832 0 00-1.325.242 1 1 0 10.217 1.988c.355-.056.726-.097 1.108-.121V7.85c-.382-.024-.753-.065-1.108-.121a1 1 0 10-.217 1.988c.382.024.753.065 1.108.121v1.842a4.535 4.535 0 00-1.676-.662C5.602 10.234 5 9.46 5 8.5c0-.96.602-1.734 1.324-2.215A4.492 4.492 0 018 5.681V4a1 1 0 012 0v1.681a4.492 4.492 0 011.676.604C12.398 6.766 13 7.54 13 8.5c0 .96-.602 1.734-1.324 2.215a4.492 4.492 0 01-1.676.604V13a1 1 0 11-2 0v-1.92z" clipRule="evenodd" />
    </svg>
);

function CoinBalance() {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const response = await coinService.getBalance();
            setBalance(response.balance || 0);
        } catch (error) {
            console.error('Error fetching coin balance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = () => {
        navigate('/coin-history');
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200"
        >
            <CoinIcon />
            <span>{new Intl.NumberFormat('fa-IR').format(balance)}</span>
        </motion.button>
    );
}

export default CoinBalance;


