import React, { useRef, useEffect, useState, useLayoutEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Cart from './Cart';
import { CalendarIcon, MySessionsIcon, NewsIcon } from './Icons';

// SVG Icon Components
const HomeIcon = ({ active }) => (
    <svg
        className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
    </svg>
);

const MenuIcon = ({ active }) => (
    <svg
        className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
    </svg>
);

const OrdersIcon = ({ active }) => (
    <svg
        className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
    </svg>
);

const ProfileIcon = ({ active }) => (
    <svg
        className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
    </svg>
);

const GameIcon = ({ active }) => (
    <svg
        className={`w-6 h-6 transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
    </svg>
);

const navItems = [
    {
        path: '/',
        label: 'خانه',
        icon: HomeIcon,
    },
    {
        path: '/menu',
        label: 'منو',
        icon: MenuIcon,
    },
    {
        path: '/book',
        label: 'رزرو وقت',
        icon: CalendarIcon,
    },
    {
        path: 'game',
        label: 'پخش نقش',
        icon: GameIcon,
        isGame: true,
    },
    {
        path: '/news',
        label: 'اخبار',
        icon: NewsIcon,
    },
    {
        path: '/profile',
        label: 'پروفایل',
        icon: ProfileIcon,
    },
];

function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const navRef = useRef(null);
    const itemRefs = useRef([]);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    const isActive = React.useCallback((path, isGame) => {
        // For game, check if we're on the role-distribution route
        if (isGame) {
            return location.pathname === '/role-distribution';
        }
        
        // Get the actual pathname to check - use state.from if we're on login/register
        let pathnameToCheck = location.pathname;
        if ((location.pathname === '/login' || location.pathname === '/register') && location.state?.from) {
            pathnameToCheck = location.state.from;
        }
        
        // Exact match for home - only when pathname is exactly '/'
        if (path === '/') {
            return pathnameToCheck === '/' || pathnameToCheck === '';
        }
        
        // For profile, check profile and sub-pages (invoices, admin)
        if (path === '/profile') {
            return pathnameToCheck === '/profile' || 
                   pathnameToCheck === '/invoices' || 
                   pathnameToCheck === '/admin' ||
                   pathnameToCheck.startsWith('/profile/') ||
                   pathnameToCheck.startsWith('/invoices/') ||
                   pathnameToCheck.startsWith('/admin/');
        }
        
        // For orders, check exact match and sub-pages
        if (path === '/orders') {
            return pathnameToCheck === '/orders' || pathnameToCheck.startsWith('/orders/');
        }
        
        // For menu, check exact match
        if (path === '/menu') {
            return pathnameToCheck === '/menu' || pathnameToCheck.startsWith('/menu/');
        }
        
        // For book, check book and sub-pages
        if (path === '/book') {
            return pathnameToCheck === '/book' || pathnameToCheck.startsWith('/book/');
        }
        
        // For my-sessions, check exact match
        if (path === '/my-sessions') {
            return pathnameToCheck === '/my-sessions' || pathnameToCheck.startsWith('/my-sessions/');
        }
        
        // For news, check exact match
        if (path === '/news') {
            return pathnameToCheck === '/news' || pathnameToCheck.startsWith('/news/');
        }
        
        // For other paths, check exact match or sub-paths
        return pathnameToCheck === path || pathnameToCheck.startsWith(path + '/');
    }, [location.pathname, location.state]);

    // Calculate active index using useMemo - always return a valid index
    const activeIndex = useMemo(() => {
        const currentIndex = navItems.findIndex(item => isActive(item.path, item.isGame));
        // Always return a valid index (0 if no match found)
        return currentIndex !== -1 ? currentIndex : 0;
    }, [location.pathname, location.state, isActive]);

    // Update indicator position when active index changes
    useLayoutEffect(() => {
        const updateIndicatorPosition = () => {
            // Ensure activeIndex is valid
            const validIndex = activeIndex >= 0 && activeIndex < navItems.length ? activeIndex : 0;
            
            // Don't show overlay for game button (it's not a tab)
            const activeItem = navItems[validIndex];
            if (activeItem?.isGame) {
                setIndicatorStyle({
                    left: '0px',
                    width: '0px',
                });
                return;
            }
            
            if (itemRefs.current[validIndex] && navRef.current) {
                const activeItemElement = itemRefs.current[validIndex];
                const navContainer = navRef.current;
                
                const navRect = navContainer.getBoundingClientRect();
                const itemRect = activeItemElement.getBoundingClientRect();
                
                // Calculate position relative to the nav container
                // Make overlay smaller with margins to center it around the content
                const horizontalMargin = 8; // 8px margin on each side
                const left = itemRect.left - navRect.left + horizontalMargin;
                const width = itemRect.width - (horizontalMargin * 2);
                
                setIndicatorStyle({
                    left: `${left}px`,
                    width: `${width}px`,
                });
            }
        };

        // Use multiple strategies to ensure DOM is ready
        const timeoutId1 = setTimeout(updateIndicatorPosition, 0);
        const timeoutId2 = setTimeout(updateIndicatorPosition, 100);
        const rafId = requestAnimationFrame(() => {
            setTimeout(updateIndicatorPosition, 0);
        });
        
        // Update on window resize
        window.addEventListener('resize', updateIndicatorPosition);
        return () => {
            clearTimeout(timeoutId1);
            clearTimeout(timeoutId2);
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', updateIndicatorPosition);
        };
    }, [activeIndex, location.pathname]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black pb-36 md:pb-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-red-900/50">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="relative flex items-center justify-between">
                        {/* User Info - Right side (first in RTL) */}
                        <div className="flex items-center gap-2">
                            {user && (
                                <span className="text-sm text-gray-300 hidden sm:inline">
                                    {user.name}
                                </span>
                            )}
                        </div>
                        {/* Logo - Centered (absolute positioned) */}
                        <div className="absolute right-1/2 transform translate-x-1/2 flex items-center gap-2">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                            <Link to="/" className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                دن کلاب
                            </Link>
                        </div>
                        {/* Back Button - Left side (last in RTL) */}
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="group relative p-2.5 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-red-900/50 hover:border-red-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                                aria-label="بازگشت"
                            >
                                <svg 
                                    className="w-6 h-6 text-red-400 group-hover:text-red-300 transition-colors duration-300" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        d="M15 19l-7-7 7-7" 
                                    />
                                </svg>
                                {/* Subtle glow effect on hover */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 transition-all duration-300 pointer-events-none"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-4 pb-32 md:pb-12 min-h-[calc(100vh-140px)]">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
                <div className="max-w-4xl mx-auto px-4 pb-2">
                    <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-900/30 overflow-hidden">
                        <div 
                            ref={navRef}
                            className="relative flex items-center justify-around h-20 px-2"
                        >
                            {/* Animated Active Overlay */}
                            <motion.div
                                className="absolute bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl pointer-events-none z-0"
                                initial={false}
                                animate={{
                                    left: indicatorStyle.left || '0px',
                                    width: indicatorStyle.width || '0px',
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                style={{
                                    top: '4px',
                                    bottom: '4px',
                                    height: 'calc(100% - 8px)',
                                    opacity: indicatorStyle.left && indicatorStyle.width ? 1 : 0,
                                }}
                            />
                            {navItems.map((item, index) => {
                                const active = isActive(item.path, item.isGame);
                                const IconComponent = item.icon;
                                
                                if (item.isGame) {
                                    return (
                                        <div
                                            key={item.path}
                                            ref={(el) => (itemRefs.current[index] = el)}
                                            className="relative flex-1 mx-1 h-full"
                                        >
                                            {/* Curved background container - always visible */}
                                            <div className={`
                                                absolute inset-0 rounded-t-3xl transition-all duration-300
                                                ${active
                                                    ? 'bg-gradient-to-b from-purple-900/95 via-purple-800/85 to-transparent shadow-inner'
                                                    : 'bg-gradient-to-b from-purple-900/90 via-purple-800/80 to-transparent group-hover:from-purple-900/95 group-hover:via-purple-800/85 shadow-sm'
                                                }
                                            `} />
                                            
                                            <button
                                                onClick={() => navigate('/role-distribution')}
                                                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group z-10 ${
                                                    active
                                                        ? 'text-purple-500'
                                                        : 'text-gray-400 hover:text-purple-400'
                                                }`}
                                            >
                                                {/* Icon container with button-like style */}
                                                <div className={`relative z-10 mb-1 p-2.5 rounded-xl transition-all duration-300 border-2 text-white ${
                                                    active
                                                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg shadow-purple-600/30 transform scale-110 border-purple-700'
                                                        : 'bg-gradient-to-br from-purple-700 to-purple-800 border-purple-800 group-hover:border-purple-700 group-hover:from-purple-600 group-hover:to-purple-700 group-hover:scale-105 shadow-md'
                                                }`}>
                                                    <IconComponent active={active} />
                                                </div>
                                                
                                                {/* Label */}
                                                <span className={`relative z-10 text-xs font-semibold transition-all duration-300 ${
                                                    active
                                                        ? 'text-purple-500 scale-105'
                                                        : 'text-gray-400 group-hover:text-purple-400'
                                                }`}>
                                                    {item.label}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <Link
                                        key={item.path}
                                        ref={(el) => (itemRefs.current[index] = el)}
                                        to={item.path}
                                        className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 group z-10 ${
                                            active
                                                ? 'text-red-500'
                                                : 'text-gray-400 hover:text-red-400'
                                        }`}
                                    >
                                        {/* Icon container */}
                                        <div className={`relative z-10 mb-1 p-2 rounded-xl transition-all duration-300 ${
                                            active
                                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 transform scale-110'
                                                : 'group-hover:bg-gray-800 group-hover:scale-105'
                                        }`}>
                                            <IconComponent active={active} />
                                        </div>
                                        
                                        {/* Label */}
                                        <span className={`relative z-10 text-xs font-semibold transition-all duration-300 ${
                                            active
                                                ? 'text-red-500 scale-105'
                                                : 'text-gray-400 group-hover:text-red-400'
                                        }`}>
                                            {item.label}
                                        </span>
                                        
                                        {/* Active dot indicator */}
                                        {active && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Game Modal/Page - handled by route */}
        </div>
    );
}

export default Layout;

