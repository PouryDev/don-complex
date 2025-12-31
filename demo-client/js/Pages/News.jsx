import React from 'react';
import { NewsIcon } from '../Components/Icons';

function News() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">اخبار</h1>
                <p className="text-gray-300">اخبار و اطلاعیه‌ها</p>
            </div>

            {/* Placeholder Content */}
            <div className="cafe-card rounded-xl p-12 text-center">
                <div className="flex justify-center mb-6 text-red-500">
                    <NewsIcon className="w-20 h-20" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                    به زودی
                </h2>
                <p className="text-gray-300">
                    این بخش به زودی فعال خواهد شد
                </p>
            </div>
        </div>
    );
}

export default News;

