import React from 'react';
import { motion } from 'framer-motion';
import { MenuDefaultIcon, EditIcon, DeleteIcon } from './Icons';

function OrderSummary({ orders, onEdit, onDelete, canModify = true }) {
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>هنوز سفارشی ثبت نشده است</p>
            </div>
        );
    }

    const getTotalAmount = () => {
        return orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    };

    const getTotalItems = () => {
        return orders.reduce((sum, order) => {
            return sum + (order.items || []).reduce((itemSum, item) => itemSum + item.quantity, 0);
        }, 0);
    };

    return (
        <div className="space-y-4">
            {orders.map((order, orderIndex) => (
                <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: orderIndex * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                    {/* Order Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                سفارش #{order.id}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                وضعیت: <span className="font-medium">{getStatusLabel(order.status)}</span>
                            </p>
                        </div>
                        
                        {canModify && order.can_be_modified && (
                            <div className="flex gap-2">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(order)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="ویرایش سفارش"
                                    >
                                        <EditIcon className="w-5 h-5" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(order)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="حذف سفارش"
                                    >
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="p-4 space-y-3">
                        {(order.items || []).map((item, itemIndex) => (
                            <div
                                key={itemIndex}
                                className="flex gap-3 items-center"
                            >
                                {/* Image */}
                                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                    {item.menu_item?.image ? (
                                        <img
                                            src={item.menu_item.image}
                                            alt={item.menu_item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <MenuDefaultIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                {/* Item Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {item.menu_item?.name || 'نامشخص'}
                                    </h4>
                                    {item.menu_item?.category && (
                                        <p className="text-sm text-gray-500">
                                            {item.menu_item.category.name}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600 mt-1">
                                        {parseFloat(item.price).toLocaleString('fa-IR')} تومان × {item.quantity.toLocaleString('fa-IR')}
                                    </p>
                                </div>

                                {/* Subtotal */}
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">
                                        {parseFloat(item.subtotal).toLocaleString('fa-IR')}
                                    </p>
                                    <p className="text-xs text-gray-500">تومان</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                        <div className="px-4 pb-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">یادداشت:</span> {order.notes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Order Total */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">جمع این سفارش:</span>
                            <span className="text-lg font-bold text-blue-600">
                                {parseFloat(order.total_amount).toLocaleString('fa-IR')} تومان
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Grand Total */}
            {orders.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: orders.length * 0.1 }}
                    className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200"
                >
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-gray-700">
                            <span>تعداد کل آیتم‌ها:</span>
                            <span className="font-bold">{getTotalItems().toLocaleString('fa-IR')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                            <span className="text-lg font-semibold text-gray-900">جمع کل سفارشات:</span>
                            <span className="text-xl font-bold text-blue-600">
                                {getTotalAmount().toLocaleString('fa-IR')} تومان
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'در انتظار',
        'confirmed': 'تایید شده',
        'preparing': 'در حال آماده‌سازی',
        'ready': 'آماده تحویل',
        'delivered': 'تحویل داده شده',
        'cancelled': 'لغو شده'
    };
    return labels[status] || status;
}

export default OrderSummary;

