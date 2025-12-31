import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/api';
import Loading from '../Components/Loading';
import { getStatusIcon, WarningIcon, EmptyBoxIcon } from '../Components/Icons';

function Orders() {
    const { user } = useAuth();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await orderService.getOrders();
            setOrders(data);
        } catch (err) {
            setError('خطا در بارگذاری سفارشات. لطفا دوباره تلاش کنید.');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status) => {
        const statusMap = {
            'pending_payment': 'در انتظار پرداخت',
            'preparing': 'در حال آماده‌سازی',
            'ready': 'آماده',
            'completed': 'تکمیل شده',
            'cancelled': 'لغو شده',
        };
        return statusMap[status] || status;
    };

    const filters = [
        { id: 'all', name: 'همه' },
        { id: 'pending_payment', name: 'در انتظار پرداخت' },
        { id: 'preparing', name: 'در حال آماده‌سازی' },
        { id: 'ready', name: 'آماده' },
        { id: 'completed', name: 'تکمیل شده' },
    ];

    const getFilterCount = (filterId) => {
        if (filterId === 'all') return orders.length;
        return orders.filter(order => order.status === filterId).length;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending_payment': 'from-yellow-500 to-red-500',
            'preparing': 'from-blue-500 to-cyan-500',
            'ready': 'from-green-500 to-emerald-500',
            'completed': 'from-emerald-600 to-green-600',
            'cancelled': 'from-gray-500 to-gray-600',
        };
        return colors[status] || colors.pending_payment;
    };

    const getStatusIconComponent = (status) => {
        return getStatusIcon(status);
    };

    const filteredOrders = selectedFilter === 'all'
        ? orders
        : orders.filter(order => order.status === selectedFilter);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchOrders}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">سفارشات من</h1>
                <p className="text-gray-300">پیگیری سفارشات خود را اینجا ببینید</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 relative ${
                            selectedFilter === filter.id
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                        }`}
                    >
                        {filter.name}
                        {getFilterCount(filter.id) > 0 && (
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                selectedFilter === filter.id
                                    ? 'bg-white/20'
                                    : 'bg-gray-700 text-red-400'
                            }`}>
                                {getFilterCount(filter.id)}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <div
                        key={order.id}
                        className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200"
                    >
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                    <h3 className="text-lg font-semibold text-white">
                                    سفارش #{order.id}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {formatDate(order.created_at)} - {formatTime(order.created_at)}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(order.status)} text-white text-sm font-semibold flex items-center gap-2`}>
                                {(() => {
                                    const StatusIcon = getStatusIconComponent(order.status);
                                    return <StatusIcon className="w-5 h-5" />;
                                })()}
                                {getStatusText(order.status)}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {order.order_items && order.order_items.map((orderItem, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-700 text-red-400 rounded-full text-sm border border-red-900/50"
                                    >
                                        {orderItem.menu_item?.name || 'آیتم'} × {orderItem.quantity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Order Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-red-900/50">
                            <div>
                                <span className="text-sm text-gray-300">جمع کل:</span>
                                <span className="text-xl font-bold text-red-400 ml-2">
                                    {formatPrice(order.total_amount || 0)} تومان
                                </span>
                            </div>
                            {order.status === 'ready' && (
                                <button className="cafe-button px-6 py-2 rounded-lg text-sm font-semibold">
                                    دریافت سفارش
                                </button>
                            )}
                            {order.status === 'pending_payment' && order.invoice && (
                                <Link
                                    to="/invoices"
                                    className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                                >
                                    پرداخت فاکتور
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <EmptyBoxIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300 mb-2">سفارشی یافت نشد</p>
                    <p className="text-sm text-gray-500">از منو سفارش دهید</p>
                </div>
            )}
        </div>
    );
}

export default Orders;

