import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { feedService } from '../services/api';
import Loading from '../Components/Loading';
import Input from '../Components/Input';
import { WarningIcon, GridIcon } from '../Components/Icons';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

function FeedDetail() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [hasSubmittedForm, setHasSubmittedForm] = useState(false);
    const [existingFormResponse, setExistingFormResponse] = useState(null);
    
    // Quiz state
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(null);
    const [scoreDisplay, setScoreDisplay] = useState(0);
    const [showScoreAnimation, setShowScoreAnimation] = useState(false);
    const [hasSubmittedQuiz, setHasSubmittedQuiz] = useState(false);
    const [existingQuizResponse, setExistingQuizResponse] = useState(null);

    useEffect(() => {
        fetchItem();
    }, [type, id]);

    const fetchItem = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const foundItem = await feedService.getFeedItem(type, id);
            
            if (!foundItem) {
                setError('آیتم مورد نظر یافت نشد.');
                return;
            }
            
            setItem(foundItem);
            
            // Initialize form data
            if (foundItem.type === 'form' && foundItem.fields) {
                const initialData = {};
                foundItem.fields.forEach((field) => {
                    initialData[field.name] = '';
                });
                setFormData(initialData);
            }
            
            // Initialize quiz answers
            if (foundItem.type === 'quiz' && foundItem.questions) {
                const initialAnswers = {};
                foundItem.questions.forEach((question, index) => {
                    initialAnswers[index] = null;
                });
                setQuizAnswers(initialAnswers);
            }
            
            // Check for existing responses if user is logged in
            if (user) {
                if (foundItem.type === 'quiz') {
                    try {
                        const existingResponse = await feedService.checkQuizResponse(foundItem.id);
                        if (existingResponse) {
                            setHasSubmittedQuiz(true);
                            setExistingQuizResponse(existingResponse);
                            setQuizSubmitted(true);
                            setQuizScore(existingResponse.score);
                            setScoreDisplay(existingResponse.score);
                            setShowScoreAnimation(true);
                            // Set previous answers
                            if (existingResponse.answers) {
                                setQuizAnswers(existingResponse.answers);
                            }
                        }
                    } catch (err) {
                        console.error('Error checking quiz response:', err);
                    }
                } else if (foundItem.type === 'form') {
                    try {
                        const existingResponse = await feedService.checkFormResponse(foundItem.id);
                        if (existingResponse) {
                            setHasSubmittedForm(true);
                            setExistingFormResponse(existingResponse);
                            setFormSubmitted(true);
                            // Set previous form data
                            if (existingResponse.data) {
                                setFormData(existingResponse.data);
                            }
                        }
                    } catch (err) {
                        console.error('Error checking form response:', err);
                    }
                }
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('آیتم مورد نظر یافت نشد.');
            } else {
                setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
            }
            console.error('Error fetching feed item:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (fieldName, value) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Check if user is logged in
        if (!user) {
            showToast('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error');
            return;
        }
        
        // Check if already submitted
        if (hasSubmittedForm) {
            showToast('شما قبلاً این فرم را پر کرده‌اید', 'error');
            return;
        }
        
        // Validate required fields
        const requiredFields = item.fields?.filter(f => f.required) || [];
        const missingFields = requiredFields.filter(f => !formData[f.name] || formData[f.name].trim() === '');
        
        if (missingFields.length > 0) {
            showToast(`لطفاً فیلدهای اجباری را پر کنید: ${missingFields.map(f => f.label).join(', ')}`, 'error');
            return;
        }
        
        setFormSubmitting(true);
        
        try {
            await feedService.submitFormResponse(item.id, formData);
            setFormSubmitted(true);
            setHasSubmittedForm(true);
            showToast('فرم با موفقیت ارسال شد!', 'success');
            
            // Auto redirect after 2 seconds
            setTimeout(() => {
                navigate('/news');
            }, 2000);
        } catch (err) {
            if (err.response?.status === 409) {
                showToast('شما قبلاً این فرم را پر کرده‌اید', 'error');
                setHasSubmittedForm(true);
                setFormSubmitted(true);
            } else {
                showToast(err.response?.data?.message || 'خطا در ارسال فرم. لطفاً دوباره تلاش کنید.', 'error');
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleQuizAnswer = (questionIndex, answerIndex) => {
        if (quizSubmitted) return;
        setQuizAnswers((prev) => ({
            ...prev,
            [questionIndex]: answerIndex,
        }));
    };

    const handleQuizSubmit = async () => {
        if (!item || !item.questions) return;
        
        // Check if user is logged in
        if (!user) {
            showToast('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error');
            return;
        }
        
        // Check if already submitted
        if (hasSubmittedQuiz) {
            showToast('شما قبلاً به این کوییز پاسخ داده‌اید', 'error');
            return;
        }
        
        let correct = 0;
        item.questions.forEach((question, index) => {
            if (quizAnswers[index] === question.correct_answer) {
                correct++;
            }
        });
        
        const score = Math.round((correct / item.questions.length) * 100);
        
        try {
            // Submit to API
            await feedService.submitQuizResponse(item.id, quizAnswers, score);
            
            setQuizSubmitted(true);
            setHasSubmittedQuiz(true);
            
            // Animate score counting
            setShowScoreAnimation(true);
            let currentScore = 0;
            const increment = score / 30; // 30 steps for smooth animation
            const timer = setInterval(() => {
                currentScore += increment;
                if (currentScore >= score) {
                    currentScore = score;
                    clearInterval(timer);
                }
                setScoreDisplay(Math.round(currentScore));
            }, 30);
            
            setQuizScore(score);
            showToast(`امتیاز شما: ${score}%`, 'success');
        } catch (err) {
            if (err.response?.status === 409) {
                showToast('شما قبلاً به این کوییز پاسخ داده‌اید', 'error');
                setHasSubmittedQuiz(true);
                // Try to get existing response
                try {
                    const existingResponse = await feedService.checkQuizResponse(item.id);
                    if (existingResponse) {
                        setExistingQuizResponse(existingResponse);
                        setQuizSubmitted(true);
                        setQuizScore(existingResponse.score);
                        setScoreDisplay(existingResponse.score);
                        setShowScoreAnimation(true);
                    }
                } catch (checkErr) {
                    console.error('Error checking quiz response:', checkErr);
                }
            } else {
                showToast(err.response?.data?.message || 'خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.', 'error');
            }
        }
    };

    const renderField = (field) => {
        const commonProps = {
            label: field.label,
            value: formData[field.name] || '',
            onChange: (e) => handleFormChange(field.name, e.target.value),
            required: field.required,
        };

        switch (field.type) {
            case 'textarea':
                return <Input key={field.name} {...commonProps} textarea rows={4} />;
            
            case 'select':
                return (
                    <div key={field.name} className="mb-5">
                        <label className="block text-sm font-bold text-white mb-3">
                            {field.label}
                            {field.required && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        <select
                            {...commonProps}
                            className="w-full px-4 py-3.5 border-2 rounded-xl bg-gray-800 text-white border-red-500/20 hover:border-red-500/40 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                        >
                            <option value="">انتخاب کنید...</option>
                            {field.options?.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            
            default:
                return <Input key={field.name} {...commonProps} type={field.type || 'text'} />;
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error || !item) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error || 'آیتم مورد نظر یافت نشد.'}</p>
                <button
                    onClick={() => navigate('/news')}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    بازگشت به هاب
                </button>
            </div>
        );
    }

    const getTypeGradient = (type) => {
        const gradients = {
            news: 'from-blue-500 via-cyan-500 to-blue-600',
            form: 'from-green-500 via-emerald-500 to-green-600',
            quiz: 'from-purple-500 via-pink-500 to-purple-600',
        };
        return gradients[type] || 'from-gray-500 to-gray-600';
    };

    const getTypeGlow = (type) => {
        const glows = {
            news: 'shadow-blue-500/20',
            form: 'shadow-green-500/20',
            quiz: 'shadow-purple-500/20',
        };
        return glows[type] || 'shadow-gray-500/20';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header with gradient background */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="relative text-center p-8 rounded-2xl overflow-hidden"
            >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getTypeGradient(item.type)} opacity-20 blur-3xl`} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                
                {/* Content */}
                <div className="relative z-10">
                    {item.badge && (
                        <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-block px-4 py-2 mb-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold shadow-lg shadow-red-500/30"
                        >
                            {item.badge}
                        </motion.span>
                    )}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
                    >
                        {item.title}
                    </motion.h1>
                    {item.description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-300 text-lg max-w-2xl mx-auto"
                        >
                            {item.description}
                        </motion.p>
                    )}
                </div>
            </motion.div>

            {/* News Detail */}
            {item.type === 'news' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative cafe-card rounded-2xl p-8 overflow-hidden group"
                >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
                    
                    {item.image_url && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mb-6 rounded-xl overflow-hidden shadow-2xl"
                        >
                            <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="prose prose-invert max-w-none relative z-10"
                    >
                        <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-line">
                            {item.description || 'محتوای خبر در اینجا نمایش داده می‌شود.'}
                        </p>
                    </motion.div>
                </motion.div>
            )}

            {/* Form Detail */}
            {item.type === 'form' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative cafe-card rounded-2xl p-8 overflow-hidden"
                >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl" />
                    
                    <AnimatePresence mode="wait">
                        {!formSubmitted ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onSubmit={handleFormSubmit}
                                className="relative z-10"
                            >
                                {!user ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8 sm:py-12 px-4"
                                    >
                                        <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🔒</div>
                                        <p className="text-gray-300 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed px-2">
                                            لطفاً ابتدا وارد حساب کاربری خود شوید
                                        </p>
                                        <motion.button
                                            type="button"
                                            onClick={() => navigate('/login', { state: { from: location.pathname } })}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="cafe-button px-8 py-3.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-sm min-h-[48px] touch-manipulation shadow-lg"
                                        >
                                            ورود به حساب کاربری
                                        </motion.button>
                                    </motion.div>
                                ) : hasSubmittedForm ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-8 sm:py-12 px-4"
                                    >
                                        <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✅</div>
                                        <p className="text-gray-300 text-base sm:text-lg mb-3 sm:mb-2 font-semibold">
                                            شما قبلاً این فرم را پر کرده‌اید
                                        </p>
                                        {existingFormResponse && (
                                            <p className="text-gray-400 text-sm sm:text-base mb-4">
                                                تاریخ ارسال: {new Date(existingFormResponse.created_at).toLocaleDateString('fa-IR')}
                                            </p>
                                        )}
                                    </motion.div>
                                ) : item.fields && item.fields.length > 0 ? (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="space-y-6"
                                        >
                                            {item.fields.map((field, index) => (
                                                <motion.div
                                                    key={field.name}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + index * 0.1 }}
                                                    className="group"
                                                >
                                                    {renderField(field)}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8"
                                        >
                                            <motion.button
                                                type="submit"
                                                disabled={formSubmitting || hasSubmittedForm}
                                                whileHover={{ scale: 1.02, boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)" }}
                                                whileTap={{ scale: 0.98 }}
                                                className="cafe-button flex-1 px-6 py-4 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group min-h-[52px] sm:min-h-[56px] touch-manipulation"
                                            >
                                                {formSubmitting ? (
                                                    <span className="flex items-center justify-center gap-2 relative z-10">
                                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        در حال ارسال...
                                                    </span>
                                                ) : (
                                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        ارسال فرم
                                                    </span>
                                                )}
                                                {!formSubmitting && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        initial={false}
                                                    />
                                                )}
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                onClick={() => navigate('/news')}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="flex-1 px-6 py-4 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-gray-700/80 hover:bg-gray-600 active:bg-gray-500 text-white transition-all shadow-lg backdrop-blur-sm border border-gray-600/50 min-h-[52px] sm:min-h-[56px] touch-manipulation"
                                            >
                                                انصراف
                                            </motion.button>
                                        </motion.div>
                                    </>
                                ) : (
                                    <p className="text-gray-300 text-center py-8">
                                        این فرم فیلدی ندارد.
                                    </p>
                                )}
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="text-center py-12 relative z-10"
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="text-7xl mb-6"
                                >
                                    ✅
                                </motion.div>
                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                                >
                                    فرم با موفقیت ارسال شد!
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-300 mb-6"
                                >
                                    از مشارکت شما متشکریم. به زودی به صفحه اصلی هدایت می‌شوید...
                                </motion.p>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ delay: 0.5, duration: 2 }}
                                    className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full max-w-xs mx-auto"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Quiz Detail */}
            {item.type === 'quiz' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative cafe-card rounded-2xl p-8 overflow-hidden"
                >
                    {/* Decorative gradient */}
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
                    
                    {item.questions && item.questions.length > 0 ? (
                        <>
                            <div className="space-y-6 mb-8 relative z-10">
                                {item.questions.map((question, qIndex) => (
                                    <motion.div
                                        key={qIndex}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + qIndex * 0.1 }}
                                        className="relative p-4 sm:p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl border border-purple-500/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
                                    >
                                        {/* Question number badge */}
                                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                            {qIndex + 1}
                                        </div>
                                        
                                        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-5 pr-8 sm:pr-10 leading-relaxed">
                                            {question.question}
                                        </h3>
                                        <div className="space-y-3">
                                            <AnimatePresence>
                                                {question.options.map((option, oIndex) => {
                                                    const isSelected = quizAnswers[qIndex] === oIndex;
                                                    const isCorrect = oIndex === question.correct_answer;
                                                    const showResult = quizSubmitted;
                                                    
                                                    let bgClass = 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600/50';
                                                    let glowClass = '';
                                                    
                                                    if (showResult) {
                                                        if (isCorrect) {
                                                            bgClass = 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-400';
                                                            glowClass = 'shadow-lg shadow-green-500/50';
                                                        } else if (isSelected && !isCorrect) {
                                                            bgClass = 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400';
                                                            glowClass = 'shadow-lg shadow-red-500/50';
                                                        }
                                                    } else if (isSelected) {
                                                        bgClass = 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400';
                                                        glowClass = 'shadow-lg shadow-purple-500/50';
                                                    }
                                                    
                                                    return (
                                                        <motion.button
                                                            key={oIndex}
                                                            type="button"
                                                            onClick={() => handleQuizAnswer(qIndex, oIndex)}
                                                            disabled={quizSubmitted}
                                                            whileHover={!quizSubmitted ? { scale: 1.01 } : {}}
                                                            whileTap={!quizSubmitted ? { scale: 0.97 } : {}}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.4 + qIndex * 0.1 + oIndex * 0.05 }}
                                                            className={`w-full text-right p-4 sm:p-4 rounded-xl text-white font-medium transition-all duration-300 border-2 ${bgClass} ${glowClass} min-h-[56px] sm:min-h-[52px] touch-manipulation active:scale-[0.97] ${
                                                                !quizSubmitted ? 'cursor-pointer hover:shadow-xl active:shadow-lg' : 'cursor-default'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-lg">{option}</span>
                                                                {showResult && isCorrect && (
                                                                    <motion.span
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="text-2xl text-green-200"
                                                                    >
                                                                        ✓
                                                                    </motion.span>
                                                                )}
                                                                {showResult && isSelected && !isCorrect && (
                                                                    <motion.span
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="text-2xl text-red-200"
                                                                    >
                                                                        ✗
                                                                    </motion.span>
                                                                )}
                                                                {!showResult && isSelected && (
                                                                    <motion.span
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="text-xl text-purple-200"
                                                                    >
                                                                        ●
                                                                    </motion.span>
                                                                )}
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            <AnimatePresence>
                                {quizScore !== null && showScoreAnimation && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5, y: 50, rotateX: -90 }}
                                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 200, 
                                            damping: 20,
                                            duration: 0.6
                                        }}
                                        className="mb-8 relative z-10"
                                    >
                                        {/* Glowing background effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-600/20 rounded-3xl blur-2xl animate-pulse" />
                                        
                                        <div className="relative p-8 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-gray-800/90 rounded-3xl border-2 border-purple-400/50 shadow-2xl shadow-purple-500/40 backdrop-blur-xl">
                                            {/* Decorative particles */}
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                                            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                                            <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                                            
                                            <div className="text-center relative z-10">
                                                {/* Celebration emoji based on score */}
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -180 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                                    className="text-6xl mb-4"
                                                >
                                                    {quizScore >= 80 ? '🎉' : quizScore >= 60 ? '👍' : '💪'}
                                                </motion.div>
                                                
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="text-sm text-purple-200 mb-3 font-semibold uppercase tracking-wider"
                                                >
                                                    امتیاز نهایی شما
                                                </motion.p>
                                                
                                                <motion.div
                                                    key={scoreDisplay}
                                                    initial={{ scale: 0.5 }}
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 0.3 }}
                                                    className="relative inline-block"
                                                >
                                                    <motion.p
                                                        className="text-7xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl"
                                                        style={{ textShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
                                                    >
                                                        {scoreDisplay}%
                                                    </motion.p>
                                                    {/* Glow effect */}
                                                    <div className="absolute inset-0 text-7xl font-black bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-50 -z-10" />
                                                </motion.div>
                                                
                                                {/* Motivational message */}
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5 }}
                                                    className="mt-4 text-lg text-gray-300 font-medium"
                                                >
                                                    {quizScore >= 80 
                                                        ? 'عالی! شما عالی عمل کردید! 🌟' 
                                                        : quizScore >= 60 
                                                        ? 'خوب بود! ادامه دهید! 💪' 
                                                        : 'خوب تلاش کردید! دوباره امتحان کنید! 🚀'}
                                                </motion.p>
                                                
                                                {/* Progress bar with animation */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.6 }}
                                                    className="mt-6"
                                                >
                                                    <div className="h-4 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${quizScore}%` }}
                                                            transition={{ delay: 0.7, duration: 1.2, ease: "easeOut" }}
                                                            className={`h-full rounded-full ${
                                                                quizScore >= 80 
                                                                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600' 
                                                                    : quizScore >= 60 
                                                                    ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600'
                                                                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600'
                                                            } shadow-lg`}
                                                        >
                                                            <motion.div
                                                                animate={{
                                                                    x: ['-100%', '100%'],
                                                                }}
                                                                transition={{
                                                                    duration: 2,
                                                                    repeat: Infinity,
                                                                    ease: "linear"
                                                                }}
                                                                className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                            />
                                                        </motion.div>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {item.questions.filter((q, idx) => quizAnswers[idx] === q.correct_answer).length} از {item.questions.length} سوال صحیح
                                                    </p>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {!user ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8 sm:py-12 px-4 relative z-10"
                                >
                                    <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🔒</div>
                                    <p className="text-gray-300 text-base sm:text-lg mb-5 sm:mb-6 leading-relaxed px-2">
                                        لطفاً ابتدا وارد حساب کاربری خود شوید
                                    </p>
                                    <motion.button
                                        type="button"
                                        onClick={() => navigate('/login', { state: { from: location.pathname } })}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="cafe-button px-8 py-3.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-sm min-h-[48px] touch-manipulation shadow-lg"
                                    >
                                        ورود به حساب کاربری
                                    </motion.button>
                                </motion.div>
                            ) : hasSubmittedQuiz && !quizSubmitted ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8 sm:py-12 px-4 relative z-10"
                                >
                                    <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">✅</div>
                                    <p className="text-gray-300 text-base sm:text-lg mb-3 sm:mb-2 font-semibold">
                                        شما قبلاً به این کوییز پاسخ داده‌اید
                                    </p>
                                    {existingQuizResponse && (
                                        <p className="text-gray-400 text-sm sm:text-base mb-5 sm:mb-4">
                                            امتیاز شما: <span className="text-red-400 font-bold">{existingQuizResponse.score}%</span>
                                        </p>
                                    )}
                                    <motion.button
                                        onClick={() => navigate('/news')}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="cafe-button px-8 py-3.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-sm min-h-[48px] touch-manipulation shadow-lg"
                                    >
                                        بازگشت به هاب
                                    </motion.button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10"
                                >
                                    {!quizSubmitted ? (
                                        <motion.button
                                            onClick={handleQuizSubmit}
                                            disabled={Object.values(quizAnswers).some((ans) => ans === null) || hasSubmittedQuiz}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="cafe-button flex-1 px-6 py-4 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[52px] sm:min-h-[56px] touch-manipulation"
                                        >
                                            ارسال پاسخ‌ها
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            onClick={() => navigate('/news')}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="cafe-button flex-1 px-6 py-4 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-purple-500/30 min-h-[52px] sm:min-h-[56px] touch-manipulation"
                                        >
                                            بازگشت به هاب
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-300 text-center py-8">
                            این کوئیز سوالی ندارد.
                        </p>
                    )}
                </motion.div>
            )}

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center"
            >
                <motion.button
                    onClick={() => navigate('/news')}
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 rounded-xl bg-gray-700/80 hover:bg-gray-600 text-white font-semibold transition-all shadow-lg backdrop-blur-sm border border-gray-600/50"
                >
                    ← بازگشت به هاب
                </motion.button>
            </motion.div>
        </motion.div>
    );
}

export default FeedDetail;

