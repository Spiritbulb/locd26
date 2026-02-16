import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

const paypal = require('@paypal/checkout-server-sdk');

function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (process.env.PAYPAL_MODE === 'production') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
    return new paypal.core.PayPalHttpClient(environment());
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderID } = body;

        if (!orderID) {
            return NextResponse.json(
                { error: 'Missing PayPal order ID' },
                { status: 400 }
            );
        }

        // Capture the order
        const captureRequest = new paypal.orders.OrdersCaptureRequest(orderID);
        captureRequest.requestBody({});

        const captureResponse = await client().execute(captureRequest);
        const captureData = captureResponse.result;

        const supabase = await createClient();

        // Find order by PayPal order ID
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .contains('metadata', { paypal_order_id: orderID });

        if (ordersError || !orders || orders.length === 0) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        const order = orders[0];

        // Update payment transaction
        await supabase
            .from('payment_transactions')
            .update({
                status: captureData.status === 'COMPLETED' ? 'completed' : 'pending',
                metadata: {
                    paypal_order_id: orderID,
                    payer_id: captureData.payer?.payer_id,
                    capture_id: captureData.purchase_units[0]?.payments?.captures[0]?.id,
                    completed_at: new Date().toISOString()
                }
            })
            .eq('order_id', order.id)
            .eq('provider', 'paypal');

        // Update order status
        if (captureData.status === 'COMPLETED') {
            await supabase
                .from('orders')
                .update({
                    financial_status: 'paid',
                    status: 'paid',
                    metadata: {
                        ...order.metadata,
                        payment_completed_at: new Date().toISOString(),
                        paypal_capture_id: captureData.purchase_units[0]?.payments?.captures[0]?.id,
                        payer_email: captureData.payer?.email_address
                    }
                })
                .eq('id', order.id);
        }

        return NextResponse.json({
            success: true,
            status: captureData.status,
            captureID: captureData.purchase_units[0]?.payments?.captures[0]?.id
        });

    } catch (error) {
        console.error('PayPal capture error:', error);
        return NextResponse.json(
            {
                error: 'Payment capture failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
