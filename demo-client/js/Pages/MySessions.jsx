import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService } from '../services/api';
import Loading from '../Components/Loading';
import { CalendarIcon, WarningIcon, EmptyBoxIcon, CashIcon } from '../Components/Icons';

function MySessions() {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await reservationService.getReservations();
            // Handle paginated response - Laravel paginated responses have a 'data' property
            const reservationsList = Array.isArray(response) ? response : (response.data || []);
            setReservations(reservationsList);
            
            // Calculate total spent (only paid reservations)
            const paidTotal = reservationsList
                .filter(res => res.payment_status === 'paid' && res.payment_transaction)
                .reduce((sum, res) => sum + (parseFloat(res.payment_transaction.amount) || 0), 0);
            setTotalSpent(paidTotal);
        } catch (err) {
            setError('خطا در بارگذاری رزروها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getPaymentStatusText = (status) => {
        const statusMap = {
            'pending': 'در انتظار پرداخت',
            'paid': 'پرداخت شده',
            'failed': 'ناموفق',
        };
        return statusMap[status] || status;
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            'pending': 'from-yellow-500 to-orange-500',
            'paid': 'from-green-500 to-emerald-500',
            'failed': 'from-red-500 to-red-600',
        };
        return colors[status] || colors.pending;
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchReservations}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">سانس‌های من</h1>
                <p className="text-gray-300">لیست رزروهای شما</p>
            </div>

            {/* Total Spent Card */}
            <div className="cafe-card rounded-xl p-5 bg-gradient-to-r from-red-900/50 to-red-800/50 border-2 border-red-900/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white">
                            <CashIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">مجموع پرداختی‌ها</p>
                            <p className="text-2xl font-bold text-white">
                                {formatPrice(totalSpent)} تومان
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservations List */}
            <div className="space-y-4">
                {reservations.map((reservation) => (
                    <div
                        key={reservation.id}
                        className="cafe-card rounded-xl p-5"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                {reservation.session && (
                                    <>
                                        {reservation.session.branch && (
                                            <h3 className="text-lg font-semibold text-white mb-1">
                                                {reservation.session.branch.name}
                                            </h3>
                                        )}
                                        <div className="space-y-1 text-sm text-gray-300 mb-3">
                                            <p>
                                                {formatDate(reservation.session.date)} - {formatTime(reservation.session.start_time)}
                                            </p>
                                            {reservation.session.hall && (
                                                <p>سالن: {reservation.session.hall.name}</p>
                                            )}
                                            <p>تعداد نفرات: {reservation.number_of_people}</p>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center justify-between pt-3 border-t border-red-900/50">
                                    <div>
                                        <span className="text-sm text-gray-300">وضعیت پرداخت: </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getPaymentStatusColor(reservation.payment_status)} text-white`}>
                                            {getPaymentStatusText(reservation.payment_status)}
                                        </span>
                                    </div>
                                    {reservation.payment_transaction && (
                                        <span className="text-lg font-bold text-red-400">
                                            {formatPrice(reservation.payment_transaction.amount)} تومان
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {reservations.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <EmptyBoxIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300 mb-2">رزروی یافت نشد</p>
                    <button
                        onClick={() => navigate('/book')}
                        className="cafe-button px-6 py-2 rounded-lg mt-4"
                    >
                        رزرو جدید
                    </button>
                </div>
            )}
        </div>
    );
}

export default MySessions;

