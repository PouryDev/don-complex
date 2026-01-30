import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { coinService } from '../services/api';

const TransactionIcon = ({ type }) => {
    if (type === 'earned') {
        return (
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        );
    }
    return (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
    );
};

const getSourceLabel = (source) => {
    const labels = {
        quiz: 'پاسخ به کوییز',
        form: 'پر کردن فرم',
        reservation: 'رزرو سانس',
        feed_view: 'مشاهده محتوا',
        discount_purchase: 'خرید کد تخفیف',
        ticket_purchase: 'خرید بلیط رایگان',
    };
    return labels[source] || source;
};

function CoinHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const balanceRes = await coinService.getBalance();
            setBalance(balanceRes.balance || 0);

            const params = {};
            if (filter !== 'all') {
                params.type = filter;
            }
            const historyRes = await coinService.getHistory(params);
            setTransactions(historyRes.data || []);
        } catch (error) {
            console.error('Error fetching coin history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-2xl p-6 shadow-xl"
            >
                <div className="text-center">
                    <h2 className="text-lg text-yellow-100 mb-2">موجودی دنکس شما</h2>
                    <div className="text-5xl font-bold text-white">
                        {new Intl.NumberFormat('fa-IR').format(balance)}
                    </div>
                    <p className="text-yellow-100 mt-2 text-sm">سکه دنکس</p>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'all', label: 'همه' },
                    { id: 'earned', label: 'دریافتی' },
                    { id: 'spent', label: 'خرج شده' },
                ].map((filterOption) => (
                    <button
                        key={filterOption.id}
                        onClick={() => setFilter(filterOption.id)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                            filter === filterOption.id
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {filterOption.label}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">تراکنشی یافت نشد</div>
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((transaction) => (
                        <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-red-900/30 hover:border-red-800/50 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        transaction.type === 'earned' 
                                            ? 'bg-green-500/20' 
                                            : 'bg-red-500/20'
                                    }`}>
                                        <TransactionIcon type={transaction.type} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-white">
                                            {transaction.description || getSourceLabel(transaction.source)}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {formatDate(transaction.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-lg font-bold ${
                                    transaction.type === 'earned' 
                                        ? 'text-green-400' 
                                        : 'text-red-400'
                                }`}>
                                    {transaction.type === 'earned' ? '+' : ''}
                                    {new Intl.NumberFormat('fa-IR').format(transaction.amount)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CoinHistory;

