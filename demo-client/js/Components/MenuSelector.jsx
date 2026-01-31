import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuService } from '../services/api';
import Loading from './Loading';
import { MenuDefaultIcon, PlusIcon, MinusIcon, getCategoryIcon } from './Icons';

function MenuSelector({ branchId, onSelectionChange, initialItems = [], onTotalChange }) {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedItems, setSelectedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialItemsRef = useRef(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Only initialize once or when initialItems actually changes (deep comparison)
        const currentInitialItems = JSON.stringify(initialItems || []);
        const previousInitialItems = initialItemsRef.current;
        
        // Only initialize if:
        // 1. Not initialized yet AND initialItems has data
        // 2. OR initialItems has actually changed (not just reference)
        if ((!isInitializedRef.current && initialItems && initialItems.length > 0) ||
            (previousInitialItems !== currentInitialItems && initialItems && initialItems.length > 0)) {
            const items = {};
            initialItems.forEach(item => {
                items[item.menu_item_id] = item.quantity;
            });
            setSelectedItems(items);
            initialItemsRef.current = currentInitialItems;
            isInitializedRef.current = true;
        } else if ((!initialItems || initialItems.length === 0) && isInitializedRef.current) {
            // Reset if initialItems becomes empty and we were previously initialized
            setSelectedItems({});
            initialItemsRef.current = currentInitialItems;
        } else {
            // Update ref even if we don't change state
            initialItemsRef.current = currentInitialItems;
        }
    }, [initialItems]);

    useEffect(() => {
        if (branchId) {
            fetchData();
        }
    }, [branchId]);

    useEffect(() => {
        // Notify parent of selection changes
        const items = Object.entries(selectedItems)
            .filter(([_, quantity]) => quantity > 0)
            .map(([menuItemId, quantity]) => ({
                menu_item_id: parseInt(menuItemId),
                quantity: quantity
            }));
        
        onSelectionChange(items);
        
        // Calculate and notify parent of total price and items details if callback provided
        if (onTotalChange && menuItems.length > 0) {
            const total = getTotal();
            const itemsDetails = getSelectedItemsDetails();
            onTotalChange(total, itemsDetails);
        }
    }, [selectedItems, menuItems, onSelectionChange, onTotalChange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [categoriesData, menuItemsData] = await Promise.all([
                menuService.getCategories(branchId),
                menuService.getMenuItems(branchId)
            ]);
            
            // Handle categories response
            const categoriesArray = Array.isArray(categoriesData) 
                ? categoriesData 
                : (categoriesData?.data || []);
            setCategories(categoriesArray);
            
            // Handle menu items response (could be paginated or simple array)
            const menuItemsArray = Array.isArray(menuItemsData)
                ? menuItemsData
                : (menuItemsData?.data || []);
            setMenuItems(menuItemsArray);
        } catch (err) {
            console.error('Error fetching menu:', err);
            setError('خطا در بارگذاری منو');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (menuItemId, delta, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        setSelectedItems(prev => {
            const current = prev[menuItemId] || 0;
            const newQuantity = Math.max(0, current + delta);
            
            if (newQuantity === 0) {
                const { [menuItemId]: _, ...rest } = prev;
                return rest;
            }
            
            return { ...prev, [menuItemId]: newQuantity };
        });
    };

    const getTotal = () => {
        return Object.entries(selectedItems).reduce((total, [menuItemId, quantity]) => {
            const item = menuItems.find(mi => mi.id === parseInt(menuItemId));
            return total + (item ? item.price * quantity : 0);
        }, 0);
    };

    const getTotalItems = () => {
        return Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
    };

    const getSelectedItemsDetails = () => {
        return Object.entries(selectedItems)
            .filter(([_, quantity]) => quantity > 0)
            .map(([menuItemId, quantity]) => {
                const item = menuItems.find(mi => mi.id === parseInt(menuItemId));
                return item ? {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: quantity,
                    total: item.price * quantity
                } : null;
            })
            .filter(item => item !== null);
    };

    const filteredMenuItems = selectedCategory === 'all'
        ? menuItems
        : menuItems.filter(item => item.category_id === selectedCategory);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory('all');
                    }}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    همه
                </button>
                {categories.map(category => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category.id);
                        }}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                            selectedCategory === category.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {getCategoryIcon(category.name)}
                        {category.name}
                    </button>
                ))}
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {filteredMenuItems.map(item => {
                        const quantity = selectedItems[item.id] || 0;
                        
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-gray-800 rounded-lg shadow-sm p-4 border-2 transition-colors ${
                                    quantity > 0 ? 'border-blue-500' : 'border-gray-700'
                                }`}
                            >
                                <div className="flex gap-3">
                                    {/* Image */}
                                    <div className="w-20 h-20 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <MenuDefaultIcon />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white truncate">{item.name}</h4>
                                        {item.description && (
                                            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                                {item.description}
                                            </p>
                                        )}
                                        <p className="text-lg font-bold text-blue-600 mt-2">
                                            {item.price.toLocaleString('fa-IR')} تومان
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {quantity === 0 ? (
                                            <button
                                                type="button"
                                                onClick={(e) => handleQuantityChange(item.id, 1, e)}
                                                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <PlusIcon />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleQuantityChange(item.id, 1, e)}
                                                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    <PlusIcon />
                                                </button>
                                                <span className="text-lg font-bold text-white">
                                                    {quantity.toLocaleString('fa-IR')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleQuantityChange(item.id, -1, e)}
                                                    className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <MinusIcon />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Summary */}
            {getTotalItems() > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-400">
                                تعداد آیتم‌ها: <span className="font-bold text-white">{getTotalItems().toLocaleString('fa-IR')}</span>
                            </p>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                                مجموع: {getTotal().toLocaleString('fa-IR')} تومان
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default MenuSelector;

