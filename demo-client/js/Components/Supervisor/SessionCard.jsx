import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatPersianDateOnly } from '../../utils/dateUtils';

function SessionCard({ session, onViewDetails }) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails();
        } else {
            navigate(`/supervisor/sessions/${session.id}`);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'upcoming': 'from-blue-500 to-cyan-500',
            'ongoing': 'from-green-500 to-emerald-500',
            'completed': 'from-gray-500 to-gray-600',
            'cancelled': 'from-red-500 to-red-600',
        };
        return colors[status] || 'from-gray-500 to-gray-600';
    };

    const getStatusText = (status) => {
        const texts = {
            'upcoming': 'آینده',
            'ongoing': 'در حال انجام',
            'completed': 'تکمیل شده',
            'cancelled': 'لغو شده',
        };
        return texts[status] || status;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
            onClick={handleViewDetails}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        سانس #{session.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {session.session_template?.name || 'سانس'} - {session.hall?.name || 'سالن'}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(session.status)} text-white text-sm font-semibold`}>
                    {getStatusText(session.status)}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-sm text-gray-400">تاریخ</p>
                    <p className="text-white font-semibold">
                        {session.date ? formatPersianDateOnly(session.date) : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">زمان شروع</p>
                    <p className="text-white font-semibold">
                        {session.start_time || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">ظرفیت</p>
                    <p className="text-white font-semibold">
                        {session.available_seats !== undefined ? `${session.available_seats}/${session.capacity || 0}` : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Best Player</p>
                    <p className="text-white font-semibold">
                        {session.best_player_metadata ? '✓' : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Game Master</p>
                    <p className="text-white font-semibold">
                        {session.game_master ? session.game_master.name : '-'}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t border-red-900/50">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails();
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                >
                    مشاهده جزئیات
                </button>
            </div>
        </motion.div>
    );
}

export default SessionCard;

