import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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

    // Cart is disabled - no API calls
    // Keeping context for compatibility but all operations are no-ops

    const fetchCart = useCallback(async () => {
        // No-op: cart is disabled
        setSyncing(false);
        setCart([]);
    }, []);

    const addToCart = async (item) => {
        // No-op: cart is disabled
        setLoading(false);
    };

    const removeFromCart = async (menuItemId) => {
        // No-op: cart is disabled
        setLoading(false);
    };

    const updateCartItemQuantity = async (menuItemId, quantity) => {
        // No-op: cart is disabled
        setLoading(false);
    };

    const clearCart = async () => {
        // No-op: cart is disabled
        setLoading(false);
        setCart([]);
    };

    const updateCart = (newCart) => {
        // No-op: cart is disabled
        setCart([]);
    };

    const syncCart = useCallback(() => {
        // No-op: cart is disabled
        return Promise.resolve();
    }, []);

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

