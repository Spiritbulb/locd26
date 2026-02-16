import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { convertKEStoUSD } from '@/lib/currency';

const paypal = require('@paypal/checkout-server-sdk');

function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, items, totalKES } = body;

        if (!orderId || !items || !totalKES) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('order_number', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Convert KES amounts to USD
        const totalUSD = convertKEStoUSD(parseFloat(totalKES));
        const subtotalUSD = convertKEStoUSD(parseFloat(order.subtotal));
        const shippingUSD = convertKEStoUSD(parseFloat(order.shipping || 0));
        const taxUSD = convertKEStoUSD(parseFloat(order.tax || 0));

        // Create PayPal order request
        const paypalRequest = new paypal.orders.OrdersCreateRequest();
        paypalRequest.prefer('return=representation');
        paypalRequest.requestBody({
            intent: 'CAPTURE',
            application_context: {
                brand_name: 'Your Store Name',
                landing_page: 'BILLING',
                user_action: 'PAY_NOW',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?payment=cancelled`
            },
            purchase_units: [
                {
                    reference_id: orderId,
                    description: `Order #${orderId}`,
                    custom_id: orderId,
                    soft_descriptor: 'Your Store',
                    amount: {
                        currency_code: 'USD',
                        value: totalUSD.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: 'USD',
                                value: subtotalUSD.toFixed(2)
                            },
                            shipping: {
                                currency_code: 'USD',
                                value: shippingUSD.toFixed(2)
                            },
                            tax_total: {
                                currency_code: 'USD',
                                value: taxUSD.toFixed(2)
                            }
                        }
                    },
                    items: items.map((item: any) => {
                        const priceUSD = convertKEStoUSD(parseFloat(item.price));
                        return {
                            name: item.name,
                            description: item.description || item.name,
                            sku: item.sku || item.id,
                            unit_amount: {
                                currency_code: 'USD',
                                value: priceUSD.toFixed(2)
                            },
                            quantity: item.quantity.toString()
                        };
                    })
                }
            ]
        });

        // Execute PayPal request
        const paypalResponse = await client().execute(paypalRequest);

        // Update order with PayPal order ID and USD amount
        await supabase
            .from('orders')
            .update({
                metadata: {
                    ...order.metadata,
                    paypal_order_id: paypalResponse.result.id,
                    payment_method: 'PayPal',
                    payment_status: 'pending',
                    amount_kes: totalKES,
                    amount_usd: totalUSD.toFixed(2),
                    exchange_rate: (totalUSD / parseFloat(totalKES)).toFixed(4)
                }
            })
            .eq('id', order.id);

        // Create payment transaction record with both currencies
        await supabase
            .from('payment_transactions')
            .insert({
                order_id: order.id,
                store_id: order.store_id,
                provider: 'paypal',
                transaction_id: paypalResponse.result.id,
                amount: totalUSD, // Store USD amount
                currency: 'USD',
                status: 'pending',
                metadata: {
                    paypal_order_id: paypalResponse.result.id,
                    payer_id: null,
                    amount_kes: totalKES,
                    amount_usd: totalUSD.toFixed(2),
                    exchange_rate: (totalUSD / parseFloat(totalKES)).toFixed(4)
                }
            });

        return NextResponse.json({
            success: true,
            orderID: paypalResponse.result.id,
            amountKES: totalKES,
            amountUSD: totalUSD.toFixed(2)
        });

    } catch (error) {
        console.error('PayPal create order error:', error);
        return NextResponse.json(
            {
                error: 'Payment initialization failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
