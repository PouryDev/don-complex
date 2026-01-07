import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, branchService } from '../services/api';
import Loading from '../Components/Loading';
import PersianDatePicker from '../Components/PersianDatePicker';
import { CalendarIcon, WarningIcon, EmptyBoxIcon } from '../Components/Icons';

function BranchSessions() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    useEffect(() => {
        fetchBranch();
    }, [branchId]);

    useEffect(() => {
        fetchSessions(true);
    }, [branchId, selectedDate]);

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, loading, loadingMore]);

    const fetchBranch = async () => {
        try {
            const branchData = await branchService.getBranch(branchId);
            setBranch(branchData);
        } catch (err) {
            console.error('Error fetching branch:', err);
        }
    };

    const fetchSessions = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setCurrentPage(1);
                setSessions([]);
            } else {
                setLoadingMore(true);
            }
            setError(null);
            
            const page = reset ? 1 : currentPage;
            const response = await sessionService.getBranchSessions(branchId, { 
                date: selectedDate,
                page,
                per_page: 15
            });
            
            // Handle paginated response
            const sessionsData = response.data || response;
            const paginationInfo = response.current_page !== undefined ? response : null;
            
            if (reset) {
                setSessions(sessionsData);
            } else {
                setSessions(prev => [...prev, ...sessionsData]);
            }
            
            if (paginationInfo) {
                setHasMore(paginationInfo.current_page < paginationInfo.last_page);
                setCurrentPage(paginationInfo.current_page + 1);
            } else {
                // Fallback: if no pagination info, assume no more if items length is less than per_page
                setHasMore(sessionsData.length >= 15);
                if (!reset) {
                    setCurrentPage(prev => prev + 1);
                }
            }
        } catch (err) {
            setError('خطا در بارگذاری سانس‌ها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching sessions:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchSessions(false);
        }
    }, [loadingMore, hasMore, currentPage]);

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
            <div className="text-center py-8 sm:py-12 px-4">
                <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
                    <WarningIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchSessions}
                    className="cafe-button px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-4">

            {/* Date Filter */}
            <div className="cafe-card rounded-xl p-3 sm:p-4">
                <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        تاریخ
                    </label>
                    <PersianDatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        placeholder="تاریخ را انتخاب کنید"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
                {sessions
                    .filter(session => session.available_spots > 0 && session.status === 'upcoming')
                    .map((session) => (
                        <button
                            key={session.id}
                            onClick={() => handleSessionSelect(session.id)}
                            className="w-full cafe-card rounded-xl p-3 sm:p-4 active:scale-[0.98] transition-all duration-200 text-right touch-manipulation"
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Time Icon */}
                                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                                            {formatTime(session.start_time)}
                                        </h3>
                                        <span className="flex-shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-700/80 text-red-400 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                                            {getStatusText(session.status)}
                                        </span>
                                    </div>
                                    
                                    {/* Info Row */}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-300">
                                        <span className="font-medium text-white">{formatPrice(session.price)} تومان</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-green-400 font-medium">{session.available_spots} جا خالی</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400">حداکثر {session.max_participants} نفر</span>
                                    </div>
                                    
                                    {/* Hall Name */}
                                    {session.hall && (
                                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 truncate">
                                            سالن: {session.hall.name}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Arrow Icon */}
                                <div className="flex-shrink-0 text-gray-400" style={{transform: 'rotate(180deg)'}}>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
                
                {/* Infinite scroll sentinel */}
                {hasMore && (
                    <div ref={observerTarget} className="py-3 sm:py-4 text-center">
                        {loadingMore && (
                            <div className="text-xs sm:text-sm text-gray-400">در حال بارگذاری...</div>
                        )}
                    </div>
                )}
            </div>

            {sessions.filter(s => s.available_spots > 0 && s.status === 'upcoming').length === 0 && (
                <div className="text-center py-8 sm:py-12">
                    <div className="flex justify-center mb-3 sm:mb-4 text-red-500">
                        <EmptyBoxIcon className="w-12 h-12 sm:w-16 sm:h-16" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 mb-1.5 sm:mb-2">سانسی برای این تاریخ یافت نشد</p>
                    <p className="text-xs sm:text-sm text-gray-500">لطفا تاریخ دیگری را انتخاب کنید</p>
                </div>
            )}
        </div>
    );
}

export default BranchSessions;

