import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cashierService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import { formatPersianDateTime } from '../../utils/dateUtils';

function Orders() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                per_page: 15,
                page,
            };

            const data = await cashierService.getReservations(params);
            // Filter reservations that have orders
            const reservationsWithOrders = (data.data || []).filter(r => r.orders && r.orders.length > 0);
            setReservations(reservationsWithOrders);
            setPagination({
                current_page: data.meta?.current_page || 1,
                last_page: data.meta?.last_page || 1,
                per_page: data.meta?.per_page || 15,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            showToast('خطا در بارگذاری سفارشات', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    if (loading && reservations.length === 0) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">سفارشات کافه</h1>
                <p className="text-gray-400">لیست سفارشات کافه مرتبط با رزروها</p>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {reservations.map((reservation) => (
                    reservation.orders && reservation.orders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(`/cashier/reservations/${reservation.id}`)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        سفارش #{order.id}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        رزرو #{reservation.id} - {reservation.user?.name || 'کاربر'} - {formatPersianDateTime(order.created_at)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-red-400">
                                        {formatPrice(order.total_amount)} تومان
                                    </p>
                                </div>
                            </div>

                            {order.order_items && order.order_items.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {order.order_items.map((item, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-700 text-red-400 rounded-full text-sm border border-red-900/50"
                                            >
                                                {item.menu_item?.name || 'آیتم'} × {item.quantity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {order.notes && (
                                <div className="mt-4 pt-4 border-t border-red-900/50">
                                    <p className="text-sm text-gray-400">یادداشت:</p>
                                    <p className="text-white">{order.notes}</p>
                                </div>
                            )}
                        </motion.div>
                    ))
                )).flat()}
            </div>

            {reservations.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">سفارشی یافت نشد</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => fetchReservations(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        قبلی
                    </button>
                    <span className="px-4 py-2 text-gray-300">
                        صفحه {pagination.current_page} از {pagination.last_page}
                    </span>
                    <button
                        onClick={() => fetchReservations(pagination.current_page + 1)}
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

export default Orders;

