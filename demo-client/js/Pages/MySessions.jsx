import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Button from '../Components/Button';
import Checkbox from '../Components/Checkbox';
import { CalendarIcon, WarningIcon, EmptyBoxIcon, CashIcon } from '../Components/Icons';

function MySessions() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [totalSpent, setTotalSpent] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [processingPayment, setProcessingPayment] = useState({});
    const [gateways, setGateways] = useState([]);
    const [showGatewayModal, setShowGatewayModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [selectedGatewayId, setSelectedGatewayId] = useState(null);
    const [gatewayError, setGatewayError] = useState(null);
    const observerTarget = useRef(null);

    useEffect(() => {
        fetchReservations(true);
        fetchGateways();
    }, []);

    const fetchGateways = async () => {
        try {
            const response = await paymentService.getGateways();
            const gatewaysList = response.data || response;
            setGateways(gatewaysList);
        } catch (err) {
            console.error('Error fetching gateways:', err);
        }
    };

    const handlePaymentClick = (reservation) => {
        if (!reservation.payment_transaction?.id) {
            showToast('تراکنش پرداخت یافت نشد', 'error');
            return;
        }

        if (gateways.length === 0) {
            showToast('درگاه پرداختی یافت نشد', 'error');
            return;
        }

        setSelectedReservation(reservation);
        setSelectedGatewayId(null);
        setGatewayError(null);
        setShowGatewayModal(true);
    };

    const handleGatewayConfirm = async () => {
        if (!selectedGatewayId) {
            setGatewayError('لطفا درگاه پرداخت را انتخاب کنید');
            return;
        }

        if (!selectedReservation?.payment_transaction?.id) {
            showToast('تراکنش پرداخت یافت نشد', 'error');
            setShowGatewayModal(false);
            return;
        }

        try {
            setProcessingPayment(prev => ({ ...prev, [selectedReservation.id]: true }));
            setShowGatewayModal(false);
            
            const paymentResult = await paymentService.initiate(
                selectedReservation.payment_transaction.id,
                selectedGatewayId
            );

            if (paymentResult.success && paymentResult.data?.redirect_url) {
                // Redirect to payment gateway
                window.location.href = paymentResult.data.redirect_url;
            } else {
                showToast(paymentResult.message || 'خطا در شروع پرداخت', 'error');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'خطا در پردازش پرداخت';
            showToast(errorMessage, 'error');
            console.error('Error initiating payment:', err);
        } finally {
            setProcessingPayment(prev => ({ ...prev, [selectedReservation.id]: false }));
            setSelectedReservation(null);
            setSelectedGatewayId(null);
            setGatewayError(null);
        }
    };

    const handleGatewayModalClose = () => {
        setShowGatewayModal(false);
        setSelectedReservation(null);
        setSelectedGatewayId(null);
        setGatewayError(null);
    };

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadingMore]);

    const fetchReservations = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setCurrentPage(1);
                setReservations([]);
                setTotalSpent(0);
            } else {
                setLoadingMore(true);
            }
            setError(null);
            
            const page = reset ? 1 : currentPage;
            const response = await reservationService.getReservations({ page, per_page: 15 });
            
            // Handle paginated response
            const reservationsList = response.data || response;
            const paginationInfo = response.current_page !== undefined ? response : null;
            
            if (reset) {
                setReservations(reservationsList);
            } else {
                setReservations(prev => [...prev, ...reservationsList]);
            }
            
            // Calculate total spent from all reservations (including new ones)
            const allReservations = reset ? reservationsList : [...reservations, ...reservationsList];
            const paidTotal = allReservations
                .filter(res => res.payment_status === 'paid' && res.payment_transaction)
                .reduce((sum, res) => sum + (parseFloat(res.payment_transaction.amount) || 0), 0);
            setTotalSpent(paidTotal);
            
            if (paginationInfo) {
                setHasMore(paginationInfo.current_page < paginationInfo.last_page);
                setCurrentPage(paginationInfo.current_page + 1);
            } else {
                // Fallback: if no pagination info, assume no more if items length is less than per_page
                setHasMore(reservationsList.length >= 15);
                if (!reset) {
                    setCurrentPage(prev => prev + 1);
                }
            }
        } catch (err) {
            setError('خطا در بارگذاری رزروها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchReservations(false);
        }
    }, [loadingMore, hasMore, currentPage]);

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
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
                    <WarningIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchReservations}
                    className="cafe-button px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-4">
            {/* Header */}
            <div className="text-center px-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2">سانس‌های من</h1>
                <p className="text-sm sm:text-base text-gray-300">لیست رزروهای شما</p>
            </div>

            {/* Total Spent Card */}
            <div className="cafe-card rounded-xl p-4 sm:p-5 bg-gradient-to-r from-red-500/10 to-red-600/10 border-2 border-red-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white flex-shrink-0">
                            <CashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-300">مجموع پرداختی‌ها</p>
                            <p className="text-lg sm:text-2xl font-bold text-white">
                                {formatPrice(totalSpent)} <span className="text-xs sm:text-sm font-normal">تومان</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservations List */}
            <div className="space-y-3 sm:space-y-4">
                {reservations.map((reservation) => (
                    <div
                        key={reservation.id}
                        className="cafe-card rounded-xl p-4 sm:p-5"
                    >
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {reservation.session && (
                                    <>
                                        {reservation.session.branch && (
                                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                                                {reservation.session.branch.name}
                                            </h3>
                                        )}
                                        <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
                                            <p className="break-words">
                                                {formatDate(reservation.session.date)} - {formatTime(reservation.session.start_time)}
                                            </p>
                                            {reservation.session.hall && (
                                                <p className="break-words">سالن: {reservation.session.hall.name}</p>
                                            )}
                                            <p>تعداد نفرات: {reservation.number_of_people}</p>
                                        </div>
                                    </>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-red-500/20">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-xs sm:text-sm text-gray-300">وضعیت پرداخت: </span>
                                            <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getPaymentStatusColor(reservation.payment_status)} text-white whitespace-nowrap`}>
                                                {getPaymentStatusText(reservation.payment_status)}
                                            </span>
                                        </div>
                                        {reservation.payment_status === 'pending' && reservation.payment_transaction && (
                                            <Button
                                                onClick={() => handlePaymentClick(reservation)}
                                                disabled={processingPayment[reservation.id]}
                                                className="text-xs sm:text-sm py-2 sm:py-2.5 px-4 w-full sm:w-auto"
                                            >
                                                {processingPayment[reservation.id] ? 'در حال انتقال...' : 'پرداخت'}
                                            </Button>
                                        )}
                                    </div>
                                    {reservation.payment_transaction && (
                                        <span className="text-base sm:text-lg font-bold text-red-400 whitespace-nowrap">
                                            {formatPrice(reservation.payment_transaction.amount)} <span className="text-xs sm:text-sm font-normal">تومان</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Infinite scroll sentinel */}
                {hasMore && (
                    <div ref={observerTarget} className="py-4 text-center">
                        {loadingMore && (
                            <div className="text-gray-400">در حال بارگذاری...</div>
                        )}
                    </div>
                )}
            </div>

            {reservations.length === 0 && (
                <div className="text-center py-8 sm:py-12 px-4">
                    <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
                        <EmptyBoxIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 mb-2">رزروی یافت نشد</p>
                    <button
                        onClick={() => navigate('/book')}
                        className="cafe-button px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg mt-3 sm:mt-4 text-sm sm:text-base"
                    >
                        رزرو جدید
                    </button>
                </div>
            )}

            {/* Gateway Selection Modal */}
            <AnimatePresence>
                {showGatewayModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleGatewayModalClose}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        
                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" dir="rtl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25,
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden border-2 border-red-900/50"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 rounded-full p-3">
                                            <CashIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">انتخاب درگاه پرداخت</h3>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <p className="text-gray-300 text-sm mb-4">
                                        لطفا درگاه پرداخت مورد نظر خود را انتخاب کنید
                                    </p>

                                    {/* Gateway List */}
                                    <div className="space-y-3 mb-4">
                                        {gateways.map((gateway) => (
                                            <Checkbox
                                                key={gateway.id}
                                                name={`modal-gateway-${gateway.id}`}
                                                label={gateway.display_name || gateway.name}
                                                checked={selectedGatewayId === gateway.id}
                                                onChange={(e) => {
                                                    // Radio behavior: always set when clicked, prevent unchecking
                                                    if (e.target.checked || selectedGatewayId === gateway.id) {
                                                        setSelectedGatewayId(gateway.id);
                                                        setGatewayError(null);
                                                    }
                                                }}
                                                className="mb-0"
                                            />
                                        ))}
                                    </div>

                                    {/* Error Message */}
                                    {gatewayError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                                        >
                                            <p className="text-sm text-red-400 flex items-center gap-2">
                                                <WarningIcon className="w-4 h-4" />
                                                {gatewayError}
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleGatewayModalClose}
                                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                                        >
                                            لغو
                                        </button>
                                        <button
                                            onClick={handleGatewayConfirm}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                                        >
                                            پرداخت
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MySessions;

