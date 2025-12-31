import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../Components/Loading';
import ConfirmDialog from '../Components/ConfirmDialog';
import Input from '../Components/Input';
import { EditIcon } from '../Components/Icons';

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

    const menuItems = [
        {
            title: 'فاکتورها',
            description: 'مشاهده و مدیریت فاکتورهای شما',
            icon: InvoiceIcon,
            path: '/invoices',
            color: 'from-red-500 to-red-600',
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
                            className="bg-gray-800 text-white"
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
                            className="bg-gray-800 text-white"
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

            {/* Menu Items */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white px-2">منوی دسترسی</h3>
                {menuItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className="block cafe-card rounded-xl p-5 hover:scale-[1.02] transition-transform duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}>
                                    <IconComponent />
                                </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                    {item.description}
                                </p>
                            </div>
                            <div className="text-gray-400">
                                <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
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
                        <h4 className="font-semibold text-gray-800 mb-1">درباره اپلیکیشن</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
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

