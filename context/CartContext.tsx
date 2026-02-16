'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/client';
import { useAuth } from '../context/AuthContext';

interface CartItem {
  id: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  refreshCart: () => void;
  updateCartLine: (lineId: string, newQuantity: number) => Promise<void>;
  cartTotal: number;
  itemCount: number;
  cartId: string | null;
  loading: boolean;
  error: string | null;
  itemLoadingStates: Record<string, boolean>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'supabase_cart_items';
const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemLoadingStates, setItemLoadingStates] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const supabase = createClient();

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (err) {
        console.error('Failed to parse saved cart:', err);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      if (cartItems.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, [cartItems, isClient]);

  // Refresh cart - validate products still exist and have stock
  const refreshCart = useCallback(async () => {
    try {
      if (cartItems.length === 0) return;

      setLoading(true);
      setError(null);

      const productIds = cartItems.map(item => item.productId);

      // Fetch current product data
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, inventory_quantity, images, is_active')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Update cart items with current data
      const updatedItems = cartItems
        .map(item => {
          const product = products?.find(p => p.id === item.productId);
          if (!product || !product.is_active) return null;

          // Adjust quantity if stock is lower
          const maxQuantity = product.inventory_quantity;
          const adjustedQuantity = Math.min(item.quantity, maxQuantity);

          if (adjustedQuantity <= 0) return null;

          return {
            ...item,
            name: product.name,
            price: product.price,
            quantity: adjustedQuantity,
            image: Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : item.image
          };
        })
        .filter((item): item is CartItem => item !== null);

      setCartItems(updatedItems);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh cart');
    } finally {
      setLoading(false);
    }
  }, [cartItems, supabase]);

  // Add item to cart
  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    try {
      setLoading(true);
      setError(null);

      // Verify product exists and has stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, inventory_quantity, is_active')
        .eq('id', item.productId || item.id)
        .single();

      if (productError || !product) {
        throw new Error('Product not found');
      }

      if (!product.is_active) {
        throw new Error('Product is no longer available');
      }

      if (product.inventory_quantity <= 0) {
        throw new Error('Product is out of stock');
      }

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(
        cartItem => cartItem.variantId === item.variantId
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const newQuantity = cartItems[existingItemIndex].quantity + 1;

        if (newQuantity > product.inventory_quantity) {
          throw new Error(`Only ${product.inventory_quantity} items available in stock`);
        }

        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        setCartItems(updatedItems);
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          ...item,
          productId: item.productId || item.id,
          quantity: 1
        };
        setCartItems(prev => [...prev, newItem]);
      }

      console.log('Successfully added to cart');
    } catch (err) {
      console.error('Failed to add item to cart:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (id: string) => {
    try {
      setCartItems(prev => prev.filter(item => item.id !== id && item.variantId !== id));
    } catch (err) {
      console.error('Failed to remove item from cart:', err);
      throw err;
    }
  };

  // Update item quantity in cart
  const updateQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(id);
        return;
      }

      // Find the item
      const item = cartItems.find(i => i.id === id || i.variantId === id);
      if (!item) return;

      // Check stock availability
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('inventory_quantity, is_active')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        throw new Error('Product not found');
      }

      if (!product.is_active) {
        throw new Error('Product is no longer available');
        await removeFromCart(id);
        return;
      }

      if (quantity > product.inventory_quantity) {
        throw new Error(`Only ${product.inventory_quantity} items available in stock`);
      }

      // Optimistic update
      setCartItems(prev => prev.map(item =>
        (item.id === id || item.variantId === id) ? { ...item, quantity } : item
      ));
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      throw err;
    }
  };

  // Update a specific cart line's quantity with loading state
  const updateCartLine = async (lineId: string, newQuantity: number) => {
    setItemLoadingStates(prev => ({ ...prev, [lineId]: true }));
    try {
      await updateQuantity(lineId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setItemLoadingStates(prev => ({ ...prev, [lineId]: false }));
    }
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    if (isClient) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const itemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart,
        updateCartLine,
        cartTotal,
        itemCount,
        cartId,
        loading,
        error,
        itemLoadingStates,
        clearCart
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
