import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridIcon } from '../Components/Icons';
import { feedService } from '../services/api';
import Loading from '../Components/Loading';

function News() {
    const navigate = useNavigate();
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    useEffect(() => {
        fetchFeed(true);
    }, []);

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

    const fetchFeed = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setCurrentPage(1);
                setFeedItems([]);
            } else {
                setLoadingMore(true);
            }
            setError(null);
            
            const page = reset ? 1 : currentPage;
            const response = await feedService.getFeed({ page, per_page: 15 });
            
            // Handle paginated response
            const items = response.data || response;
            const paginationInfo = response.current_page !== undefined ? response : null;
            
            if (reset) {
                setFeedItems(items);
            } else {
                setFeedItems(prev => [...prev, ...items]);
            }
            
            if (paginationInfo) {
                setHasMore(paginationInfo.current_page < paginationInfo.last_page);
                setCurrentPage(paginationInfo.current_page + 1);
            } else {
                // Fallback: if no pagination info, assume no more if items length is less than per_page
                setHasMore(items.length >= 15);
                if (!reset) {
                    setCurrentPage(prev => prev + 1);
                }
            }
        } catch (err) {
            setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
            console.error('Error fetching feed:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchFeed(false);
        }
    }, [loadingMore, hasMore, currentPage]);

    const getTypeLabel = (type) => {
        const labels = {
            news: 'اخبار',
            form: 'فرم',
            quiz: 'کوئیز',
        };
        return labels[type] || type;
    };

    const getTypeColor = (type) => {
        const colors = {
            news: 'from-blue-500 to-blue-600',
            form: 'from-green-500 to-green-600',
            quiz: 'from-purple-500 to-purple-600',
        };
        return colors[type] || 'from-gray-500 to-gray-600';
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <GridIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchFeed}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Feed Items */}
            {feedItems.length === 0 ? (
                <div className="cafe-card rounded-xl p-12 text-center">
                    <div className="flex justify-center mb-6 text-red-500">
                        <GridIcon className="w-20 h-20" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-4">
                        محتوایی وجود ندارد
                    </h2>
                    <p className="text-gray-300">
                        در حال حاضر هیچ محتوایی برای نمایش وجود ندارد.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedItems.map((item) => (
                        <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => navigate(`/feed/${item.type}/${item.id}`)}
                            className="cafe-card rounded-xl p-5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
                        >
                            {/* Item Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-white">
                                            {item.title}
                                        </h3>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getTypeColor(
                                                item.type
                                            )} text-white`}
                                        >
                                            {getTypeLabel(item.type)}
                                        </span>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-300">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                {item.badge && (
                                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold whitespace-nowrap">
                                        {item.badge}
                                    </div>
                                )}
                            </div>

                            {/* Item Content based on type */}
                            {item.type === 'news' && item.image_url && (
                                <div className="mb-4">
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                </div>
                            )}

                            {item.type === 'form' && item.fields && (
                                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-2">
                                        تعداد فیلدها: {item.fields.length}
                                    </p>
                                </div>
                            )}

                            {item.type === 'quiz' && item.questions && (
                                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-2">
                                        تعداد سوالات: {item.questions.length}
                                    </p>
                                </div>
                            )}

                            {/* Item Footer */}
                            <div className="pt-4 border-t border-red-900/50">
                                <p className="text-xs text-gray-500">
                                    {new Date(item.created_at).toLocaleDateString('fa-IR')}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Infinite scroll sentinel */}
                    {hasMore && (
                        <div ref={observerTarget} className="py-4 text-center">
                            {loadingMore && (
                                <div className="text-gray-400">در حال بارگذاری...</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default News;

