import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, reservationService, invoiceService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Input from '../Components/Input';
import Button from '../Components/Button';
import { WarningIcon, CalendarIcon } from '../Components/Icons';

function SessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [session, setSession] = useState(null);
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            setError(null);
            const sessionData = await sessionService.getSession(sessionId);
            setSession(sessionData);
        } catch (err) {
            setError('خطا در بارگذاری اطلاعات سانس. لطفا دوباره تلاش کنید.');
            console.error('Error fetching session:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!session) return;

        if (numberOfPeople < 1) {
            showToast('تعداد نفرات باید حداقل 1 باشد', 'error');
            return;
        }

        if (numberOfPeople > session.available_spots) {
            showToast(`حداکثر ${session.available_spots} نفر می‌توانید رزرو کنید`, 'error');
            return;
        }

        try {
            setSubmitting(true);
            
            // Create reservation
            const reservation = await reservationService.createReservation(sessionId, numberOfPeople);
            
            // Get payment transaction from reservation
            const paymentTransactionId = reservation.payment_transaction?.id;
            
            if (paymentTransactionId) {
                // Initiate payment
                await paymentService.initiate(paymentTransactionId);
                
                // Navigate to invoices page or show success
                showToast('رزرو با موفقیت انجام شد. لطفا پرداخت را انجام دهید.', 'success');
                navigate('/my-sessions');
            } else {
                showToast('رزرو با موفقیت انجام شد', 'success');
                navigate('/my-sessions');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'خطا در ثبت رزرو. لطفا دوباره تلاش کنید.';
            showToast(errorMessage, 'error');
            console.error('Error creating reservation:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const calculateTotal = () => {
        if (!session) return 0;
        return session.price * numberOfPeople;
    };

    if (loading) {
        return <Loading />;
    }

    if (error || !session) {
        return (
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
                    <WarningIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4">{error || 'سانس یافت نشد'}</p>
                <button
                    onClick={() => navigate('/book')}
                    className="cafe-button px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base"
                >
                    بازگشت به لیست شعبه‌ها
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-4">
            {/* Header */}
            <div className="text-center px-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2">رزرو سانس</h1>
            </div>

            {/* Session Info Card */}
            <div className="cafe-card rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">اطلاعات سانس</h2>
                </div>
                
                <div className="space-y-2.5 sm:space-y-3">
                    {session.branch && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                            <span className="text-xs sm:text-sm text-gray-400">شعبه</span>
                            <span className="text-sm sm:text-base text-white font-semibold text-left">{session.branch.name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-xs sm:text-sm text-gray-400">تاریخ</span>
                        <span className="text-sm sm:text-base text-white font-semibold">{formatDate(session.date)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-xs sm:text-sm text-gray-400">ساعت</span>
                        <span className="text-sm sm:text-base text-white font-semibold">{formatTime(session.start_time)}</span>
                    </div>
                    {session.hall && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                            <span className="text-xs sm:text-sm text-gray-400">سالن</span>
                            <span className="text-sm sm:text-base text-white font-semibold">{session.hall.name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-xs sm:text-sm text-gray-400">قیمت هر نفر</span>
                        <span className="text-sm sm:text-base text-red-400 font-bold">{formatPrice(session.price)} تومان</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-xs sm:text-sm text-gray-400">جاهای خالی</span>
                        <span className="text-sm sm:text-base text-green-400 font-semibold">{session.available_spots} نفر</span>
                    </div>
                </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleBooking} className="cafe-card rounded-xl p-4 sm:p-5 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">اطلاعات رزرو</h2>
                
                <div className="space-y-1">
                    <Input
                        label="تعداد نفرات"
                        type="number"
                        min={1}
                        max={session.available_spots}
                        value={numberOfPeople}
                        onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
                        required
                    />
                    {session.available_spots > 0 && (
                        <p className="text-xs text-gray-400 mt-1 px-1">
                            حداکثر {session.available_spots} نفر می‌توانید رزرو کنید
                        </p>
                    )}
                </div>

                {/* Total Price Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 sm:p-5 border-2 border-red-500/30 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative flex justify-between items-center">
                        <span className="text-sm sm:text-base text-gray-300 font-medium">جمع کل</span>
                        <span className="text-lg sm:text-2xl text-red-400 font-bold">
                            {formatPrice(calculateTotal())} <span className="text-xs sm:text-sm text-gray-400 font-normal">تومان</span>
                        </span>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={submitting || numberOfPeople > session.available_spots || numberOfPeople < 1}
                    className="w-full cafe-button py-3 sm:py-3.5 text-sm sm:text-base font-semibold mt-2"
                >
                    {submitting ? 'در حال ثبت رزرو...' : 'ثبت رزرو و پرداخت'}
                </Button>
            </form>
        </div>
    );
}

export default SessionDetails;

