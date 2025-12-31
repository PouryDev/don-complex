import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-8"
            >
                <div className="text-9xl mb-6">🔍</div>
            </motion.div>
            
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-7xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent mb-4"
            >
                404
            </motion.h1>
            
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-semibold text-white mb-4"
            >
                صفحه یافت نشد
            </motion.h2>
            
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-300 mb-8 text-center max-w-md leading-relaxed"
            >
                صفحه‌ای که دنبال آن هستید وجود ندارد یا منتقل شده است.
            </motion.p>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 flex-wrap justify-center"
            >
                <Link
                    to="/"
                    className="cafe-button px-8 py-3 rounded-xl text-white font-semibold inline-block hover:scale-105 transition-transform duration-200"
                >
                    بازگشت به خانه
                </Link>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 rounded-xl bg-gray-800 text-gray-300 font-semibold hover:bg-gray-700 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 hover:scale-105"
                >
                    بازگشت به صفحه قبل
                </button>
            </motion.div>
        </div>
    );
}

export default NotFound;

