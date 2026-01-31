import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import ReservationCard from '../../Components/Supervisor/ReservationCard';
import GameResultModal from '../../Components/Supervisor/GameResultModal';
import BestPlayerModal from '../../Components/Supervisor/BestPlayerModal';
import { formatPersianDateOnly } from '../../utils/dateUtils';

function SessionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [showGameResultModal, setShowGameResultModal] = useState(false);
    const [showBestPlayerModal, setShowBestPlayerModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchReservations(1);
    }, [id]);

    const fetchReservations = async (page = 1) => {
        try {
            setLoading(true);
            const data = await supervisorService.getSessionReservations(id, {
                per_page: 15,
                page,
            });
            setReservations(data.data || []);
            // Get session info from the first reservation
            if (data.data && data.data.length > 0 && data.data[0].session) {
                setSession(data.data[0].session);
            }
            setPagination({
                current_page: data.meta?.current_page || 1,
                last_page: data.meta?.last_page || 1,
                per_page: data.meta?.per_page || 15,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            showToast('خطا در بارگذاری رزروها', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleValidateReservation = async (reservation) => {
        try {
            await supervisorService.validateReservation(reservation.id);
            showToast('رزرو با موفقیت تایید شد', 'success');
            fetchReservations(pagination.current_page);
        } catch (error) {
            showToast(error.response?.data?.message || 'خطا در تایید رزرو', 'error');
        }
    };

    const handleGameResultSuccess = () => {
        fetchReservations(pagination.current_page);
    };

    const handleBestPlayerSuccess = () => {
        fetchReservations(pagination.current_page);
        if (session) {
            // Refresh session data
            fetchSession();
        }
    };

    if (loading && !session) {
        return <Loading />;
    }

    if (!session && reservations.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">سانس یافت نشد</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={() => navigate('/supervisor/sessions')}
                        className="text-gray-400 hover:text-white mb-2"
                    >
                        ← بازگشت به لیست سانس‌ها
                    </button>
                    <h1 className="text-3xl font-bold text-white">
                        جزئیات سانس #{session?.id || id}
                    </h1>
                </div>
                {session && (
                    <button
                        onClick={() => setShowBestPlayerModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
                    >
                        انتخاب Best Player
                    </button>
                )}
            </div>

            {session && (
                <div className="cafe-card rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">اطلاعات سانس</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">تاریخ</p>
                            <p className="text-white font-medium">
                                {session.date ? formatPersianDateOnly(session.date) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">زمان شروع</p>
                            <p className="text-white font-medium">{session.start_time || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">ظرفیت</p>
                            <p className="text-white font-medium">
                                {session.available_seats !== undefined ? `${session.available_seats}/${session.capacity || 0}` : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Best Player</p>
                            <p className="text-white font-medium">
                                {session.best_player_metadata ? '✓ انتخاب شده' : 'انتخاب نشده'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">رزروها</h2>
                <div className="space-y-4">
                    {reservations.map((reservation) => (
                        <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onViewDetails={() => navigate(`/supervisor/reservations/${reservation.id}`)}
                            onValidate={handleValidateReservation}
                        />
                    ))}
                </div>
            </div>

            {reservations.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">رزروی برای این سانس یافت نشد</p>
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

            {showGameResultModal && selectedReservation && (
                <GameResultModal
                    reservation={selectedReservation}
                    onClose={() => {
                        setShowGameResultModal(false);
                        setSelectedReservation(null);
                    }}
                    onSuccess={handleGameResultSuccess}
                />
            )}

            {showBestPlayerModal && session && (
                <BestPlayerModal
                    session={session}
                    reservations={reservations}
                    onClose={() => setShowBestPlayerModal(false)}
                    onSuccess={handleBestPlayerSuccess}
                />
            )}
        </div>
    );
}

export default SessionDetails;

