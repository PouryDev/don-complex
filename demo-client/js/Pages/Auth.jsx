import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    
    // Determine initial tab based on route
    const [activeTab, setActiveTab] = useState(
        location.pathname === '/register' ? 'register' : 'login'
    );

    // Update tab when route changes
    useEffect(() => {
        if (location.pathname === '/register') {
            setActiveTab('register');
        } else if (location.pathname === '/login') {
            setActiveTab('login');
        }
    }, [location.pathname]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [loginData, setLoginData] = useState({
        phone: '',
        password: '',
    });

    const [registerData, setRegisterData] = useState({
        name: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(loginData.phone, loginData.password);
            // Redirect to the page user was trying to access, or home
            const from = location.state?.from || '/';
            navigate(from);
        } catch (err) {
            setError(err.response?.data?.message || 'شماره تلفن یا رمز عبور اشتباه است');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        if (registerData.password !== registerData.password_confirmation) {
            setError('رمز عبور و تکرار آن مطابقت ندارند');
            return;
        }

        if (registerData.password.length < 8) {
            setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
            return;
        }

        setLoading(true);

        try {
            await register(
                registerData.name,
                registerData.phone,
                registerData.password,
                registerData.password_confirmation
            );
            navigate('/');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                               (err.response?.data?.errors ? 
                                Object.values(err.response.data.errors).flat().join(', ') : 
                                'خطا در ثبت نام. لطفا دوباره تلاش کنید');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center py-8">
            <div className="w-full max-w-md">
                <div className="cafe-card rounded-2xl p-8">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-red-900/50 relative">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('login');
                                setError(null);
                                // Preserve state.from when switching tabs
                                navigate('/login', { 
                                    replace: true,
                                    state: location.state || {}
                                });
                            }}
                            className={`flex-1 py-3 font-semibold transition-all duration-300 relative z-10 ${
                                activeTab === 'login'
                                    ? 'text-red-500'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ورود
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('register');
                                setError(null);
                                // Preserve state.from when switching tabs
                                navigate('/register', { 
                                    replace: true,
                                    state: location.state || {}
                                });
                            }}
                            className={`flex-1 py-3 font-semibold transition-all duration-300 relative z-10 ${
                                activeTab === 'register'
                                    ? 'text-red-500'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ثبت نام
                        </button>
                        {/* Animated Indicator */}
                        <motion.div
                            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-red-600 to-red-700 z-0"
                            initial={false}
                            animate={{
                                right: activeTab === 'login' ? '0%' : '50%',
                                width: '50%',
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                        />
                    </div>

                    {/* Header */}
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-center mb-6"
                    >
                        <motion.h1
                            key={`title-${activeTab}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: 0.05 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            {activeTab === 'login' ? 'ورود به حساب کاربری' : 'ثبت نام'}
                        </motion.h1>
                        <motion.p
                            key={`desc-${activeTab}`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                            className="text-gray-600 text-sm"
                        >
                            {activeTab === 'login' ? 'خوش آمدید به دن کلاب' : 'حساب کاربری جدید ایجاد کنید'}
                        </motion.p>
                    </motion.div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Forms Container */}
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {activeTab === 'login' && (
                                <motion.form
                                    key="login"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleLogin}
                                    className="space-y-4"
                                >
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    شماره تلفن
                                </label>
                                <input
                                    type="tel"
                                    value={loginData.phone}
                                    onChange={(e) => {
                                        // Only allow digits and limit to 11 characters
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        setLoginData({ ...loginData, phone: value });
                                    }}
                                    required
                                    pattern="09\d{9}"
                                    maxLength={11}
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="09123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رمز عبور
                                </label>
                                <input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full cafe-button py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'در حال ورود...' : 'ورود'}
                            </button>
                                </motion.form>
                            )}
                            
                            {activeTab === 'register' && (
                                <motion.form
                                    key="register"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onSubmit={handleRegister}
                                    className="space-y-4"
                                >
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    نام
                                </label>
                                <input
                                    type="text"
                                    value={registerData.name}
                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="نام و نام خانوادگی"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    شماره تلفن
                                </label>
                                <input
                                    type="tel"
                                    value={registerData.phone}
                                    onChange={(e) => {
                                        // Only allow digits and limit to 11 characters
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        setRegisterData({ ...registerData, phone: value });
                                    }}
                                    required
                                    pattern="09\d{9}"
                                    maxLength={11}
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="09123456789"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    رمز عبور
                                </label>
                                <input
                                    type="password"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="حداقل ۸ کاراکتر"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    تکرار رمز عبور
                                </label>
                                <input
                                    type="password"
                                    value={registerData.password_confirmation}
                                    onChange={(e) => setRegisterData({ ...registerData, password_confirmation: e.target.value })}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 border border-red-900/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-gray-800 text-white placeholder-gray-400"
                                    placeholder="تکرار رمز عبور"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full cafe-button py-3 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
                            </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Auth;

