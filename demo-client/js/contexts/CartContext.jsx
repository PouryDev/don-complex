import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(true);

    // Load cart from API on mount
    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = useCallback(async () => {
        try {
            setSyncing(true);
            setError(null);
            const cartData = await cartService.getCart();
            setCart(cartData.items || []);
        } catch (err) {
            console.error('Error loading cart from API:', err);
            setError('خطا در بارگذاری سبد خرید');
            // On error, set empty cart instead of showing error
            setCart([]);
        } finally {
            setSyncing(false);
        }
    }, []);

    const addToCart = async (item) => {
        try {
            setLoading(true);
            setError(null);
            const cartData = await cartService.addItem(item.id, item.quantity || 1);
            setCart(cartData.items || []);
        } catch (err) {
            console.error('Error adding item to cart:', err);
            setError(err.response?.data?.message || 'خطا در افزودن آیتم به سبد خرید');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (menuItemId) => {
        try {
            setLoading(true);
            setError(null);
            const cartData = await cartService.removeItem(menuItemId);
            setCart(cartData.items || []);
        } catch (err) {
            console.error('Error removing item from cart:', err);
            setError(err.response?.data?.message || 'خطا در حذف آیتم از سبد خرید');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCartItemQuantity = async (menuItemId, quantity) => {
        if (quantity <= 0) {
            await removeFromCart(menuItemId);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const cartData = await cartService.updateItem(menuItemId, quantity);
            setCart(cartData.items || []);
        } catch (err) {
            console.error('Error updating cart item:', err);
            setError(err.response?.data?.message || 'خطا در بروزرسانی آیتم');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        try {
            setLoading(true);
            setError(null);
            const cartData = await cartService.clearCart();
            setCart(cartData.items || []);
        } catch (err) {
            console.error('Error clearing cart:', err);
            setError(err.response?.data?.message || 'خطا در پاک کردن سبد خرید');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateCart = (newCart) => {
        setCart(newCart);
    };

    const syncCart = useCallback(() => {
        return fetchCart();
    }, [fetchCart]);

    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                showCart,
                setShowCart,
                addToCart,
                removeFromCart,
                updateCartItemQuantity,
                clearCart,
                updateCart,
                cartCount,
                loading,
                error,
                syncing,
                syncCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

