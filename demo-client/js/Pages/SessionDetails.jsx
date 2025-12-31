import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, reservationService, invoiceService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Input from '../Components/Input';
import Button from '../Components/Button';
import { WarningIcon } from '../Components/Icons';

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
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error || 'سانس یافت نشد'}</p>
                <button
                    onClick={() => navigate('/book')}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    بازگشت به لیست شعبه‌ها
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">رزرو سانس</h1>
            </div>

            {/* Session Info */}
            <div className="cafe-card rounded-xl p-5">
                <h2 className="text-xl font-semibold text-white mb-4">اطلاعات سانس</h2>
                <div className="space-y-3">
                    {session.branch && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">شعبه:</span>
                            <span className="text-white font-semibold">{session.branch.name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">تاریخ:</span>
                        <span className="text-white font-semibold">{formatDate(session.date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">ساعت:</span>
                        <span className="text-white font-semibold">{formatTime(session.start_time)}</span>
                    </div>
                    {session.hall && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">سالن:</span>
                            <span className="text-white font-semibold">{session.hall.name}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">قیمت هر نفر:</span>
                        <span className="text-white font-semibold">{formatPrice(session.price)} تومان</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-300">جاهای خالی:</span>
                        <span className="text-white font-semibold">{session.available_spots} نفر</span>
                    </div>
                </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleBooking} className="cafe-card rounded-xl p-5 space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">اطلاعات رزرو</h2>
                
                <Input
                    label="تعداد نفرات"
                    type="number"
                    min={1}
                    max={session.available_spots}
                    value={numberOfPeople}
                    onChange={(e) => setNumberOfPeople(parseInt(e.target.value) || 1)}
                    required
                    className="bg-gray-800 text-white"
                />

                {/* Total Price */}
                <div className="flex justify-between items-center p-4 bg-gray-800 rounded-lg border-2 border-red-500/20">
                    <span className="text-gray-300 text-lg">جمع کل:</span>
                    <span className="text-red-400 font-bold text-xl">
                        {formatPrice(calculateTotal())} تومان
                    </span>
                </div>

                <Button
                    type="submit"
                    disabled={submitting || numberOfPeople > session.available_spots || numberOfPeople < 1}
                    className="w-full cafe-button py-3 text-lg"
                >
                    {submitting ? 'در حال ثبت رزرو...' : 'ثبت رزرو و پرداخت'}
                </Button>
            </form>
        </div>
    );
}

export default SessionDetails;

