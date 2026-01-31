import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Loading';

function AssignGameMasterModal({ session, onClose, onSuccess }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [gameMasters, setGameMasters] = useState([]);
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [selectedGameMasterId, setSelectedGameMasterId] = useState(
        session?.game_master?.id || null
    );

    useEffect(() => {
        fetchGameMasters();
    }, []);

    const fetchGameMasters = async () => {
        try {
            setLoadingMasters(true);
            const data = await supervisorService.getGameMasters();
            setGameMasters(data.game_masters || []);
        } catch (error) {
            showToast('خطا در بارگذاری لیست Game Master ها', 'error');
        } finally {
            setLoadingMasters(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedGameMasterId) {
            showToast('لطفا یک Game Master را انتخاب کنید', 'error');
            return;
        }

        setLoading(true);

        try {
            await supervisorService.assignGameMaster(session.id, selectedGameMasterId);
            showToast('Game Master با موفقیت انتساب داده شد', 'success');
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در انتساب Game Master', 'error');
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
                    className="cafe-card rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">انتساب Game Master</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {loadingMasters ? (
                        <div className="text-center py-8">
                            <Loading />
                        </div>
                    ) : gameMasters.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">هیچ Game Master در این شعبه وجود ندارد</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                <label
                                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        selectedGameMasterId === null
                                            ? 'border-red-600 bg-red-600/20'
                                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="gameMaster"
                                        value=""
                                        checked={selectedGameMasterId === null}
                                        onChange={() => setSelectedGameMasterId(null)}
                                        className="sr-only"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-semibold">
                                                بدون Game Master
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                حذف انتساب فعلی
                                            </p>
                                        </div>
                                        {selectedGameMasterId === null && (
                                            <div className="text-red-400 text-2xl">✓</div>
                                        )}
                                    </div>
                                </label>
                                {gameMasters.map((gameMaster) => (
                                    <label
                                        key={gameMaster.id}
                                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            selectedGameMasterId === gameMaster.id
                                                ? 'border-red-600 bg-red-600/20'
                                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="gameMaster"
                                            value={gameMaster.id}
                                            checked={selectedGameMasterId === gameMaster.id}
                                            onChange={(e) => setSelectedGameMasterId(parseInt(e.target.value))}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {gameMaster.name}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {gameMaster.email}
                                                </p>
                                            </div>
                                            {selectedGameMasterId === gameMaster.id && (
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
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50"
                                >
                                    {loading ? 'در حال ثبت...' : 'تایید انتساب'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default AssignGameMasterModal;

