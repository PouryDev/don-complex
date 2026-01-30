import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { freeTicketService, coinService, sessionService } from '../services/api';

const TICKET_PRICE = 100; // Fixed price for free tickets

function FreeTickets() {
    const [tickets, setTickets] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balanceRes, ticketsRes] = await Promise.all([
                coinService.getBalance(),
                freeTicketService.getTickets(),
            ]);
            setBalance(balanceRes.balance || 0);
            setTickets(ticketsRes);
        } catch (error) {
            console.error('Error fetching free tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (balance < TICKET_PRICE) {
            alert('سکه کافی ندارید');
            return;
        }

        if (!confirm(`آیا می‌خواهید بلیط رایگان را با ${new Intl.NumberFormat('fa-IR').format(TICKET_PRICE)} سکه خریداری کنید؟`)) {
            return;
        }

        try {
            setPurchaseLoading(true);
            await freeTicketService.purchase(TICKET_PRICE);
            alert('بلیط رایگان با موفقیت خریداری شد!');
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'خطا در خرید بلیط');
        } finally {
            setPurchaseLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const unusedTickets = tickets.filter(t => !t.is_used && t.is_valid);
    const usedTickets = tickets.filter(t => t.is_used || !t.is_valid);

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

            {/* Purchase Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">بلیط رایگان سانس</h3>
                        <p className="text-purple-200 text-sm">
                            برای هر سانس دلخواه استفاده کنید
                        </p>
                    </div>
                    <svg className="w-16 h-16 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-white">
                        {new Intl.NumberFormat('fa-IR').format(TICKET_PRICE)} سکه
                    </div>
                    <button
                        onClick={handlePurchase}
                        disabled={purchaseLoading || balance < TICKET_PRICE}
                        className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                            balance < TICKET_PRICE
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-white text-purple-700 hover:bg-purple-50 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {purchaseLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                                خرید...
                            </div>
                        ) : balance < TICKET_PRICE ? (
                            'سکه کافی ندارید'
                        ) : (
                            'خرید بلیط'
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Unused Tickets */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {unusedTickets.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-white">بلیط‌های فعال</h3>
                            {unusedTickets.map((ticket) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 shadow-xl border-2 border-green-500"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-lg font-bold text-white mb-2">
                                                بلیط رایگان سانس
                                            </div>
                                            <div className="text-sm text-green-100">
                                                تاریخ خرید: {formatDate(ticket.purchased_at)}
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-white rounded-lg">
                                            <div className="text-xs text-green-700 font-semibold">فعال</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3 bg-green-800/50 rounded-lg">
                                        <div className="text-sm text-green-100">
                                            💡 این بلیط را هنگام رزرو سانس می‌توانید استفاده کنید
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {usedTickets.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-white">تاریخچه استفاده</h3>
                            {usedTickets.map((ticket) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 opacity-75"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-lg font-bold text-gray-300 mb-2">
                                                بلیط رایگان سانس
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                تاریخ خرید: {formatDate(ticket.purchased_at)}
                                            </div>
                                            {ticket.used_at && (
                                                <div className="text-sm text-gray-400">
                                                    استفاده شده: {formatDate(ticket.used_at)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-2 bg-gray-700 rounded-lg">
                                            <div className="text-xs text-gray-400 font-semibold">
                                                {ticket.is_used ? 'استفاده شده' : 'منقضی شده'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {tickets.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            شما هنوز بلیطی خریداری نکرده‌اید
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FreeTickets;

