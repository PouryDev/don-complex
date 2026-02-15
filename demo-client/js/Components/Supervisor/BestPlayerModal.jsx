import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Loading';

function BestPlayerModal({ session, reservations, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState(
        session?.best_player_metadata?.reservation_id || null
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedReservationId) {
            showToast('لطفا یک بازیکن را انتخاب کنید', 'error');
            return;
        }

        setLoading(true);

        try {
            await supervisorService.selectBestPlayer(session.id, selectedReservationId);
            showToast('Best Player با موفقیت انتخاب شد', 'success');
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در انتخاب Best Player', 'error');
        } finally {
            setLoading(false);
        }
    };

    const validatedReservations = reservations.filter(r => r.validated_at);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="cafe-card rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">انتخاب Best Player</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {validatedReservations.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">هیچ رزرو تایید شده‌ای برای این سانس وجود ندارد</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {validatedReservations.map((reservation) => (
                                    <label
                                        key={reservation.id}
                                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedReservationId === reservation.id
                                                ? 'border-red-600 bg-red-600/20'
                                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reservation"
                                            value={reservation.id}
                                            checked={selectedReservationId === reservation.id}
                                            onChange={(e) => setSelectedReservationId(parseInt(e.target.value))}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {reservation.user?.name || 'کاربر'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    رزرو #{reservation.id} - {reservation.number_of_people} نفر
                                                </p>
                                                {reservation.game_result_metadata?.result && (
                                                    <p className="text-sm text-gray-400 mt-1">
                                                        نتیجه: {
                                                            reservation.game_result_metadata.result === 'win' ? 'برنده' :
                                                            reservation.game_result_metadata.result === 'lose' ? 'بازنده' : 'مساوی'
                                                        }
                                                        {reservation.game_result_metadata.score && ` - امتیاز: ${reservation.game_result_metadata.score}`}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedReservationId === reservation.id && (
                                                <div className="text-red-400 text-2xl">✓</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedReservationId}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50"
                                >
                                    {loading ? 'در حال ثبت...' : 'تایید انتخاب'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default BestPlayerModal;


