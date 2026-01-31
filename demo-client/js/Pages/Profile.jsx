import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { authService, reservationService, menuService, orderService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import ConfirmDialog from '../Components/ConfirmDialog';
import Input from '../Components/Input';
import CountdownTimer from '../Components/CountdownTimer';
import { EditIcon, CalendarIcon, CashIcon, ShoppingCartIcon, CheckIcon, StarIcon, PlusIcon, MinusIcon, getCategoryIcon } from '../Components/Icons';

// Icon Components
const InvoiceIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const MenuIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

function Profile() {
    const { user, loading, logout, fetchUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', phone: '' });
    const [saving, setSaving] = useState(false);

    const handleLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
        navigate('/');
    };

    const handleEdit = () => {
        setEditData({
            name: user?.name || '',
            phone: user?.phone || '',
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({ name: '', phone: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await authService.updateProfile(editData);
            await fetchUser(); // Refresh user data
            setIsEditing(false);
            showToast('پروفایل با موفقیت به‌روزرسانی شد', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'خطا در به‌روزرسانی پروفایل. لطفا دوباره تلاش کنید.';
            showToast(errorMessage, 'error');
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const [stats, setStats] = useState({
        activeOrders: 0,
        paidInvoices: 0,
        totalOrders: 0,
    });
    const [dataLoading, setDataLoading] = useState(true);
    const [unpaidReservations, setUnpaidReservations] = useState([]);
    const [loadingUnpaid, setLoadingUnpaid] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [loadingActiveSession, setLoadingActiveSession] = useState(false);
    const [availableMenuItems, setAvailableMenuItems] = useState([]);
    const [loadingMenuItems, setLoadingMenuItems] = useState(false);
    const [cart, setCart] = useState({}); // { menuItemId: quantity }
    const [submittingOrder, setSubmittingOrder] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStats();
            fetchUnpaidReservations();
            fetchActiveSession();
        } else {
            setDataLoading(false);
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            setDataLoading(true);
            // Set default stats for booking system
            setStats({
                activeOrders: 0,
                paidInvoices: 0,
                totalOrders: 0,
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setDataLoading(false);
        }
    };

    const fetchUnpaidReservations = async () => {
        try {
            setLoadingUnpaid(true);
            const reservations = await reservationService.getUnpaidReservations();
            setUnpaidReservations(Array.isArray(reservations) ? reservations : []);
        } catch (err) {
            console.error('Error fetching unpaid reservations:', err);
            setUnpaidReservations([]);
        } finally {
            setLoadingUnpaid(false);
        }
    };

    const fetchActiveSession = async () => {
        try {
            setLoadingActiveSession(true);
            const session = await reservationService.getActiveSession();
            setActiveSession(session);
            
            // If active session exists, fetch menu items for that branch
            if (session && session.session && session.session.branch_id) {
                fetchMenuItems(session.session.branch_id);
            }
        } catch (err) {
            console.error('Error fetching active session:', err);
            setActiveSession(null);
        } finally {
            setLoadingActiveSession(false);
        }
    };

    const fetchMenuItems = async (branchId) => {
        try {
            setLoadingMenuItems(true);
            const data = await menuService.getMenuItems(branchId, { per_page: 100 });
            const items = Array.isArray(data) ? data : (data.data || []);
            setAvailableMenuItems(items);
        } catch (err) {
            console.error('Error fetching menu items:', err);
            setAvailableMenuItems([]);
        } finally {
            setLoadingMenuItems(false);
        }
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

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const handleAddToCart = (item) => {
        setCart(prev => {
            const currentQty = prev[item.id] || 0;
            return { ...prev, [item.id]: currentQty + 1 };
        });
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId] = newCart[itemId] - 1;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
    };

    const getCartItems = () => {
        return Object.entries(cart)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, quantity]) => {
                const item = availableMenuItems.find(mi => mi.id === parseInt(itemId));
                if (!item) return null;
                return {
                    ...item,
                    quantity,
                    total: item.price * quantity
                };
            })
            .filter(item => item !== null);
    };

    const getCartTotal = () => {
        return getCartItems().reduce((sum, item) => sum + item.total, 0);
    };

    const calculateMinimumCafeOrder = () => {
        if (!activeSession || !activeSession.session) return 0;
        const sessionPricePerPerson = parseFloat(activeSession.session.price);
        const discountPerPerson = 10000;
        const minimumPerPerson = Math.max(0, sessionPricePerPerson - discountPerPerson);
        return minimumPerPerson * activeSession.number_of_people;
    };

    const handleSubmitOrder = async () => {
        if (!activeSession) return;
        
        const cartItems = getCartItems();
        if (cartItems.length === 0) {
            showToast('لطفا حداقل یک آیتم به سبد خرید اضافه کنید', 'error');
            return;
        }

        setSubmittingOrder(true);
        try {
            const orderData = {
                reservation_id: activeSession.id,
                items: cartItems.map(item => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                })),
                notes: null,
            };

            await orderService.createMenuOrder(orderData);
            
            // Clear cart
            setCart({});
            
            // Refresh active session to show new orders
            await fetchActiveSession();
            
            showToast('سفارش شما با موفقیت ثبت شد!', 'success');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'خطا در ثبت سفارش. لطفا دوباره تلاش کنید.';
            showToast(errorMessage, 'error');
            console.error('Error submitting order:', err);
        } finally {
            setSubmittingOrder(false);
        }
    };

    const isReservationExpired = (reservation) => {
        if (!reservation.expires_at) return false;
        if (reservation.payment_status !== 'pending') return false;
        try {
            const now = new Date().getTime();
            const expiry = new Date(reservation.expires_at).getTime();
            if (isNaN(expiry)) return false;
            return expiry <= now;
        } catch (e) {
            console.error('Error checking expiration:', e);
            return false;
        }
    };

    const shouldShowCountdown = (reservation) => {
        return reservation.payment_status === 'pending' 
            && reservation.expires_at 
            && !isReservationExpired(reservation);
    };

    const displayStats = [
        { label: 'رزروهای فعال', value: stats.activeOrders.toString(), icon: ShoppingCartIcon },
        { label: 'پرداخت شده', value: stats.paidInvoices.toString(), icon: CheckIcon },
        { label: 'کل رزروها', value: stats.totalOrders.toString(), icon: StarIcon },
    ];

    const menuItems = [
        {
            title: 'سانس‌های من',
            description: 'مشاهده رزروهای شما و مجموع پرداختی‌ها',
            icon: CalendarIcon,
            path: '/my-sessions',
            color: 'from-red-500 to-red-600',
        },
        {
            title: 'فاکتورها',
            description: 'مشاهده و مدیریت فاکتورهای شما',
            icon: InvoiceIcon,
            path: '/invoices',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'باشگاه مشتریان دنکس',
            description: 'تاریخچه سکه‌ها و امتیازات شما',
            icon: () => (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
            ),
            path: '/coin-history',
            color: 'from-yellow-500 to-yellow-600',
        },
        {
            title: 'کدهای تخفیف',
            description: 'خرید و مدیریت کدهای تخفیف با سکه',
            icon: () => (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
            path: '/discount-codes',
            color: 'from-green-500 to-emerald-600',
        },
        {
            title: 'بلیط‌های رایگان',
            description: 'خرید و استفاده از بلیط رایگان سانس',
            icon: () => (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
            path: '/free-tickets',
            color: 'from-purple-500 to-purple-600',
        },
    ];

    // Add admin menu if user is admin
    if (user && user.role === 'admin') {
        menuItems.push({
            title: 'مدیریت منو',
            description: 'افزودن، ویرایش و حذف آیتم‌های منو',
            icon: MenuIcon,
            path: '/admin/menu',
            color: 'from-purple-500 to-pink-500',
        });
        menuItems.push({
            title: 'مدیریت سفارش‌های کاربران',
            description: 'دسترسی به مدیریت سفارشات',
            icon: SettingsIcon,
            path: '/admin',
            color: 'from-blue-500 to-cyan-500',
        });
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">
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

            {/* Profile Header */}
            <div className="cafe-card rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">اطلاعات پروفایل</h3>
                    {!isEditing && (
                        <button
                            onClick={handleEdit}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-red-400 transition-colors"
                        >
                            <EditIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                            <UserIcon />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
                        <p className="text-gray-300 text-sm mb-1">{user.email}</p>
                        {user.phone && (
                            <p className="text-gray-400 text-sm mb-2">{user.phone}</p>
                        )}
                        {user.role && (
                            <span className="inline-block px-3 py-1 bg-gray-700 text-red-400 rounded-full text-xs font-semibold">
                                {user.role === 'admin' ? 'مدیر' : 'مشتری'}
                            </span>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input
                            label="نام"
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="شماره تلفن"
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                setEditData({ ...editData, phone: value });
                            }}
                            placeholder="09123456789"
                        />
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 cafe-button py-2 rounded-lg disabled:opacity-50"
                            >
                                {saving ? 'در حال ذخیره...' : 'ذخیره'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                            >
                                لغو
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Unpaid Reservations Section */}
            {loadingUnpaid ? (
                <div className="cafe-card rounded-2xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                </div>
            ) : unpaidReservations.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-semibold text-white">رزروهای در انتظار پرداخت</h3>
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                            {unpaidReservations.length} مورد
                        </span>
                    </div>
                    <div className="space-y-3">
                        {unpaidReservations.map((reservation, index) => {
                            const expired = isReservationExpired(reservation);
                            return (
                                <motion.div
                                    key={reservation.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`relative overflow-hidden cafe-card rounded-2xl p-5 border-2 ${
                                        expired 
                                            ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 via-transparent to-red-600/10' 
                                            : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/10'
                                    } group hover:scale-[1.02] transition-transform duration-200`}
                                >
                                    {/* Animated background glow */}
                                    {!expired && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-orange-500/5 animate-pulse pointer-events-none"></div>
                                    )}
                                    
                                    <div className="relative flex items-start gap-4">
                                        {/* Icon with modern design */}
                                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                            expired
                                                ? 'bg-gradient-to-br from-red-600 to-red-700'
                                                : 'bg-gradient-to-br from-yellow-500 to-orange-600'
                                        }`}>
                                            <CalendarIcon className="w-8 h-8" />
                                            {/* Pulse effect for pending */}
                                            {!expired && (
                                                <div className="absolute inset-0 rounded-2xl bg-yellow-400/30 animate-ping"></div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {reservation.session && (
                                                <>
                                                    {reservation.session.branch && (
                                                        <h4 className="text-lg font-bold text-white mb-2 truncate">
                                                            {reservation.session.branch.name}
                                                        </h4>
                                                    )}
                                                    
                                                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                                                        <div className="flex items-center gap-2 text-white/90">
                                                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="break-words">
                                                                {formatDate(reservation.session.date)} - {formatTime(reservation.session.start_time)}
                                                            </p>
                                                        </div>
                                                        
                                                        {reservation.session.hall && (
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                                <p>سالن: {reservation.session.hall.name}</p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            <p>تعداد نفرات: <span className="font-semibold text-white">{reservation.number_of_people}</span></p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            
                                            {/* Payment Status and Amount */}
                                            <div className="flex flex-col gap-3 pt-4 border-t border-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {expired ? (
                                                        <span className="px-3.5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-red-700 text-white whitespace-nowrap shadow-lg">
                                                            منقضی شده
                                                        </span>
                                                    ) : (
                                                        <span className="px-3.5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white whitespace-nowrap shadow-lg">
                                                            در انتظار پرداخت
                                                        </span>
                                                    )}
                                                    
                                                    {shouldShowCountdown(reservation) && (
                                                        <CountdownTimer 
                                                            expiresAt={reservation.expires_at}
                                                            onExpire={() => {
                                                                showToast('زمان پرداخت بلیط شما به پایان رسید. لطفا رزرو جدیدی انجام دهید.', 'error');
                                                                fetchUnpaidReservations();
                                                            }}
                                                        />
                                                    )}
                                                    
                                                    {reservation.payment_transaction && (
                                                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-600/10 rounded-xl px-4 py-2 border border-yellow-500/20">
                                                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-base font-bold text-yellow-300 whitespace-nowrap">
                                                                {formatPrice(reservation.payment_transaction.amount)}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-normal">تومان</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {!expired && (
                                                    <Link
                                                        to="/my-sessions"
                                                        className="block w-full px-5 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl text-center transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
                                                    >
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            پرداخت
                                                        </span>
                                                    </Link>
                                                )}
                                                
                                                {expired && (
                                                    <div className="w-full px-5 py-3.5 rounded-xl font-bold bg-gradient-to-r from-red-600/20 to-red-700/20 border-2 border-red-500/30 text-red-300 text-center">
                                                        زمان پرداخت این رزرو به پایان رسیده است
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Active Session Section */}
            {loadingActiveSession ? (
                <div className="cafe-card rounded-2xl p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    </div>
                </div>
            ) : activeSession && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-semibold text-white">سانس فعال شما</h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                            در حال بازی
                        </span>
                    </div>
                    
                    {/* Active Session Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="cafe-card rounded-2xl p-5 border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 via-transparent to-green-600/10"
                    >
                        {activeSession.session && (
                            <>
                                {activeSession.session.branch && (
                                    <h4 className="text-lg font-bold text-white mb-2">
                                        {activeSession.session.branch.name}
                                    </h4>
                                )}
                                
                                <div className="space-y-2 text-sm text-gray-300 mb-4">
                                    <div className="flex items-center gap-2 text-white/90">
                                        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p>
                                            {formatDate(activeSession.session.date)} - {formatTime(activeSession.session.start_time)}
                                        </p>
                                    </div>
                                    
                                    {activeSession.session.hall && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <p>سالن: {activeSession.session.hall.name}</p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p>تعداد نفرات: <span className="font-semibold text-white">{activeSession.number_of_people}</span></p>
                                    </div>
                                </div>

                                {/* Current Orders */}
                                {activeSession.orders && activeSession.orders.length > 0 && (
                                    <div className="mb-4 pt-4 border-t border-green-500/20">
                                        <h5 className="text-sm font-semibold text-white mb-2">سفارش‌های فعلی:</h5>
                                        <div className="space-y-1">
                                            {activeSession.orders.map((order) => (
                                                order.order_items && order.order_items.map((orderItem, idx) => (
                                                    <div key={idx} className="text-xs text-gray-300">
                                                        {orderItem.menu_item?.name} × {orderItem.quantity}
                                                    </div>
                                                ))
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Minimum Cafe Order Info */}
                                <div className="mb-4 pt-4 border-t border-green-500/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-300">حداقل سفارش کافه:</span>
                                        <span className="text-sm font-bold text-white">
                                            {formatPrice(calculateMinimumCafeOrder())} تومان
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Menu Ordering Section */}
                    <div className="cafe-card rounded-2xl p-5">
                        <h4 className="text-lg font-semibold text-white mb-4">سفارش منو</h4>
                        
                        {loadingMenuItems ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                            </div>
                        ) : availableMenuItems.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">منویی برای این شعبه یافت نشد</p>
                        ) : (
                            <>
                                {/* Menu Items Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
                                    {availableMenuItems.map((item) => {
                                        const CategoryIcon = getCategoryIcon(item.category?.name || '');
                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <CategoryIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="text-sm font-semibold text-white truncate">{item.name}</h5>
                                                        <p className="text-xs text-gray-400">{formatPrice(item.price)} تومان</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {cart[item.id] > 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => handleRemoveFromCart(item.id)}
                                                                className="w-7 h-7 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                            >
                                                                <MinusIcon className="w-4 h-4" />
                                                            </button>
                                                            <span className="text-white font-bold text-sm min-w-[20px] text-center">
                                                                {cart[item.id]?.toLocaleString('fa-IR') || 0}
                                                            </span>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleAddToCart(item)}
                                                        className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Cart Summary */}
                                {getCartItems().length > 0 && (
                                    <div className="mb-4 pt-4 border-t border-gray-700">
                                        <h5 className="text-sm font-semibold text-white mb-2">سبد خرید:</h5>
                                        <div className="space-y-2 mb-3">
                                            {getCartItems().map((item) => {
                                                const CategoryIcon = getCategoryIcon(item.category?.name || '');
                                                return (
                                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <CategoryIcon className="w-4 h-4 text-red-400" />
                                                            <span className="text-gray-300">{item.name}</span>
                                                            <span className="text-gray-500">× {item.quantity}</span>
                                                        </div>
                                                        <span className="text-white font-semibold">{formatPrice(item.total)} تومان</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                                            <span className="text-sm text-gray-300">جمع کل:</span>
                                            <span className="text-lg font-bold text-white">
                                                {formatPrice(getCartTotal())} تومان
                                            </span>
                                        </div>
                                        
                                        {/* Minimum Order Check */}
                                        {getCartTotal() < calculateMinimumCafeOrder() && (
                                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                <p className="text-xs text-blue-400">
                                                    سفارش شما کمتر از حداقل سفارش کافه است. برای سانس فعال، نیاز به پرداخت اضافی نیست.
                                                </p>
                                            </div>
                                        )}
                                        
                                        {getCartTotal() >= calculateMinimumCafeOrder() && (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                <p className="text-xs text-green-400">
                                                    سفارش شما از حداقل سفارش کافه بیشتر است. نیاز به پرداخت اضافی نیست.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={submittingOrder || getCartItems().length === 0}
                                    className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    {submittingOrder ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            در حال ثبت...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCartIcon className="w-5 h-5" />
                                            ثبت سفارش
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Menu Items */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white px-2">منوی دسترسی</h3>
                {menuItems.map((item, index) => {
                    const IconComponent = item.icon;
                    const Component = item.onClick ? 'button' : Link;
                    const props = item.onClick 
                        ? { onClick: item.onClick, className: "block cafe-card rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200 w-full text-right" }
                        : { to: item.path, className: "block cafe-card rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200" };
                    
                    return (
                        <Component
                            key={index}
                            {...props}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                                    <IconComponent />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-white mb-1">
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-gray-300">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="text-gray-400">
                                    <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Component>
                    );
                })}
            </div>

            {/* Logout Button */}
            <div className="cafe-card rounded-xl p-5">
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full px-6 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md shadow-red-500/20"
                >
                    خروج از حساب کاربری
                </button>
            </div>

            {/* Additional Info */}
            <div className="cafe-card rounded-xl p-5 mt-6">
                <div className="flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">
                        <InfoIcon />
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">درباره اپلیکیشن</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            از طریق این بخش می‌توانید به تمامی بخش‌های مدیریتی و اطلاعاتی دسترسی داشته باشید.
                        </p>
                    </div>
                </div>
            </div>

            {/* Logout Confirm Dialog */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                title="خروج از حساب کاربری"
                message="آیا مطمئن هستید که می‌خواهید خارج شوید؟"
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
                confirmText="خروج"
                cancelText="لغو"
                type="warning"
            />
        </div>
    );
}

export default Profile;

