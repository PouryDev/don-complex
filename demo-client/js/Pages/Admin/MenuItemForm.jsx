import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Input from '../../Components/Input';
import Select from '../../Components/Select';
import ImageUpload from '../../Components/ImageUpload';
import Checkbox from '../../Components/Checkbox';
import { adminService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

function MenuItemForm({ menuItem, categories, onSuccess, onCancel }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category_id: '',
        name: '',
        description: '',
        ingredients: '',
        price: '',
        is_available: true,
        order: 0,
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageDeleted, setImageDeleted] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (menuItem) {
            setFormData({
                category_id: menuItem.category_id || '',
                name: menuItem.name || '',
                description: menuItem.description || '',
                ingredients: menuItem.ingredients || '',
                price: menuItem.price || '',
                is_available: menuItem.is_available ?? true,
                order: menuItem.order || 0,
            });
            if (menuItem.image) {
                // Set preview URL if image exists
                const imageUrl = menuItem.image.startsWith('http') 
                    ? menuItem.image 
                    : `/storage/${menuItem.image}`;
                setImagePreview(imageUrl);
            } else {
                setImagePreview(null);
            }
            setImageDeleted(false);
            setImageFile(null);
        }
    }, [menuItem]);

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

    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, category_id: value }));
        if (errors.category_id) {
            setErrors(prev => ({ ...prev, category_id: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const submitData = {
                ...formData,
                price: parseFloat(formData.price),
                order: parseInt(formData.order) || 0,
                is_available: formData.is_available ? 1 : 0,
            };

            // Only send image if it's a File object (new upload)
            const imageToUpload = imageFile instanceof File ? imageFile : null;

            if (menuItem) {
                await adminService.updateMenuItem(menuItem.id, submitData, imageToUpload, imageDeleted);
                showToast('آیتم منو با موفقیت به‌روزرسانی شد', 'success');
            } else {
                await adminService.createMenuItem(submitData, imageToUpload);
                showToast('آیتم منو با موفقیت ایجاد شد', 'success');
            }
            onSuccess();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                showToast(err.response?.data?.message || 'خطا در ذخیره آیتم منو', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = categories.map(cat => ({
        value: cat.id,
        label: cat.name,
    }));

    return (
        <div className="flex flex-col h-full max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-red-900/50">
                {/* Mobile Header with Close Button */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {menuItem ? 'ویرایش آیتم منو' : 'افزودن آیتم منو جدید'}
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
                <Select
                    label="دسته‌بندی"
                    value={formData.category_id}
                    onChange={handleCategoryChange}
                    options={categoryOptions}
                    error={errors.category_id?.[0]}
                    placeholder="دسته‌بندی را انتخاب کنید"
                />

                <Input
                    label="نام آیتم"
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

                <Input
                    label="مواد تشکیل‌دهنده"
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleChange}
                    error={errors.ingredients?.[0]}
                    textarea
                    rows={2}
                />

                <Input
                    label="قیمت (تومان)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    error={errors.price?.[0]}
                    min="0"
                    step="1000"
                    required
                />

                <ImageUpload
                    label="تصویر"
                    value={imagePreview}
                    onChange={(file) => {
                        setImageFile(file);
                        if (file === null) {
                            setImagePreview(null);
                            // If there was an existing image and user deleted it, mark for deletion
                            if (menuItem && menuItem.image) {
                                setImageDeleted(true);
                            }
                        } else {
                            // If a new file is uploaded, reset deletion flag
                            setImageDeleted(false);
                        }
                    }}
                    error={errors.image?.[0]}
                />

                <Checkbox
                    label="در دسترس"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleChange}
                    error={errors.is_available?.[0]}
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
                        {loading ? 'در حال ذخیره...' : (menuItem ? 'به‌روزرسانی' : 'ایجاد')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="hidden sm:block px-6 py-3 rounded-xl text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        لغو
                    </button>
                </div>
            </form>
        </div>
    );
}

export default MenuItemForm;

