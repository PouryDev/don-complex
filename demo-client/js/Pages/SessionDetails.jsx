import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, reservationService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Input from '../Components/Input';
import Button from '../Components/Button';
import Checkbox from '../Components/Checkbox';
import MenuSelector from '../Components/MenuSelector';
import { WarningIcon, CalendarIcon, MenuDefaultIcon } from '../Components/Icons';

function SessionDetails() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [session, setSession] = useState(null);
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [gateways, setGateways] = useState([]);
    const [selectedGatewayId, setSelectedGatewayId] = useState(null);
    const [loadingGateways, setLoadingGateways] = useState(false);
    const [showFoodMenu, setShowFoodMenu] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [foodTotal, setFoodTotal] = useState(0);
    const [foodItemsDetails, setFoodItemsDetails] = useState([]);

    useEffect(() => {
        fetchSession();
        fetchGateways();
    }, [sessionId]);

    const fetchGateways = async () => {
        try {
            setLoadingGateways(true);
            const response = await paymentService.getGateways();
            const gatewaysList = response.data || response;
            setGateways(gatewaysList);
            
            // Auto-select first active gateway
            if (gatewaysList.length > 0) {
                setSelectedGatewayId(gatewaysList[0].id);
            }
        } catch (err) {
            console.error('Error fetching gateways:', err);
        } finally {
            setLoadingGateways(false);
        }
    };

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

        if (!selectedGatewayId && gateways.length > 0) {
            showToast('لطفا درگاه پرداخت را انتخاب کنید', 'error');
            return;
        }

        try {
            setSubmitting(true);
            
            // Create reservation with optional food order
            const reservationData = {
                number_of_people: numberOfPeople
            };
            
            if (orderItems.length > 0) {
                reservationData.order_items = orderItems;
                if (orderNotes.trim()) {
                    reservationData.order_notes = orderNotes.trim();
                }
            }
            
            const reservation = await reservationService.createReservation(sessionId, reservationData.number_of_people, reservationData.order_items, reservationData.order_notes);
            
            // Get payment transaction from reservation
            const paymentTransactionId = reservation.payment_transaction?.id;
            
            if (paymentTransactionId && selectedGatewayId) {
                // Initiate payment
                const paymentResult = await paymentService.initiate(paymentTransactionId, selectedGatewayId);
                
                // Check if we got a redirect URL
                if (paymentResult.success && paymentResult.data?.redirect_url) {
                    // Redirect to payment gateway
                    window.location.href = paymentResult.data.redirect_url;
                } else {
                    showToast(paymentResult.message || 'رزرو با موفقیت انجام شد. لطفا پرداخت را انجام دهید.', 'success');
                    navigate('/my-sessions');
                }
            } else {
                showToast('رزرو با موفقیت انجام شد', 'success');
                navigate('/my-sessions');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'خطا در ثبت رزرو. لطفا دوباره تلاش کنید.';
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

    const calculateTicketTotal = () => {
        if (!session) return 0;
        return session.price * numberOfPeople;
    };

    const calculateMinimumCafeOrder = () => {
        if (!session) return 0;
        const discountPerPerson = 10000; // 10,000 tomans discount per person
        const minimumPerPerson = Math.max(0, session.price - discountPerPerson);
        return minimumPerPerson * numberOfPeople;
    };

    const calculateFoodTotal = () => {
        return foodTotal;
    };

    const calculateCafeOrderPayable = () => {
        const actualOrderTotal = calculateFoodTotal();
        const minimumRequired = calculateMinimumCafeOrder();
        return Math.max(actualOrderTotal, minimumRequired);
    };

    const calculateGrandTotal = () => {
        return calculateTicketTotal() + calculateCafeOrderPayable();
    };

    const handleFoodSelectionChange = (items) => {
        setOrderItems(items);
    };

    const handleFoodTotalChange = (total, itemsDetails) => {
        setFoodTotal(total);
        setFoodItemsDetails(itemsDetails || []);
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
                
                {/* Warning about expiration - Modern Design */}
                <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/15 via-orange-500/10 to-red-500/15 border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-sm shadow-xl">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-orange-500/5 animate-pulse"></div>
                    
                    <div className="relative flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center border-2 border-yellow-400/50">
                            <WarningIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                        </div>
                        <div className="flex-1 text-xs sm:text-sm">
                            <p className="font-bold text-yellow-200 mb-2 sm:mb-2.5 text-sm sm:text-base">⏰ توجه مهم</p>
                            <p className="text-yellow-100/90 leading-relaxed">
                                بعد از ثبت رزرو، شما <span className="font-bold text-yellow-200">15 دقیقه</span> فرصت دارید تا پرداخت را انجام دهید. در غیر این صورت، بلیط شما به صورت خودکار لغو می‌شود و ظرفیت آزاد می‌شود.
                            </p>
                        </div>
                    </div>
                </div>
                
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
                </div>

                {/* Payment Gateway Selection */}
                {gateways.length > 0 && (
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-white mb-2">
                            درگاه پرداخت
                        </label>
                        {loadingGateways ? (
                            <p className="text-xs text-gray-400 mt-1 px-1">
                                در حال بارگذاری درگاه‌های پرداخت...
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {gateways.map((gateway) => (
                                    <Checkbox
                                        key={gateway.id}
                                        name={`gateway-${gateway.id}`}
                                        label={gateway.display_name || gateway.name}
                                        checked={selectedGatewayId === gateway.id}
                                        onChange={(e) => {
                                            // Radio behavior: always set when clicked, prevent unchecking
                                            if (e.target.checked || selectedGatewayId === gateway.id) {
                                                setSelectedGatewayId(gateway.id);
                                            }
                                        }}
                                        disabled={loadingGateways}
                                        className="mb-0"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Food Order Section (Optional) */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => setShowFoodMenu(!showFoodMenu)}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 rounded-xl hover:from-orange-500/30 hover:to-red-500/30 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <MenuDefaultIcon className="w-6 h-6 text-orange-400" />
                            <span className="text-white font-semibold">
                                {showFoodMenu ? 'بستن منوی غذا' : 'سفارش غذا (اختیاری)'}
                            </span>
                        </div>
                        {orderItems.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                {orderItems.length} آیتم
                            </span>
                        )}
                    </button>

                    {showFoodMenu && session?.branch?.id && (
                        <div className="cafe-card rounded-xl p-4 space-y-3">
                            <MenuSelector
                                branchId={session.branch.id}
                                onSelectionChange={handleFoodSelectionChange}
                                initialItems={orderItems}
                                onTotalChange={handleFoodTotalChange}
                            />
                            
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    یادداشت سفارش (اختیاری)
                                </label>
                                <textarea
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder="مثلاً: بدون پیاز، کم نمک، ..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                                    rows={3}
                                    maxLength={500}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {orderNotes.length}/500 کاراکتر
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Price Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-4 sm:p-5 border-2 border-red-500/30 shadow-lg space-y-3">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative space-y-3">
                        <h3 className="text-sm sm:text-base font-bold text-white mb-3">فاکتور</h3>
                        
                        {/* Ticket Price */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">قیمت بلیط ({numberOfPeople} نفر)</span>
                            <span className="text-gray-300">{formatPrice(calculateTicketTotal())} تومان</span>
                        </div>
                        
                        {/* Food Order Details */}
                        {foodItemsDetails.length > 0 && (
                            <div className="space-y-2 pb-2 border-b border-gray-700">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-400">سفارش غذا</span>
                                    <span className="text-orange-400 font-semibold">{formatPrice(foodTotal)} تومان</span>
                                </div>
                                <div className="space-y-1.5 pr-4">
                                    {foodItemsDetails.map((item, index) => (
                                        <div key={item.id || index} className="flex justify-between items-center text-xs text-gray-400">
                                            <span className="flex-1 truncate">
                                                {item.name} × {item.quantity.toLocaleString('fa-IR')}
                                            </span>
                                            <span className="text-gray-300 mr-2">
                                                {formatPrice(item.total)} تومان
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Cafe Order Payable - Show minimum charge if orders are less than minimum */}
                        {(() => {
                            const actualOrderTotal = calculateFoodTotal();
                            const minimumRequired = calculateMinimumCafeOrder();
                            const cafeOrderPayable = calculateCafeOrderPayable();
                            const needsBankCafe = actualOrderTotal < minimumRequired;
                            
                            return (
                                <div className="space-y-2 pb-2 border-b border-gray-700">
                                    {needsBankCafe && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">بانک کافه</span>
                                            <span className="text-yellow-400 font-semibold">
                                                {formatPrice(minimumRequired - actualOrderTotal)} تومان
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">مجموع سفارش کافه</span>
                                        <span className="text-orange-400 font-semibold">
                                            {formatPrice(cafeOrderPayable)} تومان
                                        </span>
                                    </div>
                                    {needsBankCafe && (
                                        <div className="text-xs text-yellow-300 pr-2 mt-1">
                                            حداقل سفارش کافه: {formatPrice(minimumRequired)} تومان
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        
                        {/* Grand Total */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <span className="text-sm sm:text-base text-gray-300 font-medium">جمع کل</span>
                            <span className="text-lg sm:text-2xl text-red-400 font-bold">
                                {formatPrice(calculateGrandTotal())} <span className="text-xs sm:text-sm text-gray-400 font-normal">تومان</span>
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={submitting || numberOfPeople > session.available_spots || numberOfPeople < 1 || !selectedGatewayId || loadingGateways}
                    className="w-full cafe-button py-3 sm:py-3.5 text-sm sm:text-base font-semibold mt-2"
                >
                    {submitting ? 'در حال ثبت رزرو...' : 'ثبت رزرو و پرداخت'}
                </Button>
            </form>
        </div>
    );
}

export default SessionDetails;

