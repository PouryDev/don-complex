import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Input from '../../Components/Input';
import Checkbox from '../../Components/Checkbox';
import { adminService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

function CategoryForm({ category, onSuccess, onCancel }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        order: 0,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                is_active: category.is_active ?? true,
                order: category.order || 0,
            });
        }
    }, [category]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const submitData = {
                ...formData,
                is_active: formData.is_active ? 1 : 0,
            };
            
            if (category) {
                await adminService.updateCategory(category.id, submitData);
                showToast('دسته‌بندی با موفقیت به‌روزرسانی شد', 'success');
            } else {
                await adminService.createCategory(submitData);
                showToast('دسته‌بندی با موفقیت ایجاد شد', 'success');
            }
            onSuccess();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                showToast(err.response?.data?.message || 'خطا در ذخیره دسته‌بندی', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-red-900/50">
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {category ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="sm:hidden w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                <Input
                    label="نام دسته‌بندی"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name?.[0]}
                    required
                />

                <Input
                    label="توضیحات"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={errors.description?.[0]}
                    textarea
                    rows={3}
                />

                <Checkbox
                    label="فعال"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    error={errors.is_active?.[0]}
                />

                <Input
                    label="ترتیب نمایش"
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={handleChange}
                    error={errors.order?.[0]}
                    min="0"
                />
                </div>

                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 p-4 sm:p-6 pt-4 border-t border-red-900/50 bg-gray-800">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 cafe-button px-6 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                        {loading ? 'در حال ذخیره...' : (category ? 'به‌روزرسانی' : 'ایجاد')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="hidden sm:block px-6 py-3 rounded-xl text-sm font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        لغو
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CategoryForm;

