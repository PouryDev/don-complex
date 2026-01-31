import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';

function GameMasterStatsCard({ period, onPeriodChange }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        game_masters: [],
        top_game_master: null,
    });

    useEffect(() => {
        fetchStats();
    }, [period]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await supervisorService.getGameMasterStats(period);
            setStats(data);
        } catch (error) {
            showToast('خطا در بارگذاری آمار Game Master', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="cafe-card rounded-xl p-6">
                <Loading />
            </div>
        );
    }

    return (
        <div className="cafe-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">آمار Game Master</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPeriodChange('today')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                            period === 'today'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        امروز
                    </button>
                    <button
                        onClick={() => onPeriodChange('week')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                            period === 'week'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        این هفته
                    </button>
                    <button
                        onClick={() => onPeriodChange('month')}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                            period === 'month'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        این ماه
                    </button>
                </div>
            </div>

            {stats.top_game_master ? (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-600/20 to-red-700/20 rounded-lg border border-red-600/50">
                    <p className="text-sm text-gray-400 mb-1">بهترین Game Master</p>
                    <p className="text-xl font-bold text-white">{stats.top_game_master.name}</p>
                    <p className="text-sm text-gray-400">
                        {stats.top_game_master.validated_count} رزرو تایید شده
                    </p>
                </div>
            ) : (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">هیچ Game Master فعالی در این بازه زمانی وجود ندارد</p>
                </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.game_masters.map((gm) => (
                    <div
                        key={gm.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                        <div>
                            <p className="text-white font-medium">{gm.name}</p>
                            <p className="text-sm text-gray-400">{gm.email}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold">{gm.validated_count}</p>
                            <p className="text-xs text-gray-400">تایید شده</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Dashboard() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [gameMasterPeriod, setGameMasterPeriod] = useState('today');
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">دسترسی سریع</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <GameMasterStatsCard
                    period={gameMasterPeriod}
                    onPeriodChange={setGameMasterPeriod}
                />
            </div>
        </div>
    );
}

export default Dashboard;

