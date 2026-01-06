import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PaymentError() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    
    const message = searchParams.get('message') || 'پرداخت انجام نشد یا توسط کاربر لغو شد';
    
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            navigate('/my-sessions');
        }
    }, [countdown, navigate]);
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-md w-full">
                {/* Error Card */}
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-red-500/20 shadow-2xl p-6 sm:p-8 text-center">
                    {/* Error Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                        پرداخت ناموفق بود
                    </h1>
                    
                    {/* Message */}
                    <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 leading-relaxed px-2 break-words">
                        {message}
                    </p>
                    
                    {/* Countdown */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 border border-white/10">
                        <p className="text-gray-400 text-xs sm:text-sm mb-2">
                            در حال بازگشت به صفحه رزروهای من...
                        </p>
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                            {countdown}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2.5 sm:space-y-3">
                        <button
                            onClick={() => navigate('/my-sessions')}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:scale-95 text-white font-semibold py-3 sm:py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg text-sm sm:text-base"
                        >
                            مشاهده رزروهای من
                        </button>
                        
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-white/10 hover:bg-white/20 active:bg-white/15 text-white font-medium py-2.5 sm:py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 text-sm sm:text-base"
                        >
                            بازگشت به صفحه اصلی
                        </button>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10">
                        <p className="text-gray-400 text-xs leading-relaxed px-2">
                            در صورت بروز مشکل، لطفاً با پشتیبانی تماس بگیرید.
                            <br />
                            می‌توانید دوباره از بخش "رزروهای من" اقدام به پرداخت کنید.
                        </p>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="text-center mt-5 sm:mt-6">
                    <p className="text-gray-500 text-xs sm:text-sm">
                        با تشکر از صبر شما
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PaymentError;

