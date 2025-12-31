import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cartApi, couponsApi, Cart, CartItem, Coupon } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
    cart: Cart | null;
    isLoading: boolean;
    itemsCount: number;
    subtotal: string;
    addToCart: (productId: number, quantity: number, size?: string, color?: string) => Promise<{ success: boolean; message?: string }>;
    updateQuantity: (itemId: number, quantity: number) => Promise<{ success: boolean; message?: string }>;
    removeItem: (itemId: number) => Promise<{ success: boolean; message?: string }>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    coupon: Coupon | null;
    discountAmount: number;
    applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart(null);
            return;
        }

        setIsLoading(true);
        try {
            const result = await cartApi.get();
            if (result.success && result.data) {
                setCart(result.data);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    const addToCart = async (productId: number, quantity: number, size?: string, color?: string) => {
        if (!isAuthenticated) {
            return { success: false, message: 'Please login to add items to cart' };
        }

        const result = await cartApi.addItem(productId, quantity, size, color);
        if (result.success) {
            await refreshCart();
            return { success: true };
        }
        return { success: false, message: result.message };
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        const result = await cartApi.updateItem(itemId, quantity);
        if (result.success) {
            await refreshCart();
            return { success: true };
        }
        return { success: false, message: result.message };
    };

    const removeItem = async (itemId: number) => {
        const result = await cartApi.removeItem(itemId);
        if (result.success) {
            await refreshCart();
            return { success: true };
        }
        return { success: false, message: result.message };
    };

    const applyCoupon = async (code: string) => {
        if (!cart) return { success: false, message: 'Cart is empty' };

        try {
            const result = await couponsApi.apply(code, parseFloat(cart.subtotal));
            if (result.success && result.data) {
                setCoupon(result.data.coupon);
                setDiscountAmount(result.data.discount_amount);
                return { success: true, message: 'Coupon applied successfully' };
            }
            return { success: false, message: result.message || 'Invalid coupon' };
        } catch (error) {
            return { success: false, message: 'Failed to apply coupon' };
        }
    };

    const removeCoupon = () => {
        setCoupon(null);
        setDiscountAmount(0);
    };

    const clearCart = async () => {
        await cartApi.clear();
        setCart(null);
        setCoupon(null);
        setDiscountAmount(0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                isLoading,
                itemsCount: cart?.items_count || 0,
                subtotal: cart?.subtotal || '0.00',
                addToCart,
                updateQuantity,
                removeItem,
                clearCart,
                refreshCart,
                coupon,
                discountAmount,
                applyCoupon,
                removeCoupon,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
