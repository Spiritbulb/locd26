'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Loader2, Plus, Minus, Trash2, ShoppingBag, Shield, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { convertKEStoUSD, formatKES, formatUSD } from '@/lib/currency';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!loading && cartItems.length > 0) {
      refreshCart();
    }
  }, []);

  const handleQuantityUpdate = async (lineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(lineId);
      return;
    }
    await updateCartLine(lineId, newQuantity);
  };

  const handleRemoveItem = async (lineId: string) => {
    await removeFromCart(lineId);
  };

  const createOrder = async () => {
    if (!user) {
      setError('Please log in to complete your order');
      router.push('/login?redirect=/cart');
      return;
    }

    if (safeCartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!STORE_SLUG) {
      setError('Store configuration error');
      return;
    }

    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', STORE_SLUG)
        .eq('is_active', true)
        .single();

      if (storeError || !store) {
        throw new Error('Store not found');
      }

      let customerId = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', store.id)
        .eq('email', user.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            store_id: store.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Customer',
            last_name: user.user_metadata?.last_name || '',
          })
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setCurrentOrderNumber(orderNumber);

      const subtotal = safeCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = 0;
      const total = subtotal + shipping;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store.id,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          financial_status: 'pending',
          fulfillment_status: 'unfulfilled',
          subtotal: subtotal,
          tax: 0,
          shipping: shipping,
          discount: 0,
          total: total,
          currency: 'KES',
          customer_email: user.email,
          metadata: {
            payment_method: 'PayPal',
            payment_status: 'pending'
          }
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      const orderItems = safeCartItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId !== item.productId ? item.variantId : null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        title: item.name,
        sku: item.variantId,
        image_url: item.image
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderNumber;

    } catch (error) {
      console.error('Order creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create order');
      throw error;
    }
  };

  const subtotalKES = safeCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingKES = 0;
  const totalKES = subtotalKES + shippingKES;

  const totalUSD = convertKEStoUSD(totalKES);
  const subtotalUSD = convertKEStoUSD(subtotalKES);

  const paypalInitialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: 'USD',
    intent: 'capture',
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground font-light">Loading your cart...</p>
            </div>
          </div>
        ) : safeCartItems.length === 0 ? (
          <div className="text-center py-20">
            <Card className="max-w-md mx-auto border-border/50">
              <CardContent className="pt-12 pb-12">
                <div className="w-20 h-20 bg-muted flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-light mb-3">Your cart is empty</h3>
                <p className="text-muted-foreground mb-6 font-light">
                  Discover our amazing collection of products to start your journey.
                </p>
                <Button size="lg" onClick={() => router.push('/products')}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-light">
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
                      <div key={item.variantId} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex gap-6">
                          <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 bg-muted overflow-hidden relative">
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
                              className="absolute -top-2 -right-2 h-7 w-7"
                            >
                              {itemLoadingStates[item.variantId] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-3">
                              <h3 className="font-normal text-base mb-1 line-clamp-2">{item.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.variantId?.slice(-8) || 'N/A'}
                              </p>
                            </div>

                            <div className="flex items-end justify-between gap-4">
                              <div className="flex items-center border">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuantityUpdate(item.variantId, item.quantity - 1)}
                                  disabled={itemLoadingStates[item.variantId] || item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="w-12 flex items-center justify-center">
                                  <span className="font-normal text-base">{item.quantity}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleQuantityUpdate(item.variantId, item.quantity + 1)}
                                  disabled={itemLoadingStates[item.variantId]}
                                >
                                  {itemLoadingStates[item.variantId] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="text-right">
                                <div className="text-xl font-light text-primary">
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

            {/* Checkout Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl font-light flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-primary-foreground" />
                      </div>
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="space-y-4 pt-6">
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
                        <span className="text-lg font-normal">Total</span>
                        <span className="text-2xl font-light text-primary">
                          {formatKES(totalKES)}
                        </span>
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 text-sm font-normal">
                        Payment in USD
                      </AlertTitle>
                      <AlertDescription className="text-xs text-blue-700">
                        You'll be charged approximately <strong>{formatUSD(totalUSD)}</strong> USD.
                        Final amount may vary slightly based on your bank's exchange rate.
                      </AlertDescription>
                    </Alert>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    )}

                    {user ? (
                      <PayPalScriptProvider options={paypalInitialOptions}>
                        <PayPalButtons
                          style={{ layout: 'vertical', label: 'pay' }}
                          createOrder={async () => {
                            try {
                              const orderNumber = await createOrder();

                              const response = await fetch('/api/payments/paypal/create-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  orderId: orderNumber,
                                  items: safeCartItems.map(item => ({
                                    name: item.name,
                                    sku: item.variantId,
                                    price: item.price,
                                    quantity: item.quantity
                                  })),
                                  totalKES: totalKES.toFixed(2)
                                })
                              });

                              const data = await response.json();
                              if (!data.success) {
                                throw new Error(data.error || 'Failed to create PayPal order');
                              }

                              return data.orderID;
                            } catch (error) {
                              console.error('Error creating PayPal order:', error);
                              setError(error instanceof Error ? error.message : 'Failed to initialize payment');
                              throw error;
                            }
                          }}
                          onApprove={async (data) => {
                            try {
                              setIsProcessing(true);

                              const response = await fetch('/api/payments/paypal/capture-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderID: data.orderID })
                              });

                              const captureData = await response.json();

                              if (!captureData.success) {
                                throw new Error(captureData.error || 'Payment capture failed');
                              }

                              clearCart();
                              router.push(`/orders/${currentOrderNumber}?payment=success`);
                            } catch (error) {
                              console.error('Error capturing PayPal payment:', error);
                              setError(error instanceof Error ? error.message : 'Payment failed');
                              setIsProcessing(false);
                            }
                          }}
                          onError={(err) => {
                            console.error('PayPal error:', err);
                            setError('Payment failed. Please try again.');
                          }}
                        />
                      </PayPalScriptProvider>
                    ) : (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => router.push('/login?redirect=/cart')}
                      >
                        Login to Checkout
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                    >
                      <Link href="/products">
                        Continue Shopping
                      </Link>
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted p-3">
                      <Shield className="w-4 h-4" />
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