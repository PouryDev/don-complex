import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { discountCodeService, coinService } from '../services/api';

function DiscountCodes() {
    const [availableCodes, setAvailableCodes] = useState([]);
    const [myCodes, setMyCodes] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my-codes'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balanceRes, availableRes, myCodesRes] = await Promise.all([
                coinService.getBalance(),
                discountCodeService.getAvailable(),
                discountCodeService.getMyCodes(),
            ]);
            setBalance(balanceRes.balance || 0);
            setAvailableCodes(availableRes);
            setMyCodes(myCodesRes);
        } catch (error) {
            console.error('Error fetching discount codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (code) => {
        if (balance < code.coins_cost) {
            alert('سکه کافی ندارید');
            return;
        }

        if (!confirm(`آیا می‌خواهید کد تخفیف "${code.code}" را با ${new Intl.NumberFormat('fa-IR').format(code.coins_cost)} سکه خریداری کنید؟`)) {
            return;
        }

        try {
            setPurchaseLoading(code.id);
            await discountCodeService.purchase(code.id);
            alert('کد تخفیف با موفقیت خریداری شد!');
            await fetchData();
            setActiveTab('my-codes');
        } catch (error) {
            alert(error.response?.data?.message || 'خطا در خرید کد تخفیف');
        } finally {
            setPurchaseLoading(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'نامحدود';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const getDiscountLabel = (code) => {
        if (code.type === 'percentage') {
            return `${code.value}٪ تخفیف`;
        }
        return `${new Intl.NumberFormat('fa-IR').format(code.value)} تومان تخفیف`;
    };

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-2xl p-4 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-yellow-100 text-sm">موجودی دنکس</div>
                        <div className="text-2xl font-bold text-white">
                            {new Intl.NumberFormat('fa-IR').format(balance)} سکه
                        </div>
                    </div>
                    <svg className="w-12 h-12 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('available')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 ${
                        activeTab === 'available'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    کدهای موجود
                </button>
                <button
                    onClick={() => setActiveTab('my-codes')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 ${
                        activeTab === 'my-codes'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    کدهای من ({myCodes.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {activeTab === 'available' ? (
                        availableCodes.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                کد تخفیفی موجود نیست
                            </div>
                        ) : (
                            availableCodes.map((code) => (
                                <motion.div
                                    key={code.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-red-900/30 hover:border-red-800/50 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-2xl font-bold text-red-400 mb-1">
                                                {code.code}
                                            </div>
                                            <div className="text-lg text-green-400 font-semibold">
                                                {getDiscountLabel(code)}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-yellow-400 font-bold text-xl">
                                                {new Intl.NumberFormat('fa-IR').format(code.coins_cost)}
                                            </div>
                                            <div className="text-xs text-gray-400">سکه</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        {code.min_order_amount && (
                                            <div className="text-sm text-gray-300">
                                                حداقل خرید: {new Intl.NumberFormat('fa-IR').format(code.min_order_amount)} تومان
                                            </div>
                                        )}
                                        <div className="text-sm text-gray-300">
                                            تاریخ انقضا: {formatDate(code.expires_at)}
                                        </div>
                                        {code.max_uses && (
                                            <div className="text-sm text-gray-300">
                                                ظرفیت: {code.max_uses - code.used_count} از {code.max_uses}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePurchase(code)}
                                        disabled={purchaseLoading === code.id || balance < code.coins_cost}
                                        className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
                                            balance < code.coins_cost
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
                                        }`}
                                    >
                                        {purchaseLoading === code.id ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                در حال خرید...
                                            </div>
                                        ) : balance < code.coins_cost ? (
                                            'سکه کافی ندارید'
                                        ) : (
                                            'خرید با دنکس'
                                        )}
                                    </button>
                                </motion.div>
                            ))
                        )
                    ) : (
                        myCodes.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                شما هنوز کد تخفیفی خریداری نکرده‌اید
                            </div>
                        ) : (
                            myCodes.map((userCode) => {
                                const code = userCode.discount_code;
                                return (
                                    <motion.div
                                        key={userCode.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border ${
                                            userCode.is_used
                                                ? 'border-gray-700 opacity-60'
                                                : userCode.is_valid
                                                ? 'border-green-600/50'
                                                : 'border-red-600/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="text-2xl font-bold text-red-400 mb-1">
                                                    {code.code}
                                                </div>
                                                <div className="text-lg text-green-400 font-semibold">
                                                    {getDiscountLabel(code)}
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                userCode.is_used
                                                    ? 'bg-gray-700 text-gray-400'
                                                    : userCode.is_valid
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-red-600 text-white'
                                            }`}>
                                                {userCode.is_used ? 'استفاده شده' : userCode.is_valid ? 'فعال' : 'منقضی شده'}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {code.min_order_amount && (
                                                <div className="text-sm text-gray-300">
                                                    حداقل خرید: {new Intl.NumberFormat('fa-IR').format(code.min_order_amount)} تومان
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-300">
                                                تاریخ خرید: {formatDate(userCode.purchased_at)}
                                            </div>
                                            {userCode.used_at && (
                                                <div className="text-sm text-gray-300">
                                                    استفاده شده در: {formatDate(userCode.used_at)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default DiscountCodes;

