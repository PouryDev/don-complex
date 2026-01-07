import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../../Components/Loading';
import ConfirmDialog from '../../Components/ConfirmDialog';
import MenuItemForm from './MenuItemForm';
import CategoryForm from './CategoryForm';
import { MenuDefaultIcon, EditIcon, DeleteIcon, AddIcon, EmptyBoxIcon, FolderIcon } from '../../Components/Icons';

function MenuManagement() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('items'); // 'items' or 'categories'
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showMenuItemForm, setShowMenuItemForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: null, id: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsData, categoriesData] = await Promise.all([
                adminService.getMenuItems(),
                adminService.getCategories(),
            ]);
            setMenuItems(itemsData);
            setCategories(categoriesData);
        } catch (err) {
            showToast('خطا در بارگذاری داده‌ها', 'error');
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setEditingItem(null);
        setShowMenuItemForm(true);
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setShowMenuItemForm(true);
    };

    const handleDeleteItem = (id) => {
        setDeleteDialog({ isOpen: true, type: 'item', id });
    };

    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryForm(true);
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowCategoryForm(true);
    };

    const handleDeleteCategory = (id) => {
        setDeleteDialog({ isOpen: true, type: 'category', id });
    };

    const confirmDelete = async () => {
        const { type, id } = deleteDialog;
        try {
            if (type === 'item') {
                await adminService.deleteMenuItem(id);
                showToast('آیتم منو با موفقیت حذف شد', 'success');
            } else {
                await adminService.deleteCategory(id);
                showToast('دسته‌بندی با موفقیت حذف شد', 'success');
            }
            setDeleteDialog({ isOpen: false, type: null, id: null });
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'خطا در حذف', 'error');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `/storage/${imagePath}`;
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="space-y-6">

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'items'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                    }`}
                >
                    <MenuDefaultIcon className="w-5 h-5" />
                    آیتم‌های منو
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                        activeTab === 'categories'
                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-900/50'
                    }`}
                >
                    <FolderIcon className="w-5 h-5" />
                    دسته‌بندی‌ها
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'items' ? (
                    <motion.div
                        key="items"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">آیتم‌های منو</h2>
                            <button
                                onClick={handleAddItem}
                                className="cafe-button px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                            >
                                <AddIcon className="w-5 h-5" />
                                افزودن آیتم جدید
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {menuItems.map((item) => {
                                const imageUrl = getImageUrl(item.image);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="cafe-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <MenuDefaultIcon className="w-10 h-10 text-red-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                                    {item.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {item.category?.name || 'بدون دسته‌بندی'}
                                                </p>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-lg font-bold text-red-400">
                                                        {formatPrice(item.price)} تومان
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        item.is_available 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {item.is_available ? 'فعال' : 'غیرفعال'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditItem(item)}
                                                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                        ویرایش
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                    >
                                                        <DeleteIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {menuItems.length === 0 && (
                            <div className="text-center py-12">
                                <div className="flex justify-center mb-4 text-red-500">
                                    <EmptyBoxIcon className="w-16 h-16" />
                                </div>
                                <p className="text-gray-600">آیتمی در منو وجود ندارد</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="categories"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">دسته‌بندی‌ها</h2>
                            <button
                                onClick={handleAddCategory}
                                className="cafe-button px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                            >
                                <AddIcon className="w-5 h-5" />
                                افزودن دسته‌بندی جدید
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {categories.map((category) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="cafe-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-white">
                                            {category.name}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            category.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {category.is_active ? 'فعال' : 'غیرفعال'}
                                        </span>
                                    </div>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {category.description}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditCategory(category)}
                                            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                            ویرایش
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {categories.length === 0 && (
                            <div className="text-center py-12">
                                <div className="flex justify-center mb-4 text-red-500">
                                    <FolderIcon className="w-16 h-16" />
                                </div>
                                <p className="text-gray-600">دسته‌بندی‌ای وجود ندارد</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence>
                {showMenuItemForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
                        onClick={() => {
                            setShowMenuItemForm(false);
                            setEditingItem(null);
                        }}
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full sm:w-full sm:max-w-2xl bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <MenuItemForm
                                menuItem={editingItem}
                                categories={categories}
                                onSuccess={() => {
                                    setShowMenuItemForm(false);
                                    setEditingItem(null);
                                    fetchData();
                                }}
                                onCancel={() => {
                                    setShowMenuItemForm(false);
                                    setEditingItem(null);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}

                {showCategoryForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center"
                        onClick={() => {
                            setShowCategoryForm(false);
                            setEditingCategory(null);
                        }}
                    >
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full sm:w-full sm:max-w-2xl bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <CategoryForm
                                category={editingCategory}
                                onSuccess={() => {
                                    setShowCategoryForm(false);
                                    setEditingCategory(null);
                                    fetchData();
                                }}
                                onCancel={() => {
                                    setShowCategoryForm(false);
                                    setEditingCategory(null);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                title="تأیید حذف"
                message={`آیا مطمئن هستید که می‌خواهید این ${deleteDialog.type === 'item' ? 'آیتم منو' : 'دسته‌بندی'} را حذف کنید؟`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialog({ isOpen: false, type: null, id: null })}
                confirmText="حذف"
                cancelText="لغو"
                type="warning"
            />
        </div>
    );
}

export default MenuManagement;

