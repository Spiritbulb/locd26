import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, totalKES } = await req.json();

    console.log('🛒 PayPal create-order:', { orderId, itemCount: items?.length, totalKES });

    if (!orderId || !Array.isArray(items) || items.length === 0 || !totalKES) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId, items, or totalKES' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    const KES_TO_USD = 0.0077; // KES 130 = $1 USD
    const orderTotalUSD = (Number(totalKES) * KES_TO_USD).toFixed(2);

    // ✅ VALID PayPal items (PayPal is EXTREMELY strict)
    const paypalItems = items.slice(0, 250).map((item: any, index: number) => ({
      name: (item.name || `Item ${index + 1}`).slice(0, 127).trim(),
      sku: (item.sku || `SKU${index + 1}`).slice(0, 64) || undefined,
      unit_amount: {
        currency_code: 'USD',
        value: (item.price * KES_TO_USD).toFixed(2),
      },
      quantity: String(Math.max(1, Math.min(999, item.quantity))),
    }));

    const itemsTotalUSD = paypalItems
      .reduce((sum, item) => sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity), 0)
      .toFixed(2);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const body = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId.slice(0, 32),
        description: `Order ${orderId.slice(0, 127)}`,
        amount: {
          currency_code: 'USD',
          value: orderTotalUSD,
          breakdown: {
            item_total: { currency_code: 'USD', value: itemsTotalUSD },
            shipping: { currency_code: 'USD', value: '0.00' },
            tax_total: { currency_code: 'USD', value: '0.00' },
          },
        },
        items: paypalItems,
      }],
      application_context: {
        return_url: `${appUrl}/api/payments/paypal/capture-order`,
        cancel_url: `${appUrl}/cart?payment=cancelled`,
        brand_name: process.env.NEXT_PUBLIC_STORE_NAME?.slice(0, 127) || "Loc'd Essence",
        locale: 'en-US',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
      },
    };

    console.log('💰 PayPal totals:', { orderTotalUSD, itemsTotalUSD, kesTotal: totalKES });

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      },
      body: JSON.stringify(body),
    });

    const orderText = await orderRes.text();
    
    if (!orderRes.ok) {
      console.error('❌ PayPal ERROR', orderRes.status, orderText);
      try {
        const errorData = JSON.parse(orderText);
        return NextResponse.json({
          success: false,
          error: `PayPal ${orderRes.status}: ${errorData.message || JSON.stringify(errorData.details)}`,
          debug: { orderTotalUSD, itemsTotalUSD },
        }, { status: orderRes.status });
      } catch {
        return NextResponse.json({
          success: false,
          error: `PayPal ${orderRes.status}: ${orderText.slice(0, 300)}`,
        }, { status: orderRes.status });
      }
    }

    const orderData = JSON.parse(orderText);
    const approvalLink = orderData.links?.find((l: any) => l.rel === 'payer-action' || l.rel === 'approve');

    return NextResponse.json({
      success: true,
      orderID: orderData.id,
      approvalUrl: approvalLink?.href,
    });

  } catch (error) {
    console.error('💥 Paypal create-order failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Server error',
    }, { status: 500 });
  }
}