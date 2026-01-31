import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const DashboardIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const SessionsIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const GameResultsIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

const SessionManagementIcon = ({ active }) => (
    <svg className={`w-6 h-6 ${active ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
);

const navItems = [
    { path: '/supervisor/dashboard', label: 'داشبورد', icon: DashboardIcon },
    { path: '/supervisor/sessions', label: 'سانس‌ها', icon: SessionsIcon },
    { path: '/supervisor/session-management', label: 'مدیریت سانس‌ها', icon: SessionManagementIcon },
    { path: '/supervisor/game-results', label: 'نتایج بازی', icon: GameResultsIcon },
];

function SupervisorLayout() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/supervisor/login');
            showToast('با موفقیت خارج شدید', 'success');
        } catch (error) {
            showToast('خطا در خروج از سیستم', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-l border-red-900/50 z-40">
                <div className="flex flex-col h-full">
                    {/* Logo/Header */}
                    <div className="p-6 border-b border-red-900/50">
                        <h1 className="text-2xl font-bold text-white">پنل سوپروایزر</h1>
                        {user?.branch && (
                            <p className="text-sm text-gray-400 mt-1">{user.branch.name}</p>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path || 
                                (item.path !== '/supervisor/dashboard' && location.pathname.startsWith(item.path));
                            const Icon = item.icon;
                            
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    <Icon active={isActive} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="p-4 border-t border-red-900/50">
                        <div className="mb-3">
                            <p className="text-sm text-gray-400">سوپروایزر</p>
                            <p className="text-white font-medium">{user?.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                            خروج
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mr-64 min-h-screen">
                <div className="p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default SupervisorLayout;

