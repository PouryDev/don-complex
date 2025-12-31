import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, branchService } from '../services/api';
import Loading from '../Components/Loading';
import Input from '../Components/Input';
import { CalendarIcon, WarningIcon, EmptyBoxIcon } from '../Components/Icons';

function BranchSessions() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchBranch();
        fetchSessions();
    }, [branchId, selectedDate]);

    const fetchBranch = async () => {
        try {
            const branchData = await branchService.getBranch(branchId);
            setBranch(branchData);
        } catch (err) {
            console.error('Error fetching branch:', err);
        }
    };

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await sessionService.getBranchSessions(branchId, { date: selectedDate });
            // Handle paginated response - Laravel paginated responses have a 'data' property
            const sessionsData = Array.isArray(response) ? response : (response.data || []);
            setSessions(sessionsData);
        } catch (err) {
            setError('خطا در بارگذاری سانس‌ها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionSelect = (sessionId) => {
        navigate(`/book/session/${sessionId}`);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getStatusText = (status) => {
        const statusMap = {
            'upcoming': 'آینده',
            'ongoing': 'در حال انجام',
            'completed': 'تمام شده',
            'cancelled': 'لغو شده',
        };
        return statusMap[status] || status;
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchSessions}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {branch?.name || 'سانس‌ها'}
                </h1>
                <p className="text-gray-300">سانس مورد نظر خود را انتخاب کنید</p>
            </div>

            {/* Date Filter */}
            <div className="cafe-card rounded-xl p-4">
                <Input
                    label="تاریخ"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                />
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                {sessions
                    .filter(session => session.available_spots > 0 && session.status === 'upcoming')
                    .map((session) => (
                        <button
                            key={session.id}
                            onClick={() => handleSessionSelect(session.id)}
                            className="w-full cafe-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 text-right"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                                    <CalendarIcon className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            {formatTime(session.start_time)}
                                        </h3>
                                        <span className="px-3 py-1 bg-gray-700 text-red-400 rounded-full text-xs font-semibold">
                                            {getStatusText(session.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <span>{formatPrice(session.price)} تومان</span>
                                        <span>•</span>
                                        <span>{session.available_spots} جا خالی</span>
                                        <span>•</span>
                                        <span>حداکثر {session.max_participants} نفر</span>
                                    </div>
                                    {session.hall && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            سالن: {session.hall.name}
                                        </p>
                                    )}
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
            </div>

            {sessions.filter(s => s.available_spots > 0 && s.status === 'upcoming').length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <EmptyBoxIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300 mb-2">سانسی برای این تاریخ یافت نشد</p>
                    <p className="text-sm text-gray-500">لطفا تاریخ دیگری را انتخاب کنید</p>
                </div>
            )}
        </div>
    );
}

export default BranchSessions;

