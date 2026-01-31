import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import { formatPersianDateOnly } from '../../utils/dateUtils';

function GameResults() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchSessions(1);
    }, [selectedDate]);

    const fetchSessions = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                per_page: 15,
                page,
                status: 'completed',
            };
            
            if (selectedDate) {
                params.date = selectedDate;
            }

            const data = await supervisorService.getSessions(params);
            // Filter sessions that have best player or game results
            const filteredSessions = (data.data || []).filter(session => 
                session.best_player_metadata || 
                (session.reservations && session.reservations.some(r => r.game_result_metadata))
            );
            setSessions(filteredSessions);
            setPagination({
                current_page: data.meta?.current_page || 1,
                last_page: data.meta?.last_page || 1,
                per_page: data.meta?.per_page || 15,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            showToast('خطا در بارگذاری نتایج بازی', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && sessions.length === 0) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">نتایج بازی</h1>
                <p className="text-gray-400">مشاهده نتایج بازی‌ها و Best Player ها</p>
            </div>

            {/* Date Filter */}
            <div className="cafe-card rounded-xl p-4">
                <label className="block text-sm text-gray-400 mb-2">فیلتر بر اساس تاریخ</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                />
            </div>

            {/* Sessions with Results */}
            <div className="space-y-4">
                {sessions.map((session) => (
                    <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cafe-card rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    سانس #{session.id}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {session.date ? formatPersianDateOnly(session.date) : '-'}
                                    {session.start_time && ` - ${session.start_time}`}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(`/supervisor/sessions/${session.id}`)}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-sm"
                            >
                                مشاهده جزئیات
                            </button>
                        </div>

                        {session.best_player_metadata && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border border-yellow-500/50 rounded-lg">
                                <p className="text-sm text-gray-400 mb-1">Best Player</p>
                                <p className="text-white font-semibold">
                                    {session.best_player_metadata.user_id ? `کاربر #${session.best_player_metadata.user_id}` : '-'}
                                </p>
                            </div>
                        )}

                        {session.reservations && session.reservations.filter(r => r.game_result_metadata).length > 0 && (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">نتایج بازی:</p>
                                <div className="space-y-2">
                                    {session.reservations
                                        .filter(r => r.game_result_metadata)
                                        .map((reservation) => (
                                            <div key={reservation.id} className="bg-gray-800 rounded-lg p-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {reservation.user?.name || 'کاربر'}
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            نتیجه: {
                                                                reservation.game_result_metadata.result === 'win' ? 'برنده' :
                                                                reservation.game_result_metadata.result === 'lose' ? 'بازنده' : 'مساوی'
                                                            }
                                                            {reservation.game_result_metadata.score && ` - امتیاز: ${reservation.game_result_metadata.score}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">نتیجه بازی‌ای یافت نشد</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => fetchSessions(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        قبلی
                    </button>
                    <span className="px-4 py-2 text-gray-300">
                        صفحه {pagination.current_page} از {pagination.last_page}
                    </span>
                    <button
                        onClick={() => fetchSessions(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        بعدی
                    </button>
                </div>
            )}
        </div>
    );
}

export default GameResults;

