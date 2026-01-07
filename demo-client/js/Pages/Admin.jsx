import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminService } from '../services/api';
import Loading from '../Components/Loading';
import ConfirmDialog from '../Components/ConfirmDialog';
import { WarningIcon, EmptyBoxIcon, CashIcon } from '../Components/Icons';

function Admin() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null, newStatus: null });
    const isInitialLoad = useRef(true);

    const fetchOrders = useCallback(async (isInitialLoad = false, filter = selectedFilter) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            } else {
                setFiltering(true);
            }
            setError(null);
            const status = filter === 'all' ? null : filter;
            const data = await adminService.getOrders(status);
            setOrders(data.data || data);
        } catch (err) {
            setError('خطا در بارگذاری سفارشات. لطفا دوباره تلاش کنید.');
            console.error('Error fetching admin orders:', err);
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    }, []);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchOrders(true, selectedFilter);
            isInitialLoad.current = false;
        } else {
            setLoading(false);
        }
    }, [user, fetchOrders]);

    useEffect(() => {
        if (user && user.role === 'admin' && !isInitialLoad.current) {
            // Only fetch when filter changes, not on initial load
            fetchOrders(false, selectedFilter);
        }
    }, [selectedFilter, user, fetchOrders]);

    const handleStatusUpdate = (orderId, newStatus) => {
        setConfirmDialog({
            isOpen: true,
            orderId,
            newStatus,
        });
    };

    const confirmStatusUpdate = async () => {
        const { orderId, newStatus } = confirmDialog;
        setConfirmDialog({ isOpen: false, orderId: null, newStatus: null });

        try {
            setUpdatingStatus(orderId);
            await adminService.updateOrderStatus(orderId, newStatus);
            await fetchOrders(); // Refresh orders
            showToast('وضعیت سفارش با موفقیت به‌روزرسانی شد', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'خطا در به‌روزرسانی وضعیت سفارش', 'error');
            console.error('Error updating order status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const cancelStatusUpdate = () => {
        setConfirmDialog({ isOpen: false, orderId: null, newStatus: null });
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
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

    const filters = [
        { id: 'all', name: 'همه' },
        { id: 'pending_payment', name: 'در انتظار پرداخت' },
        { id: 'preparing', name: 'در حال آماده‌سازی' },
        { id: 'ready', name: 'آماده' },
        { id: 'completed', name: 'تکمیل شده' },
    ];

    const calculateStats = () => {
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at).toDateString();
            return orderDate === today;
        });

        // Calculate revenue from completed orders today
        const todayRevenue = todayOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => {
                // Use invoice final_amount if available, otherwise use order final_amount
                return sum + (order.invoice?.final_amount || order.final_amount || 0);
            }, 0);

        return {
            todayOrders: todayOrders.length,
            todayRevenue,
            activeUsers: new Set(orders.map(order => order.user_id)).size,
            totalMenuItems: new Set(orders.flatMap(order => 
                order.order_items?.map(item => item.menu_item_id) || []
            )).size,
        };
    };


    if (loading) {
        return <Loading />;
    }

    // Show filtering indicator without full page reload
    const isLoading = loading || filtering;

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchOrders}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className="space-y-6">

            {/* Quick Stats */}
            <div className="cafe-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">آمار سریع</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-400 mb-1">
                            {stats.todayOrders}
                        </div>
                        <div className="text-sm text-gray-600">سفارشات امروز</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-400 mb-1">
                            {formatPrice(stats.todayRevenue)}
                        </div>
                        <div className="text-sm text-gray-600">درآمد امروز (تومان)</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-400 mb-1">
                            {stats.activeUsers}
                        </div>
                        <div className="text-sm text-gray-600">کاربران فعال</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-red-400 mb-1">
                            {orders.length}
                        </div>
                        <div className="text-sm text-gray-600">کل سفارشات</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
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

            {/* Orders List */}
            {filtering && (
                <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-red-500">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>در حال فیلتر کردن...</span>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-white">
                                        سفارش #{order.id}
                                    </h3>
                                    {/* Cash payment indicator */}
                                    {order.payment_method === 'cash' && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold border border-green-300 flex items-center gap-1">
                                            <CashIcon className="w-4 h-4" />
                                            <span>نقدی</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {order.user?.name || 'کاربر'} - {formatDate(order.created_at)}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(order.status)} text-white text-sm font-semibold`}>
                                {getStatusText(order.status)}
                            </div>
                        </div>

                        {/* Order Items */}
                        {order.order_items && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {order.order_items.map((orderItem, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-700 text-red-400 rounded-full text-sm border border-red-900/50"
                                        >
                                            {orderItem.menu_item?.name || 'آیتم'} × {orderItem.quantity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Order Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-red-900/50">
                            <div>
                                <span className="text-sm text-gray-600">مبلغ:</span>
                                <span className="text-xl font-bold text-red-400 ml-2">
                                    {formatPrice(order.total_amount || 0)} تومان
                                </span>
                                {/* Show cash payment reminder for admin */}
                                {order.payment_method === 'cash' && order.payment_status === 'pending' && (
                                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
                                        <CashIcon className="w-4 h-4" />
                                        <span>پرداخت نقدی - پول را از مشتری دریافت کنید</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {order.status === 'pending_payment' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'preparing')}
                                        disabled={updatingStatus === order.id}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {updatingStatus === order.id ? '...' : 'شروع آماده‌سازی'}
                                    </button>
                                )}
                                {order.status === 'preparing' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                                        disabled={updatingStatus === order.id}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {updatingStatus === order.id ? '...' : 'آماده است'}
                                    </button>
                                )}
                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                                        disabled={updatingStatus === order.id}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        {updatingStatus === order.id ? '...' : 'تکمیل شد'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <EmptyBoxIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-600">سفارشی یافت نشد</p>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="تأیید تغییر وضعیت"
                message="آیا مطمئن هستید که می‌خواهید وضعیت سفارش را تغییر دهید؟"
                onConfirm={confirmStatusUpdate}
                onCancel={cancelStatusUpdate}
                confirmText="تأیید"
                cancelText="لغو"
                type="warning"
            />
        </div>
    );
}

export default Admin;

