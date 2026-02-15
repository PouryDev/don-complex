import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../Components/Input';
import Loading from '../../Components/Loading';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(formData.phone, formData.password);
            const from = location.state?.from || '/supervisor/dashboard';
            navigate(from);
            showToast('با موفقیت وارد شدید', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'خطا در ورود. لطفا دوباره تلاش کنید.');
            showToast('خطا در ورود', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="cafe-card rounded-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">ورود سوپروایزر</h1>
                        <p className="text-gray-400">لطفا اطلاعات خود را وارد کنید</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="شماره تلفن"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="09123456789"
                        />

                        <Input
                            label="رمز عبور"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="••••••••"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full cafe-button py-3 rounded-lg font-semibold disabled:opacity-50"
                        >
                            {loading ? 'در حال ورود...' : 'ورود'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;


