import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cashierService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';

function Transactions() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchTransactions();
    }, [selectedFilter]);

    const fetchTransactions = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                per_page: 15,
                page,
            };
            
            if (selectedFilter !== 'all') {
                params.status = selectedFilter;
            }

            const data = await cashierService.getTransactions(params);
            setTransactions(data.data || []);
            setPagination({
                current_page: data.meta?.current_page || 1,
                last_page: data.meta?.last_page || 1,
                per_page: data.meta?.per_page || 15,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            showToast('خطا در بارگذاری تراکنش‌ها', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filters = [
        { id: 'all', name: 'همه' },
        { id: 'paid', name: 'پرداخت شده' },
        { id: 'pending', name: 'در انتظار' },
        { id: 'failed', name: 'ناموفق' },
    ];

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

    const getStatusColor = (status) => {
        const colors = {
            'paid': 'from-green-500 to-emerald-500',
            'pending': 'from-yellow-500 to-orange-500',
            'failed': 'from-red-500 to-red-600',
        };
        return colors[status] || 'from-gray-500 to-gray-600';
    };

    const getStatusText = (status) => {
        const texts = {
            'paid': 'پرداخت شده',
            'pending': 'در انتظار',
            'failed': 'ناموفق',
        };
        return texts[status] || status;
    };

    if (loading && transactions.length === 0) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">تراکنش‌ها</h1>
                <p className="text-gray-400">لیست تراکنش‌های پرداخت</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => {
                            setSelectedFilter(filter.id);
                            fetchTransactions(1);
                        }}
                        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                            selectedFilter === filter.id
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                        }`}
                    >
                        {filter.name}
                    </button>
                ))}
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.map((transaction) => (
                    <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    تراکنش #{transaction.id}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {transaction.reservation?.user?.name || 'کاربر'} - {formatDate(transaction.created_at)}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(transaction.status)} text-white text-sm font-semibold`}>
                                {getStatusText(transaction.status)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">مبلغ</p>
                                <p className="text-white font-semibold text-lg">
                                    {formatPrice(transaction.amount)} تومان
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">درگاه</p>
                                <p className="text-white font-medium">
                                    {transaction.gateway || 'نقدی'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">شماره تراکنش</p>
                                <p className="text-white font-medium">
                                    {transaction.gateway_transaction_id || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">رزرو</p>
                                <p className="text-white font-medium">
                                    #{transaction.reservation_id}
                                </p>
                            </div>
                        </div>

                        {transaction.reservation?.session && (
                            <div className="mt-4 pt-4 border-t border-red-900/50">
                                <p className="text-sm text-gray-400">
                                    سانس: {transaction.reservation.session.date} - {transaction.reservation.session.start_time}
                                </p>
                                <p className="text-sm text-gray-400">
                                    شعبه: {transaction.reservation.session.branch?.name}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {transactions.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">تراکنشی یافت نشد</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => fetchTransactions(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        قبلی
                    </button>
                    <span className="px-4 py-2 text-gray-300">
                        صفحه {pagination.current_page} از {pagination.last_page}
                    </span>
                    <button
                        onClick={() => fetchTransactions(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        بعدی
                    </button>
                </div>
            )}
        </div>
    );
}

export default Transactions;


