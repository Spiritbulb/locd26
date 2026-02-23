'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Loader2, Plus, Minus, Trash2, ShoppingBag, Shield, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { convertKEStoUSD, formatKES, formatUSD } from '@/lib/currency';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default function CartPage() {
  const {
    cartItems,
    loading,
    updateCartLine,
    removeFromCart,
    refreshCart,
    itemLoadingStates,
    clearCart,
  } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG;

  // ── Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!loading && cartItems.length > 0) refreshCart();
  }, []);

  // ── Cart helpers ───────────────────────────────────────────────
  const handleQuantityUpdate = async (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) { handleRemoveItem(lineId); return; }
    await updateCartLine(lineId, newQuantity);
  };

  const handleRemoveItem = async (lineId: string) => {
    await removeFromCart(lineId);
  };

  // ── Totals ─────────────────────────────────────────────────────
  const subtotalKES = safeCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );
  const shippingKES = 0;
  const totalKES    = subtotalKES + shippingKES;
  const totalUSD    = convertKEStoUSD(totalKES);

  // ── Create DB order, return orderNumber ────────────────────────
  const createOrder = async (): Promise<string> => {
    if (!user) {
      router.push('/auth/login?redirect=/cart');
      throw new Error('Please log in to complete your order');
    }
    if (safeCartItems.length === 0) throw new Error('Your cart is empty');
    if (!STORE_SLUG)                 throw new Error('Store configuration error');

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('slug', STORE_SLUG)
      .eq('is_active', true)
      .single();

    if (storeError || !store) throw new Error('Store not found');

    // Upsert customer
    let customerId: string;
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('store_id', store.id)
      .eq('email', user.email)
      .single();

    if (existing) {
      customerId = existing.id;
    } else {
      const { data: newCustomer, error: ce } = await supabase
        .from('customers')
        .insert({
          store_id:   store.id,
          email:      user.email,
          first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Customer',
          last_name:  user.user_metadata?.last_name  || '',
        })
        .select('id')
        .single();
      if (ce || !newCustomer) throw ce ?? new Error('Failed to create customer');
      customerId = newCustomer.id;
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setCurrentOrderNumber(orderNumber);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id:           store.id,
        customer_id:        customerId,
        order_number:       orderNumber,
        status:             'pending',
        financial_status:   'pending',
        fulfillment_status: 'unfulfilled',
        subtotal:           subtotalKES,
        tax:                0,
        shipping:           shippingKES,
        discount:           0,
        total:              totalKES,
        currency:           'KES',
        customer_email:     user.email,
        metadata:           { payment_method: 'PayPal', payment_status: 'pending' },
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) throw orderError ?? new Error('Failed to create order');

    const { error: itemsError } = await supabase.from('order_items').insert(
      safeCartItems.map(item => ({
        order_id:   order.id,
        product_id: item.productId,
        variant_id: item.variantId !== item.productId ? item.variantId : null,
        quantity:   item.quantity,
        price:      item.price,
        total:      item.price * item.quantity,
        title:      item.name,
        sku:        item.variantId,
        image_url:  item.image,
      }))
    );
    if (itemsError) throw itemsError;

    return orderNumber;
  };

  // ── Full checkout flow (replaces PayPal SDK) ───────────────────
 // In your CartPage component, replace handleCheckout with:
const handleCheckout = async () => {
  setError('');
  setIsProcessing(true);

  try {
    // 1️⃣ VALIDATE cart data FIRST
    const validItems = safeCartItems
      .filter(item => 
        item.name?.trim() && 
        Number.isFinite(item.price) && 
        item.price > 0 && 
        Number.isFinite(item.quantity) && 
        item.quantity > 0
      )
      .map(item => ({
        name: item.name.trim().slice(0, 100),
        sku: item.variantId?.slice(-8) || 'N/A',
        price: Math.max(0.01, Math.round(item.price * 100) / 100), // 2 decimals min $0.01
        quantity: Math.max(1, Math.min(999, Math.floor(item.quantity))),
      }));

    if (validItems.length === 0) {
      throw new Error('No valid items in cart');
    }

    console.log('🛒 Sending to PayPal:', {
      validItemsCount: validItems.length,
      firstItem: validItems[0],
      totalKES,
    });

    // 2️⃣ Create DB order
    const orderNumber = await createOrder();

    // 3️⃣ PayPal order with VALID data
    const createRes = await fetch('/api/payments/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderNumber,
        items: validItems,
        totalKES: Number(totalKES.toFixed(2)), // Exact 2 decimals
      }),
    });

    const createData = await createRes.json();
    
    if (!createData.success) {
      console.error('PayPal create error:', createData);
      throw new Error(createData.error || 'PayPal setup failed');
    }

    // 4️⃣ Redirect to PayPal
    window.location.href = createData.approvalUrl;

  } catch (err) {
    console.error('Checkout failed:', err);
    setError(err instanceof Error ? err.message : 'Checkout failed');
  } finally {
    setIsProcessing(false);
  }
};

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Loading your cart...</p>
            </div>
          </div>

        /* ── Empty state ── */
        ) : safeCartItems.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <Card className="max-w-md mx-auto border-border/50">
              <CardContent className="pt-10 pb-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-light mb-3">Your cart is empty</h3>
                <p className="text-muted-foreground mb-6 font-light text-sm sm:text-base">
                  Discover our amazing collection of products to start your journey.
                </p>
                <Button size="lg" onClick={() => router.push('/products')}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          </div>

        /* ── Cart ── */
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Cart items */}
            <div className="lg:col-span-8">
              <Card className="border-border/50">
                <CardHeader className="px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl font-light">
                      Shopping Cart ({safeCartItems.length})
                    </CardTitle>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="p-0">
                  <div className="divide-y">
                    {safeCartItems.map((item) => (
                      <div
                        key={item.variantId}
                        className="p-4 sm:p-6 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex gap-3 sm:gap-6">

                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted overflow-hidden relative">
                              <Image
                                src={item.image || '/api/placeholder/200/200'}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveItem(item.variantId)}
                              disabled={itemLoadingStates[item.variantId]}
                              className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7"
                            >
                              {itemLoadingStates[item.variantId]
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 sm:mb-3">
                              <h3 className="font-normal text-sm sm:text-base mb-1 line-clamp-2">
                                {item.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.variantId?.slice(-8) || 'N/A'}
                              </p>
                            </div>

                            {/*
                              On very small screens, stack price below qty controls.
                              On sm+, keep them side by side.
                            */}
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                              {/* Quantity controls */}
                              <div className="flex items-center border w-fit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                  onClick={() =>
                                    handleQuantityUpdate(item.variantId, item.quantity - 1)
                                  }
                                  disabled={
                                    itemLoadingStates[item.variantId] || item.quantity <= 1
                                  }
                                >
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <div className="w-10 sm:w-12 flex items-center justify-center">
                                  <span className="font-normal text-sm sm:text-base">
                                    {item.quantity}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                  onClick={() =>
                                    handleQuantityUpdate(item.variantId, item.quantity + 1)
                                  }
                                  disabled={itemLoadingStates[item.variantId]}
                                >
                                  {itemLoadingStates[item.variantId]
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Plus className="h-3 w-3 sm:h-4 sm:w-4" />}
                                </Button>
                              </div>

                              {/* Price */}
                              <div className="text-left sm:text-right">
                                <div className="text-base sm:text-xl font-light text-primary">
                                  {formatKES(item.price)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatKES(item.price * item.quantity)} total
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order summary — full-width on mobile, sticky sidebar on lg */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-24">
                <Card className="border-border/50">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl font-light flex items-center gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                      </div>
                      Order Summary
                    </CardTitle>
                  </CardHeader>

                  <Separator />

                  <CardContent className="space-y-4 pt-5 px-4 sm:px-6">
                    {/* Line items */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-normal">{formatKES(subtotalKES)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-normal">{formatKES(shippingKES)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-normal">Total</span>
                        <span className="text-xl sm:text-2xl font-light text-primary">
                          {formatKES(totalKES)}
                        </span>
                      </div>
                    </div>

                    {/* USD notice */}
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <AlertTitle className="text-blue-800 text-sm font-normal">
                        Payment in USD
                      </AlertTitle>
                      <AlertDescription className="text-xs text-blue-700">
                        You'll be charged approximately{' '}
                        <strong>{formatUSD(totalUSD)}</strong> USD. Final amount may vary
                        slightly based on your bank's exchange rate.
                      </AlertDescription>
                    </Alert>

                    {/* Error */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* CTA */}
                    {user ? (
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={isProcessing}
                        onClick={handleCheckout}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting to PayPal…
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Pay with PayPal · {formatUSD(totalUSD)}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => router.push('/auth/login?redirect=/cart')}
                      >
                        Login to Checkout
                      </Button>
                    )}

                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/products">Continue Shopping</Link>
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted p-3">
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span>Secure payment powered by PayPal</span>
                    </div>

                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      By completing your purchase you agree to our{' '}
                      <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
