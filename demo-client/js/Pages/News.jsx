import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GridIcon, NewsIcon, FormIcon, QuizIcon, ArrowLeftIcon } from '../Components/Icons';
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

    // Get type-specific icon component
    const getTypeIcon = (type) => {
        const icons = {
            news: NewsIcon,
            form: FormIcon,
            quiz: QuizIcon,
        };
        return icons[type] || GridIcon;
    };

    // Get type-specific card styling
    const getCardStyles = (type) => {
        const styles = {
            news: {
                border: 'border-blue-500/30',
                borderHover: 'hover:border-blue-500/50',
                shadow: 'shadow-blue-500/10',
                shadowHover: 'hover:shadow-blue-500/20',
                bgHover: 'hover:bg-blue-500/5',
                iconColor: 'text-blue-400',
            },
            form: {
                border: 'border-purple-500/30',
                borderHover: 'hover:border-purple-500/50',
                shadow: 'shadow-purple-500/10',
                shadowHover: 'hover:shadow-purple-500/20',
                bgHover: 'hover:bg-purple-500/5',
                iconColor: 'text-purple-400',
            },
            quiz: {
                border: 'border-orange-500/30',
                borderHover: 'hover:border-orange-500/50',
                shadow: 'shadow-orange-500/10',
                shadowHover: 'hover:shadow-orange-500/20',
                bgHover: 'hover:bg-orange-500/5',
                iconColor: 'text-orange-400',
            },
        };
        return styles[type] || styles.news;
    };

    // Get semantic badge color based on badge text and type
    const getBadgeColor = (badge, type) => {
        if (!badge) return null;
        
        const badgeText = badge.toLowerCase();
        const urgentKeywords = ['فوری', 'urgent', 'تخفیف', 'discount', 'ویژه', 'special', 'محدود', 'limited'];
        const isUrgent = urgentKeywords.some(keyword => badgeText.includes(keyword));
        
        if (isUrgent) {
            return 'bg-red-500/20 border border-red-500/50 text-red-400';
        }
        
        // Type-based default colors
        const typeColors = {
            news: 'bg-gray-500/20 border border-gray-500/50 text-gray-400',
            form: 'bg-purple-500/20 border border-purple-500/50 text-purple-400',
            quiz: 'bg-orange-500/20 border border-orange-500/50 text-orange-400',
        };
        
        return typeColors[type] || typeColors.news;
    };

    // Get CTA text based on type
    const getCTAText = (type) => {
        const texts = {
            form: 'تکمیل فرم',
            quiz: 'مشاهده جزئیات',
            news: 'ادامه مطلب',
        };
        return texts[type] || 'مشاهده جزئیات';
    };

    // Get CTA button styling based on type
    const getCTAStyles = (type) => {
        const styles = {
            news: 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500 focus:ring-2 focus:ring-blue-500/50',
            form: 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 focus:ring-2 focus:ring-purple-500/50',
            quiz: 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500 focus:ring-2 focus:ring-orange-500/50',
        };
        return styles[type] || styles.news;
    };

    // Get focus ring class for card container
    const getFocusRingClass = (type) => {
        const rings = {
            news: 'focus-within:ring-2 focus-within:ring-blue-500/50',
            form: 'focus-within:ring-2 focus-within:ring-purple-500/50',
            quiz: 'focus-within:ring-2 focus-within:ring-orange-500/50',
        };
        return rings[type] || rings.news;
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
                <div className="space-y-6">
                    {feedItems.map((item) => {
                        const TypeIcon = getTypeIcon(item.type);
                        const cardStyles = getCardStyles(item.type);
                        const badgeColor = getBadgeColor(item.badge, item.type);
                        const ctaText = getCTAText(item.type);
                        const ctaStyles = getCTAStyles(item.type);

                        return (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`cafe-card rounded-xl p-6 border-2 ${cardStyles.border} ${cardStyles.borderHover} ${cardStyles.shadow} ${cardStyles.shadowHover} ${cardStyles.bgHover} ${getFocusRingClass(item.type)} transition-all duration-300 ease-out hover:-translate-y-1 cursor-pointer`}
                                onClick={() => navigate(`/feed/${item.type}/${item.id}`)}
                            >
                                {/* Item Header */}
                                <div className="flex items-start gap-4 mb-5">
                                    {/* Type Icon */}
                                    <div className={`flex-shrink-0 ${cardStyles.iconColor}`}>
                                        <TypeIcon className="w-6 h-6" />
                                    </div>
                                    
                                    {/* Title and Description */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <h3 className="text-xl font-bold text-white leading-tight">
                                                {item.title}
                                            </h3>
                                            {item.badge && badgeColor && (
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${badgeColor}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Item Content based on type */}
                                {item.type === 'news' && item.image_url && (
                                    <div className="mb-4 rounded-lg overflow-hidden">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>
                                )}

                                {item.type === 'form' && item.fields && (
                                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-purple-500/20">
                                        <p className="text-xs text-gray-400">
                                            تعداد فیلدها: {item.fields.length}
                                        </p>
                                    </div>
                                )}

                                {item.type === 'quiz' && item.questions && (
                                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-gray-400">
                                            تعداد سوالات: {item.questions.length}
                                        </p>
                                    </div>
                                )}

                                {/* Item Footer */}
                                <div className="pt-4 mt-4 border-t border-gray-700/50 flex items-center justify-between">
                                    <p className="text-xs text-gray-500 font-medium">
                                        {new Date(item.created_at).toLocaleDateString('fa-IR')}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/feed/${item.type}/${item.id}`);
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 ${ctaStyles} transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none`}
                                        aria-label={ctaText}
                                    >
                                        <span>{ctaText}</span>
                                        <ArrowLeftIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    
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

