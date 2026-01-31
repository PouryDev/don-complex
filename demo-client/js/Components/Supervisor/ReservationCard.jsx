import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatPersianDateTime } from '../../utils/dateUtils';

function ReservationCard({ reservation, onViewDetails, onFraudReport }) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails();
        } else {
            navigate(`/supervisor/reservations/${reservation.id}`);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    const getValidationStatus = () => {
        if (reservation.validated_at) {
            return {
                text: 'تایید شده',
                color: 'from-green-500 to-emerald-500',
            };
        }
        return {
            text: 'در انتظار تایید',
            color: 'from-yellow-500 to-orange-500',
        };
    };

    const getGameResultStatus = () => {
        if (reservation.game_result_metadata?.result) {
            const results = {
                'win': { text: 'برنده', color: 'from-green-500 to-emerald-500' },
                'lose': { text: 'بازنده', color: 'from-red-500 to-red-600' },
                'draw': { text: 'مساوی', color: 'from-gray-500 to-gray-600' },
            };
            return results[reservation.game_result_metadata.result] || { text: '-', color: 'from-gray-500 to-gray-600' };
        }
        return { text: 'ثبت نشده', color: 'from-gray-500 to-gray-600' };
    };

    const validationStatus = getValidationStatus();
    const gameResultStatus = getGameResultStatus();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        رزرو #{reservation.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {reservation.user?.name || 'کاربر'} - {formatPersianDateTime(reservation.created_at)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${validationStatus.color} text-white text-sm font-semibold`}>
                        {validationStatus.text}
                    </div>
                    <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${gameResultStatus.color} text-white text-sm font-semibold`}>
                        {gameResultStatus.text}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-sm text-gray-400">تعداد نفرات</p>
                    <p className="text-white font-semibold">{reservation.number_of_people} نفر</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">وضعیت پرداخت</p>
                    <p className={`font-semibold ${
                        reservation.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                        {reservation.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">مبلغ کل</p>
                    <p className="text-white font-semibold">
                        {reservation.total_amount ? `${formatPrice(reservation.total_amount)} تومان` : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">امتیاز</p>
                    <p className="text-white font-semibold">
                        {reservation.game_result_metadata?.score || '-'}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t border-red-900/50 flex gap-2">
                {!reservation.cancelled_at && reservation.payment_status === 'paid' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onFraudReport) {
                                onFraudReport(reservation);
                            }
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all font-semibold"
                    >
                        گزارش تقلب
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails();
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                >
                    مشاهده جزئیات
                </button>
            </div>
        </motion.div>
    );
}

export default ReservationCard;

