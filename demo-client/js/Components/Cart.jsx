import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { orderService, discountService } from '../services/api';
import Select from './Select';
import { getCategoryIcon, CashIcon } from './Icons';

function Cart({ onClose }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { cart, updateCartItemQuantity, removeFromCart, clearCart, loading: cartLoading, syncing } = useCart();
    const [discountCode, setDiscountCode] = useState('');
    const [discountResult, setDiscountResult] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentGatewayId, setPaymentGatewayId] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const updateQuantity = async (menuItemId, newQuantity) => {
        try {
            await updateCartItemQuantity(menuItemId, newQuantity);
        } catch (err) {
            setError(err.response?.data?.message || 'خطا در بروزرسانی تعداد');
        }
    };

    const handleRemoveItem = async (menuItemId) => {
        try {
            await removeFromCart(menuItemId);
        } catch (err) {
            setError(err.response?.data?.message || 'خطا در حذف آیتم');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateDiscount = () => {
        if (discountResult && discountResult.valid) {
            return discountResult.discount_amount || 0;
        }
        return 0;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const handleValidateDiscount = async () => {
        if (!discountCode.trim()) {
            setError('لطفا کد تخفیف را وارد کنید');
            return;
        }

        try {
            setError(null);
            const result = await discountService.validate(discountCode, calculateSubtotal());
            setDiscountResult(result);
            if (!result.valid) {
                setError(result.message || 'کد تخفیف معتبر نیست');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'خطا در اعتبارسنجی کد تخفیف');
            setDiscountResult(null);
        }
    };

    const handleCheckout = async () => {
        if (!user) {
            setError('لطفا ابتدا وارد حساب کاربری خود شوید');
            return;
        }

        if (cart.length === 0) {
            setError('سبد خرید شما خالی است');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orderData = {
                items: cart.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                })),
                payment_method: paymentMethod,
                payment_gateway_id: paymentGatewayId,
                discount_code: discountResult?.valid ? discountCode : null,
                notes: notes.trim() || null,
            };

            const result = await orderService.createOrder(orderData);
            
            // Clear cart
            await clearCart();
            setDiscountCode('');
            setDiscountResult(null);
            setNotes('');
            
            // Show success and redirect
            showToast('سفارش شما با موفقیت ثبت شد!', 'success');
            setTimeout(() => {
                navigate('/orders');
            }, 500);
        } catch (err) {
            setError(err.response?.data?.message || 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <motion.div
                initial={{ 
                    y: isMobile ? '100%' : 0,
                    scale: isMobile ? 1 : 0.9,
                    opacity: 0
                }}
                animate={{ 
                    y: 0,
                    scale: 1,
                    opacity: 1
                }}
                exit={{ 
                    y: isMobile ? '100%' : 0,
                    scale: isMobile ? 1 : 0.9,
                    opacity: 0
                }}
                transition={{ 
                    type: "spring",
                    damping: 25,
                    stiffness: 300
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 via-gray-800/30 to-gray-900/30 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t-4 sm:border-t-0 border-red-600 sm:border border-red-900/50"
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-5 flex items-center justify-between shadow-lg z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold">سبد خرید</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 hover:scale-110"
                    >
                        ×
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    {syncing ? (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                                <svg className="animate-spin h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-300 text-lg font-medium">در حال بارگذاری سبد خرید...</p>
                        </div>
                    ) : cart.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-300 text-lg font-medium">سبد خرید شما خالی است</p>
                            <p className="text-gray-400 text-sm mt-2">آیتم‌های مورد علاقه خود را اضافه کنید</p>
                        </div>
                    ) : (
                        <>
                            {cart.map((item, index) => (
                                <motion.div
                                    key={`${item.id}-${index}`}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -100, scale: 0.8 }}
                                    transition={{ 
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 300,
                                        delay: index * 0.05
                                    }}
                                    className="bg-gray-800 rounded-xl p-4 shadow-md border border-red-900/50 hover:shadow-lg transition-all duration-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (() => {
                                                const CategoryIcon = getCategoryIcon(item.category?.name || '');
                                                return <CategoryIcon className="w-8 h-8 text-red-400" />;
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg mb-1">{item.name}</h3>
                                            <p className="text-sm text-gray-300 mb-2">
                                                {formatPrice(item.price)} تومان
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={cartLoading}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-md text-red-400 hover:bg-gray-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-white">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={cartLoading}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-md text-red-400 hover:bg-gray-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-lg font-bold text-red-400">
                                                        {formatPrice(item.price * item.quantity)} تومان
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={cartLoading}
                                            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Discount Code */}
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 border border-red-900/50">
                                <label className="block text-sm font-bold text-gray-200 mb-2">
                                    کد تخفیف
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        placeholder="کد تخفیف خود را وارد کنید"
                                        className="flex-1 px-4 py-3 border-2 border-red-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-gray-700 text-white font-medium placeholder-gray-400"
                                    />
                                    <button
                                        onClick={handleValidateDiscount}
                                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        اعمال
                                    </button>
                                </div>
                                {discountResult?.valid && (
                                    <div className="mt-3 bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        کد تخفیف اعمال شد: {formatPrice(calculateDiscount())} تومان
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="bg-gray-800 rounded-xl p-4 border border-red-900/50">
                                <Select
                                    label="روش پرداخت"
                                    value={paymentMethod}
                                    onChange={(value) => setPaymentMethod(value)}
                                    options={[
                                        { value: 'cash', label: 'نقدی', icon: <CashIcon className="w-5 h-5" /> },
                                        { value: 'card_to_card', label: 'کارت به کارت', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
                                        { value: 'gateway', label: 'درگاه پرداخت', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
                                    ]}
                                    placeholder="روش پرداخت را انتخاب کنید"
                                />
                            </div>

                            {/* Notes */}
                            <div className="bg-gray-800 rounded-xl p-4 border border-red-900/50">
                                <label className="block text-sm font-bold text-gray-200 mb-3">
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
                                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Summary */}
                            <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white shadow-lg">
                                {/* Cart Items Details */}
                                <div className="mb-4 space-y-3">
                                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        جزئیات سفارش
                                    </h3>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin">
                                        {cart.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-white/15 rounded-lg p-3 border border-white/20"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-6 h-6 rounded" />
                                                            ) : (() => {
                                                                const CategoryIcon = getCategoryIcon(item.category?.name || '');
                                                                return <CategoryIcon className="w-6 h-6" />;
                                                            })()}
                                                            <h4 className="font-bold text-white text-sm sm:text-base truncate">
                                                                {item.name}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs sm:text-sm text-red-100 mt-2">
                                                            <span className="flex items-center gap-1">
                                                                <span>قیمت واحد:</span>
                                                                <span className="font-semibold">{formatPrice(item.price)} تومان</span>
                                                            </span>
                                                            <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                                                                <span>تعداد:</span>
                                                                <span className="font-bold">{item.quantity}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left flex-shrink-0">
                                                        <div className="text-lg sm:text-xl font-bold text-white">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </div>
                                                        <div className="text-xs text-red-200">تومان</div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Summary */}
                                <div className="space-y-2.5 mb-4 pt-4 border-t border-white/30">
                                    <div className="flex justify-between items-center text-red-100">
                                        <span className="font-medium flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            جمع کل:
                                        </span>
                                        <span className="font-semibold text-lg">{formatPrice(calculateSubtotal())} تومان</span>
                                    </div>
                                    {discountResult?.valid && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex justify-between items-center text-green-200 bg-green-500/20 rounded-lg px-3 py-2 border border-green-300/30"
                                        >
                                            <span className="font-medium flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                تخفیف:
                                            </span>
                                            <span className="font-semibold text-lg">-{formatPrice(calculateDiscount())} تومان</span>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Final Total */}
                                <div className="flex justify-between items-center pt-4 border-t-2 border-white/40 bg-white/10 rounded-lg px-4 py-3">
                                    <span className="text-xl font-bold flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        مبلغ نهایی:
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-bold">{formatPrice(calculateTotal())} تومان</span>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={loading || cart.length === 0}
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
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default Cart;

