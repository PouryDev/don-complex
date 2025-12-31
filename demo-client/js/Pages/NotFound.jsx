import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-8xl mb-6">🔍</div>
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-300 mb-4">
                صفحه یافت نشد
            </h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
                صفحه‌ای که دنبال آن هستید وجود ندارد یا منتقل شده است.
            </p>
            <Link to="/" className="cafe-button px-8 py-3 rounded-xl text-white font-semibold inline-block">
                بازگشت به خانه
            </Link>
        </div>
    );
}

export default NotFound;

