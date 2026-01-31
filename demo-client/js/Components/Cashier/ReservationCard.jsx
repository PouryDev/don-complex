import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function ReservationCard({ reservation, onViewDetails, onPaymentProcessed }) {
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'from-yellow-500 to-orange-500',
            'paid': 'from-green-500 to-emerald-500',
            'failed': 'from-red-500 to-red-600',
        };
        return colors[status] || 'from-gray-500 to-gray-600';
    };

    const getStatusText = (status) => {
        const texts = {
            'pending': 'در انتظار پرداخت',
            'paid': 'پرداخت شده',
            'failed': 'ناموفق',
        };
        return texts[status] || status;
    };

    const handleViewDetails = () => {
        if (onViewDetails) {
            onViewDetails();
        } else {
            navigate(`/cashier/reservations/${reservation.id}`);
        }
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
                        رزرو #{reservation.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {reservation.user?.name || 'کاربر'} - {formatDate(reservation.created_at)}
                    </p>
                </div>
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(reservation.payment_status)} text-white text-sm font-semibold`}>
                    {getStatusText(reservation.payment_status)}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p className="text-sm text-gray-400">تعداد نفرات</p>
                    <p className="text-white font-semibold">{reservation.number_of_people} نفر</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">سانس</p>
                    <p className="text-white font-semibold">
                        {reservation.session?.date ? formatDate(reservation.session.date) : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">مبلغ کل</p>
                    <p className="text-white font-semibold">
                        {reservation.total_amount ? `${formatPrice(reservation.total_amount)} تومان` : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">شعبه</p>
                    <p className="text-white font-semibold">
                        {reservation.session?.branch?.name || '-'}
                    </p>
                </div>
            </div>

            {reservation.payment_status === 'pending' && (
                <div className="pt-4 border-t border-red-900/50">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails();
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                    >
                        پردازش پرداخت
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default ReservationCard;

