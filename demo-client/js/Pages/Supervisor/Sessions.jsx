import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supervisorService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import SessionCard from '../../Components/Supervisor/SessionCard';

function Sessions() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        fetchSessions(1);
    }, [selectedDate, selectedStatus]);

    const fetchSessions = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                per_page: 15,
                page,
            };
            
            if (selectedDate) {
                params.date = selectedDate;
            }

            if (selectedStatus !== 'all') {
                params.status = selectedStatus;
            }

            const data = await supervisorService.getSessions(params);
            setSessions(data.data || []);
            setPagination({
                current_page: data.meta?.current_page || 1,
                last_page: data.meta?.last_page || 1,
                per_page: data.meta?.per_page || 15,
                total: data.meta?.total || 0,
            });
        } catch (error) {
            showToast('خطا در بارگذاری سانس‌ها', 'error');
        } finally {
            setLoading(false);
        }
    };

    const statusFilters = [
        { id: 'all', name: 'همه' },
        { id: 'upcoming', name: 'آینده' },
        { id: 'ongoing', name: 'در حال انجام' },
        { id: 'completed', name: 'تکمیل شده' },
    ];

    if (loading && sessions.length === 0) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">سانس‌ها</h1>
                <p className="text-gray-400">مدیریت سانس‌های شعبه</p>
            </div>

            {/* Filters */}
            <div className="cafe-card rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400 mb-2">تاریخ</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                const newParams = new URLSearchParams(searchParams);
                                if (e.target.value) {
                                    newParams.set('date', e.target.value);
                                } else {
                                    newParams.delete('date');
                                }
                                setSearchParams(newParams);
                            }}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-red-900/50 focus:border-red-600 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => {
                                    setSelectedStatus(filter.id);
                                    const newParams = new URLSearchParams(searchParams);
                                    if (filter.id === 'all') {
                                        newParams.delete('status');
                                    } else {
                                        newParams.set('status', filter.id);
                                    }
                                    setSearchParams(newParams);
                                }}
                                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                                    selectedStatus === filter.id
                                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                                }`}
                            >
                                {filter.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                {sessions.map((session) => (
                    <SessionCard
                        key={session.id}
                        session={session}
                        onViewDetails={() => navigate(`/supervisor/sessions/${session.id}`)}
                    />
                ))}
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">سانسی یافت نشد</p>
                </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => fetchSessions(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                        قبلی
                    </button>
                    <span className="px-4 py-2 text-gray-300">
                        صفحه {pagination.current_page} از {pagination.last_page}
                    </span>
                    <button
                        onClick={() => fetchSessions(pagination.current_page + 1)}
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

export default Sessions;

