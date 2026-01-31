import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
    reservationService, 
    sessionService, 
    orderService 
} from '../services/api';
import Loading from './Loading';
import Select from './Select';
import { getCategoryIcon, WarningIcon } from './Icons';

function MenuOrderCheckout({ cartItems, branchId, onClose, onOrderPlaced }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingReservations, setLoadingReservations] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedReservationId, setSelectedReservationId] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [orderType, setOrderType] = useState('reservation'); // 'reservation' or 'session'
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);
    const [minimumCafeOrder, setMinimumCafeOrder] = useState(0);
    const [cafeOrderDeficit, setCafeOrderDeficit] = useState(0);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        if (user && branchId) {
            fetchReservations();
            fetchSessions();
        }
    }, [user, branchId]);

    useEffect(() => {
        if (orderType === 'reservation' && selectedReservationId) {
            const reservation = reservations.find(r => r.id === selectedReservationId);
            setSelectedReservation(reservation);
            if (reservation?.session) {
                calculateMinimumCafeOrder(reservation.session, reservation.number_of_people);
            }
        } else if (orderType === 'session' && selectedSessionId) {
            const session = sessions.find(s => s.id === selectedSessionId);
            setSelectedSession(session);
            if (session) {
                calculateMinimumCafeOrder(session, 1); // Default to 1 person for menu-only orders
            }
        }
    }, [selectedReservationId, selectedSessionId, orderType, reservations, sessions]);

    const fetchReservations = async () => {
        try {
            setLoadingReservations(true);
            const data = await reservationService.getActiveReservationsForMenuOrdering(branchId);
            const reservationsList = Array.isArray(data) ? data : (data.data || []);
            setReservations(reservationsList);
            
            // Auto-select first reservation if available
            if (reservationsList.length > 0) {
                setSelectedReservationId(reservationsList[0].id);
                setOrderType('reservation');
            } else {
                setOrderType('session');
            }
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setOrderType('session'); // Fallback to session selection
        } finally {
            setLoadingReservations(false);
        }
    };

    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const data = await sessionService.getAvailableSessionsForMenuOrdering(branchId);
            const sessionsList = Array.isArray(data) ? data : (data.data || []);
            setSessions(sessionsList);
        } catch (err) {
            console.error('Error fetching sessions:', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const calculateMinimumCafeOrder = (session, numberOfPeople) => {
        if (!session || !session.price) {
            setMinimumCafeOrder(0);
            setCafeOrderDeficit(0);
            return;
        }

        const sessionPricePerPerson = parseFloat(session.price);
        const discountPerPerson = 10000; // 10,000 tomans discount per person
        const minimumPerPerson = Math.max(0, sessionPricePerPerson - discountPerPerson);
        const minimum = minimumPerPerson * numberOfPeople;
        
        setMinimumCafeOrder(minimum);

        // Calculate current order total
        const currentOrderTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const deficit = Math.max(0, minimum - currentOrderTotal);
        setCafeOrderDeficit(deficit);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    const formatDateTime = (date, time) => {
        const dateObj = new Date(date);
        const timeStr = time || '';
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj) + (timeStr ? ` ${timeStr}` : '');
    };

    const handleSubmit = async () => {
        if (!user) {
            showToast('لطفا ابتدا وارد حساب کاربری خود شوید', 'error');
            return;
        }

        if (cartItems.length === 0) {
            showToast('سبد خرید شما خالی است', 'error');
            return;
        }

        if (orderType === 'reservation' && !selectedReservationId) {
            showToast('لطفا یک رزرو انتخاب کنید', 'error');
            return;
        }

        if (orderType === 'session' && !selectedSessionId) {
            showToast('لطفا یک سانس انتخاب کنید', 'error');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orderData = {
                items: cartItems.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                })),
                notes: notes.trim() || null,
            };

            if (orderType === 'reservation') {
                orderData.reservation_id = selectedReservationId;
            } else {
                orderData.session_id = selectedSessionId;
            }

            const result = await orderService.createMenuOrder(orderData);
            
            showToast('سفارش شما با موفقیت ثبت شد!', 'success');
            
            if (onOrderPlaced) {
                onOrderPlaced();
            }
            
            // Navigate to reservations page or payment if needed
            if (result.data?.reservation?.payment_status === 'pending') {
                setTimeout(() => {
                    navigate('/my-sessions');
                }, 1000);
            } else {
                onClose();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const currentOrderTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const hasDeficit = cafeOrderDeficit > 0;

    if (loadingReservations && loadingSessions) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 via-gray-800/30 to-gray-900/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-red-900/50"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">تکمیل سفارش</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-110"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Cart Items */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-3">آیتم‌های سفارش</h3>
                        <div className="space-y-2">
                            {cartItems.map((item) => {
                                const CategoryIcon = getCategoryIcon(item.category?.name || '');
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <CategoryIcon className="w-8 h-8 text-red-400" />
                                            <div>
                                                <h4 className="font-semibold text-white">{item.name}</h4>
                                                <p className="text-sm text-gray-400">
                                                    {formatPrice(item.price)} × {item.quantity.toLocaleString('fa-IR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-lg font-bold text-red-400">
                                                {formatPrice(item.total)} تومان
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300 font-medium">جمع کل:</span>
                                <span className="text-xl font-bold text-white">
                                    {formatPrice(currentOrderTotal)} تومان
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reservation/Session Selection */}
                    {reservations.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-200 mb-2">
                                انتخاب نوع سفارش
                            </label>
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => {
                                        setOrderType('reservation');
                                        setSelectedSessionId(null);
                                        if (reservations.length > 0) {
                                            setSelectedReservationId(reservations[0].id);
                                        }
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        orderType === 'reservation'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    رزرو موجود
                                </button>
                                <button
                                    onClick={() => {
                                        setOrderType('session');
                                        setSelectedReservationId(null);
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        orderType === 'session'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    سانس جدید
                                </button>
                            </div>
                        </div>
                    )}

                    {orderType === 'reservation' && reservations.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-200 mb-2">
                                انتخاب رزرو
                            </label>
                            <Select
                                value={selectedReservationId || ''}
                                onChange={(value) => setSelectedReservationId(parseInt(value))}
                                options={reservations.map(reservation => ({
                                    value: reservation.id,
                                    label: `سانس ${reservation.session?.date || ''} ${reservation.session?.start_time || ''} - ${reservation.number_of_people} نفر`
                                }))}
                                placeholder="رزرو را انتخاب کنید..."
                            />
                            {selectedReservation && (
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-400">
                                        تاریخ: {formatDateTime(selectedReservation.session?.date, selectedReservation.session?.start_time)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        تعداد نفرات: {selectedReservation.number_of_people}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {orderType === 'session' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-200 mb-2">
                                انتخاب سانس
                            </label>
                            {loadingSessions ? (
                                <Loading />
                            ) : sessions.length === 0 ? (
                                <p className="text-gray-400 text-sm">سانسی در بازه زمانی ±5 ساعت یافت نشد</p>
                            ) : (
                                <Select
                                    value={selectedSessionId || ''}
                                    onChange={(value) => setSelectedSessionId(parseInt(value))}
                                    options={sessions.map(session => ({
                                        value: session.id,
                                        label: `${session.date || ''} ${session.start_time || ''} - ${formatPrice(session.price)} تومان`
                                    }))}
                                    placeholder="سانس را انتخاب کنید..."
                                />
                            )}
                            {selectedSession && (
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-400">
                                        تاریخ: {formatDateTime(selectedSession.date, selectedSession.start_time)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        قیمت: {formatPrice(selectedSession.price)} تومان
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Minimum Cafe Order Warning */}
                    {hasDeficit && minimumCafeOrder > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-yellow-50 border-2 border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl"
                        >
                            <div className="flex items-start gap-2">
                                <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">هشدار: سفارش کمتر از حداقل کافه</p>
                                    <p className="text-sm">
                                        سفارش شما ({formatPrice(currentOrderTotal)} تومان) کمتر از حداقل سفارش کافه ({formatPrice(minimumCafeOrder)} تومان) است.
                                    </p>
                                    <p className="text-sm font-semibold mt-1">
                                        شما باید {formatPrice(cafeOrderDeficit)} تومان دیگر اضافه کنید.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-200 mb-2">
                            یادداشت (اختیاری)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="یادداشت برای سفارش..."
                            rows="3"
                            className="w-full px-4 py-3 border-2 border-red-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-gray-700 text-white font-medium resize-none placeholder-gray-400"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-800 p-5 border-t border-gray-700">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || cartItems.length === 0 || (orderType === 'reservation' && !selectedReservationId) || (orderType === 'session' && !selectedSessionId)}
                        className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                در حال ثبت...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ثبت سفارش
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default MenuOrderCheckout;

