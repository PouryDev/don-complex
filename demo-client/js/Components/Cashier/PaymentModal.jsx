import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cashierService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Input from '../Input';

function PaymentModal({ reservation, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState('');

    const handleProcessPayment = async () => {
        try {
            setLoading(true);
            await cashierService.processPayment(reservation.id, note || null);
            onSuccess();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در پردازش پرداخت', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="cafe-card rounded-xl p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">پردازش پرداخت</h2>
                        <p className="text-gray-400">آیا مطمئن هستید که پرداخت انجام شده است؟</p>
                    </div>

                    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">مبلغ قابل پرداخت:</span>
                            <span className="text-2xl font-bold text-red-400">
                                {reservation.total_amount ? `${formatPrice(reservation.total_amount)} تومان` : '-'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                            رزرو #{reservation.id} - {reservation.user?.name}
                        </div>
                    </div>

                    <div className="mb-6">
                        <Input
                            label="یادداشت (اختیاری)"
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="یادداشت برای این پرداخت..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50"
                        >
                            لغو
                        </button>
                        <button
                            onClick={handleProcessPayment}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                        >
                            {loading ? 'در حال پردازش...' : 'تأیید پرداخت'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default PaymentModal;

