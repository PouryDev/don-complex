import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';

function Dashboard() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today_sessions: 0,
        pending_validations: 0,
        completed_games: 0,
        validated_reservations: 0,
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await supervisorService.getStats();
            setStats(data);
        } catch (error) {
            showToast('خطا در بارگذاری آمار', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    const statCards = [
        {
            title: 'سانس‌های امروز',
            value: stats.today_sessions,
            icon: '📅',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'رزروهای در انتظار تایید',
            value: stats.pending_validations,
            icon: '⏳',
            color: 'from-yellow-500 to-orange-500',
        },
        {
            title: 'بازی‌های تکمیل شده',
            value: stats.completed_games,
            icon: '✅',
            color: 'from-green-500 to-emerald-500',
        },
        {
            title: 'رزروهای تایید شده امروز',
            value: stats.validated_reservations,
            icon: '✓',
            color: 'from-purple-500 to-pink-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">داشبورد</h1>
                <p className="text-gray-400">خلاصه فعالیت‌های امروز</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="cafe-card rounded-xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-2xl`}>
                                {stat.icon}
                            </div>
                        </div>
                        <h3 className="text-gray-400 text-sm mb-2">{stat.title}</h3>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="cafe-card rounded-xl p-6 mt-6">
                <h2 className="text-xl font-semibold text-white mb-4">دسترسی سریع</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/supervisor/sessions"
                        className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <h3 className="text-white font-medium mb-1">مشاهده سانس‌ها</h3>
                        <p className="text-gray-400 text-sm">مدیریت سانس‌های امروز</p>
                    </a>
                    <a
                        href="/supervisor/sessions?status=active"
                        className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <h3 className="text-white font-medium mb-1">سانس‌های فعال</h3>
                        <p className="text-gray-400 text-sm">سانس‌های در حال اجرا</p>
                    </a>
                    <a
                        href="/supervisor/game-results"
                        className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <h3 className="text-white font-medium mb-1">نتایج بازی</h3>
                        <p className="text-gray-400 text-sm">مشاهده نتایج و Best Player ها</p>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

