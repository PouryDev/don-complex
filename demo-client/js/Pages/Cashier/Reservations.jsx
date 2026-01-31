import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cashierService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import ReservationCard from '../../Components/Cashier/ReservationCard';

function Reservations() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [reservations, setReservations] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(searchParams.get('payment_status') || 'all');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchReservations(1);
    }, [selectedFilter]);

    const fetchReservations = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                per_page: 15,
                page,
            };
            
            if (selectedFilter !== 'all') {
                params.payment_status = selectedFilter;
            }

            const data = await cashierService.getReservations(params);
            setReservations(data.data || []);
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

    const filters = [
        { id: 'all', name: 'همه' },
        { id: 'pending', name: 'در انتظار پرداخت' },
        { id: 'paid', name: 'پرداخت شده' },
    ];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(Math.round(price));
    };

    if (loading && reservations.length === 0) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">رزروها</h1>
                <p className="text-gray-400">مدیریت رزروهای شعبه</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => {
                            setSelectedFilter(filter.id);
                            // Update URL params
                            const newParams = new URLSearchParams(searchParams);
                            if (filter.id === 'all') {
                                newParams.delete('payment_status');
                            } else {
                                newParams.set('payment_status', filter.id);
                            }
                            setSearchParams(newParams);
                        }}
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

            {/* Reservations List */}
            <div className="space-y-4">
                {reservations.map((reservation) => (
                    <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        onViewDetails={() => navigate(`/cashier/reservations/${reservation.id}`)}
                        onPaymentProcessed={() => fetchReservations(pagination.current_page)}
                    />
                ))}
            </div>

            {reservations.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">رزروی یافت نشد</p>
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

export default Reservations;

