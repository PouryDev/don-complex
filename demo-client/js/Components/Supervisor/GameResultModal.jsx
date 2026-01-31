import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Input from '../Input';

function GameResultModal({ reservation, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        result: reservation?.game_result_metadata?.result || 'win',
        score: reservation?.game_result_metadata?.score || '',
        notes: reservation?.game_result_metadata?.notes || '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await supervisorService.registerGameResult(reservation.id, {
                result: formData.result,
                score: formData.score ? parseInt(formData.score) : null,
                notes: formData.notes || null,
            });
            showToast('نتیجه بازی با موفقیت ثبت شد', 'success');
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در ثبت نتیجه بازی', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="cafe-card rounded-xl p-6 w-full max-w-md"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">ثبت نتیجه بازی</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">نتیجه</label>
                            <select
                                value={formData.result}
                                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                required
                            >
                                <option value="win">برنده</option>
                                <option value="lose">بازنده</option>
                                <option value="draw">مساوی</option>
                            </select>
                        </div>

                        <Input
                            label="امتیاز (اختیاری)"
                            type="number"
                            value={formData.score}
                            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                            placeholder="0"
                            min="0"
                        />

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">یادداشت (اختیاری)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                                rows="3"
                                placeholder="یادداشت..."
                                maxLength={1000}
                            />
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
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50"
                            >
                                {loading ? 'در حال ثبت...' : 'ثبت نتیجه'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default GameResultModal;

