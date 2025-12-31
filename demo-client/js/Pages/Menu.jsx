import React, { useState, useEffect } from 'react';
import { menuService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import Loading from '../Components/Loading';
import { getCategoryIcon, WarningIcon, SearchIcon } from '../Components/Icons';

function Menu() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const { addToCart } = useCart();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageErrors, setImageErrors] = useState(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            // Try public endpoints first, fallback to admin endpoints
            let categoriesData = [];
            let menuItemsData = [];
            
            try {
                categoriesData = await menuService.getCategories();
            } catch (err) {
                try {
                    categoriesData = await menuService.getCategoriesPublic();
                } catch (err2) {
                    console.error('Error fetching categories:', err2);
                }
            }
            
            try {
                menuItemsData = await menuService.getMenuItems();
            } catch (err) {
                try {
                    menuItemsData = await menuService.getMenuItemsPublic();
                } catch (err2) {
                    console.error('Error fetching menu items:', err2);
                }
            }
            
            setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData.data || []));
            setMenuItems(Array.isArray(menuItemsData) ? menuItemsData : (menuItemsData.data || []));
        } catch (err) {
            setError('خطا در بارگذاری منو. لطفا دوباره تلاش کنید.');
            console.error('Error fetching menu:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIconComponent = (categoryName) => {
        return getCategoryIcon(categoryName);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        return imagePath.startsWith('http') ? imagePath : `/storage/${imagePath}`;
    };

    const filteredItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => {
            if (selectedCategory === 'all') return true;
            const category = categories.find(cat => cat.id === selectedCategory || cat.id === parseInt(selectedCategory));
            return category && (item.category_id === category.id || item.category_id === parseInt(category.id));
        });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price);
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
                    onClick={fetchData}
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
                <h1 className="text-3xl font-bold text-white mb-2">منوی کافه</h1>
                <p className="text-gray-300">انتخاب کنید و لذت ببرید</p>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-3 px-1">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedCategory === 'all'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-500/20'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    همه
                </button>
                {categories.map((category) => {
                    const CategoryIcon = getCategoryIconComponent(category.name);
                    return (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                                selectedCategory === category.id || selectedCategory === category.id.toString()
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-red-500/20'
                            }`}
                        >
                            <CategoryIcon className="w-5 h-5" />
                            {category.name}
                        </button>
                    );
                })}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className="cafe-card rounded-xl p-4 hover:scale-[1.02] transition-all duration-200"
                    >
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image && !imageErrors.has(item.id) ? (
                                    <img 
                                        src={getImageUrl(item.image)} 
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={() => {
                                            setImageErrors(prev => new Set(prev).add(item.id));
                                        }}
                                    />
                                ) : (() => {
                                    const CategoryIcon = getCategoryIconComponent(item.category?.name || '');
                                    return <CategoryIcon className="w-10 h-10 text-red-400" />;
                                })()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                    {item.name}
                                </h3>
                                <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                                    {item.description || 'بدون توضیحات'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-red-400">
                                        {formatPrice(item.price)} تومان
                                    </span>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await addToCart(item);
                                            } catch (err) {
                                                console.error('Error adding to cart:', err);
                                            }
                                        }}
                                        className="cafe-button px-4 py-2 rounded-lg text-sm font-semibold"
                                    >
                                        افزودن
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="flex justify-center mb-4 text-red-500">
                        <SearchIcon className="w-16 h-16" />
                    </div>
                    <p className="text-gray-300">آیتمی در این دسته‌بندی یافت نشد</p>
                </div>
            )}
        </div>
    );
}

export default Menu;
