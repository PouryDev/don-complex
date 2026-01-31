import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cashierService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import PaymentModal from '../../Components/Cashier/PaymentModal';

function ReservationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        fetchReservation();
    }, [id]);

    const fetchReservation = async () => {
        try {
            setLoading(true);
            const data = await cashierService.getReservation(id);
            setReservation(data);
        } catch (error) {
            showToast('خطا در بارگذاری رزرو', 'error');
            navigate('/cashier/reservations');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentProcessed = () => {
        setShowPaymentModal(false);
        fetchReservation();
        showToast('پرداخت با موفقیت انجام شد', 'success');
    };

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
                        onClick={() => navigate('/cashier/reservations')}
                        className="text-gray-400 hover:text-white mb-2"
                    >
                        ← بازگشت به لیست رزروها
                    </button>
                    <h1 className="text-3xl font-bold text-white">جزئیات رزرو #{reservation.id}</h1>
                </div>
                {reservation.payment_status === 'pending' && (
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                    >
                        پردازش پرداخت
                    </button>
                )}
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
                            <p className="text-sm text-gray-400">وضعیت پرداخت</p>
                            <p className={`font-medium ${
                                reservation.payment_status === 'paid' ? 'text-green-400' : 
                                reservation.payment_status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                {reservation.payment_status === 'paid' ? 'پرداخت شده' : 
                                 reservation.payment_status === 'pending' ? 'در انتظار پرداخت' : 'ناموفق'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">تاریخ ایجاد</p>
                            <p className="text-white font-medium">{formatDate(reservation.created_at)}</p>
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
                                {reservation.session?.date ? formatDate(reservation.session.date) : '-'}
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

            {/* Orders */}
            {reservation.orders && reservation.orders.length > 0 && (
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">سفارشات کافه</h2>
                    <div className="space-y-4">
                        {reservation.orders.map((order) => (
                            <div key={order.id} className="bg-gray-800 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-white font-medium">سفارش #{order.id}</span>
                                    <span className="text-red-400 font-semibold">
                                        {formatPrice(order.total_amount)} تومان
                                    </span>
                                </div>
                                {order.order_items && order.order_items.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {order.order_items.map((item, index) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-300">
                                                    {item.menu_item?.name || 'آیتم'} × {item.quantity}
                                                </span>
                                                <span className="text-gray-400">
                                                    {formatPrice(item.price * item.quantity)} تومان
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
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

            {showPaymentModal && (
                <PaymentModal
                    reservation={reservation}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentProcessed}
                />
            )}
        </div>
    );
}

export default ReservationDetails;

