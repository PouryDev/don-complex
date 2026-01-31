import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import GameResultModal from '../../Components/Supervisor/GameResultModal';
import { formatPersianDateTime, formatPersianDateOnly } from '../../utils/dateUtils';

function ReservationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState(null);
    const [showGameResultModal, setShowGameResultModal] = useState(false);

    useEffect(() => {
        fetchReservation();
    }, [id]);

    const fetchReservation = async () => {
        try {
            setLoading(true);
            const data = await supervisorService.getReservation(id);
            setReservation(data);
        } catch (error) {
            showToast('خطا در بارگذاری رزرو', 'error');
            navigate('/supervisor/sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleFraudReport = async () => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این رزرو را به عنوان تقلب گزارش کنید؟ این عمل غیرقابل بازگشت است و بلیط‌ها بدون بازگشت پول سوزانده می‌شوند.')) {
            return;
        }
        
        try {
            await supervisorService.reportFraud(id);
            showToast('رزرو به عنوان تقلب گزارش شد و بلیط‌ها سوزانده شدند', 'success');
            fetchReservation();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در گزارش تقلب', 'error');
        }
    };

    const handleGameResultSuccess = () => {
        fetchReservation();
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    if (loading) {
        return <Loading />;
    }

    if (!reservation) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">رزرو یافت نشد</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={() => {
                            if (reservation.session_id) {
                                navigate(`/supervisor/sessions/${reservation.session_id}`);
                            } else {
                                navigate('/supervisor/sessions');
                            }
                        }}
                        className="text-gray-400 hover:text-white mb-2"
                    >
                        ← بازگشت
                    </button>
                    <h1 className="text-3xl font-bold text-white">جزئیات رزرو #{reservation.id}</h1>
                </div>
                <div className="flex gap-2">
                    {!reservation.cancelled_at && reservation.payment_status === 'paid' && (
                        <button
                            onClick={handleFraudReport}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all font-semibold"
                        >
                            گزارش تقلب
                        </button>
                    )}
                    <button
                        onClick={() => setShowGameResultModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                    >
                        {reservation.game_result_metadata ? 'ویرایش نتیجه' : 'ثبت نتیجه بازی'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reservation Info */}
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">اطلاعات رزرو</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-400">کاربر</p>
                            <p className="text-white font-medium">{reservation.user?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">تعداد نفرات</p>
                            <p className="text-white font-medium">{reservation.number_of_people} نفر</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">وضعیت تایید</p>
                            <p className={`font-medium ${
                                reservation.validated_at ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                                {reservation.validated_at ? 'تایید شده' : 'در انتظار تایید'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">تاریخ ایجاد</p>
                            <p className="text-white font-medium">{formatPersianDateTime(reservation.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* Session Info */}
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">اطلاعات سانس</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-400">شعبه</p>
                            <p className="text-white font-medium">{reservation.session?.branch?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">سالن</p>
                            <p className="text-white font-medium">{reservation.session?.hall?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">تاریخ و زمان</p>
                            <p className="text-white font-medium">
                                {reservation.session?.date ? formatPersianDateOnly(reservation.session.date) : '-'}
                                {reservation.session?.start_time && ` - ${reservation.session.start_time}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">قیمت بلیط</p>
                            <p className="text-white font-medium">
                                {reservation.ticket_price ? `${formatPrice(reservation.ticket_price)} تومان` : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Result */}
            {reservation.game_result_metadata && (
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">نتیجه بازی</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">نتیجه</p>
                            <p className="text-white font-medium">
                                {reservation.game_result_metadata.result === 'win' ? 'برنده' :
                                 reservation.game_result_metadata.result === 'lose' ? 'بازنده' : 'مساوی'}
                            </p>
                        </div>
                        {reservation.game_result_metadata.score !== null && (
                            <div>
                                <p className="text-sm text-gray-400">امتیاز</p>
                                <p className="text-white font-medium">{reservation.game_result_metadata.score}</p>
                            </div>
                        )}
                        {reservation.game_result_metadata.notes && (
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-400">یادداشت</p>
                                <p className="text-white font-medium">{reservation.game_result_metadata.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Transaction */}
            {reservation.payment_transaction && (
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">اطلاعات تراکنش</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">مبلغ</p>
                            <p className="text-white font-medium">
                                {formatPrice(reservation.payment_transaction.amount)} تومان
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">وضعیت</p>
                            <p className={`font-medium ${
                                reservation.payment_transaction.status === 'paid' ? 'text-green-400' : 
                                reservation.payment_transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                {reservation.payment_transaction.status === 'paid' ? 'پرداخت شده' : 
                                 reservation.payment_transaction.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">درگاه</p>
                            <p className="text-white font-medium">
                                {reservation.payment_transaction.gateway || 'نقدی'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">شماره تراکنش</p>
                            <p className="text-white font-medium">
                                {reservation.payment_transaction.gateway_transaction_id || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Total Amount */}
            <div className="cafe-card rounded-xl p-6 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-500/50">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">مبلغ کل</h2>
                    <p className="text-3xl font-bold text-red-400">
                        {reservation.total_amount ? `${formatPrice(reservation.total_amount)} تومان` : '-'}
                    </p>
                </div>
            </div>

            {showGameResultModal && (
                <GameResultModal
                    reservation={reservation}
                    onClose={() => setShowGameResultModal(false)}
                    onSuccess={handleGameResultSuccess}
                />
            )}
        </div>
    );
}

export default ReservationDetails;

