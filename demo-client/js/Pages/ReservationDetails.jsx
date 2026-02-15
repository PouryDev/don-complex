import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationService, reservationOrderService, paymentService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import Button from '../Components/Button';
import MenuSelector from '../Components/MenuSelector';
import OrderSummary from '../Components/OrderSummary';
import ConfirmDialog from '../Components/ConfirmDialog';
import { CalendarIcon, MenuDefaultIcon, WarningIcon, EditIcon, PlusIcon } from '../Components/Icons';

function ReservationDetails() {
    const { reservationId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [reservation, setReservation] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, orderId: null });

    useEffect(() => {
        fetchReservationDetails();
    }, [reservationId]);

    const fetchReservationDetails = async () => {
        try {
            setLoading(true);
            const [reservationData, ordersData] = await Promise.all([
                reservationService.getReservation(reservationId),
                reservationOrderService.getOrders(reservationId)
            ]);
            
            setReservation(reservationData);
            setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.data || []));
        } catch (err) {
            console.error('Error fetching reservation details:', err);
            showToast('خطا در بارگذاری اطلاعات رزرو', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrder = () => {
        setEditingOrder(null);
        setOrderItems([]);
        setOrderNotes('');
        setShowOrderModal(true);
    };

    const handleEditOrder = (order) => {
        setEditingOrder(order);
        setOrderItems(order.items.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity
        })));
        setOrderNotes(order.notes || '');
        setShowOrderModal(true);
    };

    const handleDeleteOrder = async (orderId) => {
        setDeleteDialog({ isOpen: true, orderId });
    };

    const confirmDeleteOrder = async () => {
        try {
            await reservationOrderService.deleteOrder(deleteDialog.orderId);
            showToast('سفارش با موفقیت حذف شد', 'success');
            setDeleteDialog({ isOpen: false, orderId: null });
            await fetchReservationDetails();
        } catch (err) {
            console.error('Error deleting order:', err);
            showToast(err.response?.data?.message || 'خطا در حذف سفارش', 'error');
        }
    };

    const handleSaveOrder = async () => {
        if (orderItems.length === 0) {
            showToast('لطفاً حداقل یک آیتم انتخاب کنید', 'error');
            return;
        }

        try {
            setSubmittingOrder(true);
            
            const orderData = {
                items: orderItems,
                notes: orderNotes.trim() || null
            };

            if (editingOrder) {
                await reservationOrderService.updateOrder(editingOrder.id, orderData);
                showToast('سفارش با موفقیت بروزرسانی شد', 'success');
            } else {
                await reservationOrderService.createOrder(reservationId, orderData);
                showToast('سفارش با موفقیت ثبت شد', 'success');
            }

            setShowOrderModal(false);
            await fetchReservationDetails();
        } catch (err) {
            console.error('Error saving order:', err);
            showToast(err.response?.data?.message || 'خطا در ثبت سفارش', 'error');
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handlePayment = async () => {
        if (!reservation?.payment_transaction?.id) {
            showToast('اطلاعات پرداخت یافت نشد', 'error');
            return;
        }

        try {
            // Get payment gateways and initiate payment
            const gateways = await paymentService.getGateways();
            if (gateways && gateways.length > 0) {
                const paymentResult = await paymentService.initiate(reservation.payment_transaction.id, gateways[0].id);
                
                if (paymentResult.success && paymentResult.data?.redirect_url) {
                    window.location.href = paymentResult.data.redirect_url;
                } else {
                    showToast('خطا در ایجاد درخواست پرداخت', 'error');
                }
            }
        } catch (err) {
            console.error('Error initiating payment:', err);
            showToast('خطا در ایجاد درخواست پرداخت', 'error');
        }
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

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const canModifyOrders = () => {
        return reservation?.payment_status === 'pending' && 
               !reservation?.cancelled_at &&
               reservation?.session;
    };

    if (loading) {
        return <Loading />;
    }

    if (!reservation) {
        return (
            <div className="text-center py-12">
                <WarningIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-300">رزرو یافت نشد</p>
                <Button onClick={() => navigate('/my-sessions')} className="mt-4">
                    بازگشت به رزروها
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-4">
            {/* Reservation Info */}
            <div className="cafe-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">جزئیات رزرو</h2>
                        <p className="text-sm text-gray-400">شماره رزرو: #{reservation.id}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {reservation.session?.branch && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                            <span className="text-sm text-gray-400">شعبه</span>
                            <span className="text-white font-semibold">{reservation.session.branch.name}</span>
                        </div>
                    )}
                    {reservation.session && (
                        <>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                                <span className="text-sm text-gray-400">تاریخ</span>
                                <span className="text-white font-semibold">{formatDate(reservation.session.date)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                                <span className="text-sm text-gray-400">ساعت</span>
                                <span className="text-white font-semibold">{formatTime(reservation.session.start_time)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span className="text-sm text-gray-400">تعداد نفرات</span>
                        <span className="text-white font-semibold">{reservation.number_of_people} نفر</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-400">وضعیت پرداخت</span>
                        <span className={`font-semibold ${
                            reservation.payment_status === 'paid' ? 'text-green-400' : 
                            reservation.payment_status === 'pending' ? 'text-yellow-400' : 
                            'text-red-400'
                        }`}>
                            {reservation.payment_status === 'paid' ? 'پرداخت شده' : 
                             reservation.payment_status === 'pending' ? 'در انتظار پرداخت' : 
                             'ناموفق'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Orders Section */}
            <div className="cafe-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <MenuDefaultIcon className="w-6 h-6 text-orange-400" />
                        <h3 className="text-lg font-bold text-white">سفارشات غذا</h3>
                    </div>
                    
                    {canModifyOrders() && (
                        <Button
                            onClick={handleAddOrder}
                            className="flex items-center gap-2 text-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            افزودن سفارش
                        </Button>
                    )}
                </div>

                <OrderSummary
                    orders={orders}
                    onEdit={canModifyOrders() ? handleEditOrder : null}
                    onDelete={canModifyOrders() ? handleDeleteOrder : null}
                    canModify={canModifyOrders()}
                />
            </div>

            {/* Total Amount */}
            {reservation.total_amount && (
                <div className="cafe-card rounded-xl p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-red-500/30">
                    <div className="flex justify-between items-center">
                        <span className="text-lg text-gray-300 font-medium">مبلغ کل</span>
                        <span className="text-2xl text-red-400 font-bold">
                            {formatPrice(reservation.total_amount)} <span className="text-sm text-gray-400 font-normal">تومان</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Payment Button */}
            {reservation.payment_status === 'pending' && !reservation.cancelled_at && (
                <Button
                    onClick={handlePayment}
                    className="w-full py-3 text-base font-semibold"
                >
                    پرداخت
                </Button>
            )}

            {/* Order Modal */}
            <AnimatePresence>
                {showOrderModal && reservation?.session?.branch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowOrderModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">
                                {editingOrder ? 'ویرایش سفارش' : 'افزودن سفارش جدید'}
                            </h3>

                            <MenuSelector
                                branchId={reservation.session.branch.id}
                                onSelectionChange={setOrderItems}
                                initialItems={orderItems}
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
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={handleSaveOrder}
                                    disabled={submittingOrder || orderItems.length === 0}
                                    className="flex-1"
                                >
                                    {submittingOrder ? 'در حال ثبت...' : 'ثبت سفارش'}
                                </Button>
                                <Button
                                    onClick={() => setShowOrderModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600"
                                >
                                    انصراف
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="حذف سفارش"
                message="آیا از حذف این سفارش اطمینان دارید؟"
                confirmText="حذف"
                cancelText="انصراف"
                onConfirm={confirmDeleteOrder}
                onCancel={() => setDeleteDialog({ isOpen: false, orderId: null })}
                type="danger"
            />
        </div>
    );
}

export default ReservationDetails;


