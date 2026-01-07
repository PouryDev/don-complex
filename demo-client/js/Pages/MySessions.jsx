import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Button from '../Components/Button';
import Checkbox from '../Components/Checkbox';
import CountdownTimer from '../Components/CountdownTimer';
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

    const isReservationExpired = (reservation) => {
        if (!reservation.expires_at) return false;
        if (reservation.payment_status !== 'pending') return false;
        try {
            const now = new Date().getTime();
            const expiry = new Date(reservation.expires_at).getTime();
            if (isNaN(expiry)) return false; // Invalid date
            return expiry <= now;
        } catch (e) {
            console.error('Error checking expiration:', e);
            return false;
        }
    };

    const shouldShowCountdown = (reservation) => {
        return reservation.payment_status === 'pending' 
            && reservation.expires_at 
            && !isReservationExpired(reservation);
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

            {/* Total Spent Card - Modern Design */}
            <div className="relative overflow-hidden cafe-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-red-500/15 via-red-600/10 to-red-700/15 border-2 border-red-500/30 shadow-2xl">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-600/10 animate-pulse"></div>
                
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-xl flex-shrink-0">
                            <CashIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-red-400/30 blur-xl"></div>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-1.5 font-medium">مجموع پرداختی‌ها</p>
                            <p className="text-xl sm:text-3xl font-bold text-white flex items-baseline gap-1.5">
                                <span>{formatPrice(totalSpent)}</span>
                                <span className="text-xs sm:text-sm font-normal text-gray-400">تومان</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reservations List */}
            <div className="space-y-3 sm:space-y-4">
                {reservations.map((reservation) => {
                    const expired = isReservationExpired(reservation);
                    return (
                    <div
                        key={reservation.id}
                        className={`cafe-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 overflow-hidden relative group ${
                            expired ? 'opacity-75 border-2 border-red-500/30' : ''
                        }`}
                    >
                        {/* Gradient overlay for pending reservations */}
                        {reservation.payment_status === 'pending' && reservation.expires_at && !expired && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
                        )}
                        {/* Gradient overlay for expired reservations */}
                        {expired && (
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-600/10 pointer-events-none"></div>
                        )}
                        
                        <div className="relative flex items-start gap-3 sm:gap-4">
                            {/* Icon with modern design */}
                            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                                expired
                                    ? 'bg-gradient-to-br from-red-600 to-red-700'
                                    : reservation.payment_status === 'paid' 
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                    : reservation.payment_status === 'pending'
                                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                                    : 'bg-gradient-to-br from-red-500 to-red-600'
                            }`}>
                                <CalendarIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                                {/* Pulse effect for pending */}
                                {reservation.payment_status === 'pending' && reservation.expires_at && !expired && (
                                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-yellow-400/30 animate-ping"></div>
                                )}
                                {/* Pulse effect for expired */}
                                {expired && (
                                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-red-600/40 animate-pulse"></div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {reservation.session && (
                                    <>
                                        {reservation.session.branch && (
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 truncate">
                                                {reservation.session.branch.name}
                                            </h3>
                                        )}
                                        <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
                                            <div className="flex items-center gap-2 text-white/90">
                                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="break-words">
                                                    {formatDate(reservation.session.date)} - {formatTime(reservation.session.start_time)}
                                                </p>
                                            </div>
                                            {reservation.session.hall && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <p className="break-words">سالن: {reservation.session.hall.name}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                <p>تعداد نفرات: <span className="font-semibold text-white">{reservation.number_of_people}</span></p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                {/* Payment Status Section */}
                                <div className="flex flex-col gap-3 sm:gap-3.5 pt-3 sm:pt-4 border-t border-gradient-to-r from-red-500/20 via-red-500/10 to-transparent">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                            <span className="text-xs sm:text-sm text-gray-400">وضعیت:</span>
                                            {expired ? (
                                                <span className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-red-700 text-white whitespace-nowrap shadow-lg">
                                                    منقضی شده
                                                </span>
                                            ) : (
                                                <span className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r ${getPaymentStatusColor(reservation.payment_status)} text-white whitespace-nowrap shadow-lg`}>
                                                    {getPaymentStatusText(reservation.payment_status)}
                                                </span>
                                            )}
                                            {shouldShowCountdown(reservation) && (
                                                <CountdownTimer 
                                                    expiresAt={reservation.expires_at}
                                                    onExpire={() => {
                                                        showToast('زمان پرداخت بلیط شما به پایان رسید. لطفا رزرو جدیدی انجام دهید.', 'error');
                                                        fetchReservations(true);
                                                    }}
                                                />
                                            )}
                                        </div>
                                        {reservation.payment_transaction && (
                                            <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 border border-red-500/20">
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm sm:text-base font-bold text-red-300 whitespace-nowrap">
                                                    {formatPrice(reservation.payment_transaction.amount)}
                                                </span>
                                                <span className="text-xs sm:text-sm text-gray-400 font-normal">تومان</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {reservation.payment_status === 'pending' && reservation.payment_transaction && !expired && (
                                        <Button
                                            onClick={() => handlePaymentClick(reservation)}
                                            disabled={processingPayment[reservation.id]}
                                            className="w-full sm:w-auto text-sm sm:text-base py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                                        >
                                            {processingPayment[reservation.id] ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    در حال انتقال...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    پرداخت
                                                </span>
                                            )}
                                        </Button>
                                    )}
                                    {expired && (
                                        <div className="w-full sm:w-auto text-sm sm:text-base py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl sm:rounded-2xl font-bold bg-gradient-to-r from-red-600/20 to-red-700/20 border-2 border-red-500/30 text-red-300 text-center">
                                            زمان پرداخت این رزرو به پایان رسیده است
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })}
                
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

