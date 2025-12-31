import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService, discountService } from '../services/api';
import { CoffeeCupIcon, OrdersListIcon, UserIcon, ShoppingCartIcon, CheckIcon, StarIcon, CelebrationIcon } from '../Components/Icons';

function Home() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);
    const [stats, setStats] = useState({
        activeOrders: 0,
        paidInvoices: 0,
        totalOrders: 0,
    });
    const [campaigns, setCampaigns] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setDataLoading(false);
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setDataLoading(true);
            const [ordersData, campaignsData] = await Promise.all([
                user ? orderService.getOrders().catch(() => []) : Promise.resolve([]),
                discountService.getCampaigns().catch(() => []),
            ]);

            // Calculate stats
            const activeOrders = ordersData.filter(order => 
                ['pending_payment', 'preparing', 'ready'].includes(order.status)
            ).length;

            const paidInvoices = ordersData.filter(order => 
                order.invoice && order.invoice.status === 'paid'
            ).length;

            setStats({
                activeOrders,
                paidInvoices,
                totalOrders: ordersData.length,
            });

            setCampaigns(campaignsData);
        } catch (err) {
            console.error('Error fetching home data:', err);
        } finally {
            setDataLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'مشاهده منو',
            description: 'دیدن منوی کامل کافه',
            icon: CoffeeCupIcon,
            path: '/menu',
            gradient: 'from-red-500 to-red-600',
        },
        {
            title: 'سفارشات من',
            description: 'پیگیری سفارشات شما',
            icon: OrdersListIcon,
            path: '/orders',
            gradient: 'from-red-500 to-red-600',
        },
        {
            title: 'پروفایل',
            description: 'تنظیمات و اطلاعات حساب',
            icon: UserIcon,
            path: '/profile',
            gradient: 'from-red-500 to-red-600',
        },
    ];

    const displayStats = [
        { label: 'سفارشات فعال', value: stats.activeOrders.toString(), icon: ShoppingCartIcon },
        { label: 'فاکتورهای پرداخت شده', value: stats.paidInvoices.toString(), icon: CheckIcon },
        { label: 'کل سفارشات', value: stats.totalOrders.toString(), icon: StarIcon },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="cafe-card rounded-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/10 to-red-600/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <CoffeeCupIcon className="w-8 h-8 text-red-500" />
                        <h1 className="text-3xl font-bold text-white">
                            خوش آمدید به دن کلاب
                        </h1>
                    </div>
                    <p className="text-gray-300">
                        {user ? `سلام ${user.name}، ` : ''}بهترین تجربه خرید از کافه را با ما تجربه کنید
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4 px-2">دسترسی سریع</h2>
                <div className="grid grid-cols-1 gap-4">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            to={action.path}
                            className="cafe-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg`}>
                                    <action.icon className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        {action.description}
                                    </p>
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {user && (
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4 px-2">آمار شما</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {displayStats.map((stat, index) => {
                            const IconComponent = stat.icon;
                            return (
                            <div
                                key={index}
                                className="cafe-card rounded-xl p-4 text-center"
                            >
                                <div className="flex justify-center mb-2 text-red-500">
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <div className="text-2xl font-bold text-red-400 mb-1">
                                    {dataLoading ? '...' : stat.value}
                                </div>
                                <div className="text-xs text-gray-300">{stat.label}</div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Campaigns / Special Offers */}
            {campaigns.length > 0 && (
                <div className="space-y-3">
                    {campaigns.map((campaign, index) => (
                        <div key={index} className="cafe-card rounded-xl p-5 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-red-500/20">
                            <div className="flex items-center gap-3">
                                <div className="text-red-500">
                                    <CelebrationIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">
                                        {campaign.name || 'پیشنهاد ویژه'}
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        {campaign.description || 'با هر خرید بالای ۵۰ هزار تومان، یک قهوه رایگان دریافت کنید!'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {campaigns.length === 0 && !dataLoading && (
                <div className="cafe-card rounded-xl p-5 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-red-500/20">
                    <div className="flex items-center gap-3">
                        <div className="text-red-500">
                            <CelebrationIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">پیشنهاد ویژه</h3>
                            <p className="text-sm text-gray-300">
                                با هر خرید بالای ۵۰ هزار تومان، یک قهوه رایگان دریافت کنید!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;

