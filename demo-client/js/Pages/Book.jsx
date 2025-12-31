import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { branchService } from '../services/api';
import Loading from '../Components/Loading';
import { BranchIcon, WarningIcon, EmptyBoxIcon } from '../Components/Icons';

function Book() {
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await branchService.getBranches();
            // Handle paginated response - Laravel paginated responses have a 'data' property
            const branchesData = Array.isArray(response) ? response : (response.data || []);
            setBranches(branchesData);
        } catch (err) {
            setError('خطا در بارگذاری شعبه‌ها. لطفا دوباره تلاش کنید.');
            console.error('Error fetching branches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBranchSelect = (branchId) => {
        navigate(`/book/branch/${branchId}/sessions`);
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-red-500">
                    <WarningIcon className="w-16 h-16" />
                </div>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                    onClick={fetchBranches}
                    className="cafe-button px-6 py-2 rounded-lg"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-2">رزرو وقت</h1>
                <p className="text-gray-300">شعبه مورد نظر خود را انتخاب کنید</p>
            </div>

            {/* Branches List */}
            <div className="space-y-4">
                {branches.map((branch) => (
                    <button
                        key={branch.id}
                        onClick={() => handleBranchSelect(branch.id)}
                        className="w-full cafe-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 text-right"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                                <BranchIcon className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    {branch.name}
                                </h3>
                                {branch.address && (
                                    <p className="text-sm text-gray-300">
                                        {branch.address}
                                    </p>
                                )}
                            </div>
                            <div className="text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {branches.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <EmptyBoxIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300 mb-2">شعبه‌ای یافت نشد</p>
                </div>
            )}
        </div>
    );
}

export default Book;

