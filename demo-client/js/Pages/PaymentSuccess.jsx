import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { reservationService } from '../services/api';

function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const transactionId = searchParams.get('transaction_id');

    useEffect(() => {
        const fetchReservation = async () => {
            if (!transactionId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch reservation by transaction ID through API
                // Note: You may need to add an endpoint to get reservation by transaction ID
                // For now, we'll just show the transaction ID
                setLoading(false);
            } catch (error) {
                console.error('Error fetching reservation:', error);
                setLoading(false);
            }
        };

        fetchReservation();
    }, [transactionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">در حال بارگذاری...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Success Card */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20 shadow-2xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white mb-3">
                        پرداخت موفق بود!
                    </h1>

                    {/* Subtitle */}
                    <p className="text-gray-300 mb-6 leading-relaxed">
                        پرداخت شما با موفقیت انجام شد و رزرو شما ثبت شده است.
                        {transactionId && (
                            <>
                                <br />
                                <span className="text-green-400 font-semibold">شماره تراکنش: #{transactionId}</span>
                            </>
                        )}
                    </p>

                    {/* Info Cards */}
                    {transactionId && (
                        <div className="space-y-4 mb-8">
                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">وضعیت پرداخت</span>
                                    <span className="text-green-400 text-sm font-medium">موفق</span>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">شماره تراکنش</span>
                                    <span className="text-white text-sm font-medium">#{transactionId}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/my-sessions')}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            مشاهده رزروهای من
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
                        >
                            بازگشت به صفحه اصلی
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-400 text-xs leading-relaxed">
                            جزئیات رزرو شما در بخش "رزروهای من" قابل مشاهده است.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        با تشکر از اعتماد شما
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;

