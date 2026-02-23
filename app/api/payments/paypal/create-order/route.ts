import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

// Exchange a client_id + secret for a bearer token
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
    throw new Error(`PayPal token error: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, items, totalKES } = await req.json();

    if (!orderId || !items || !totalKES) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // Build per-item breakdown for PayPal
    // We pass prices as USD; convertKEStoUSD is a server-side helper here
    const KES_TO_USD = parseFloat(process.env.KES_TO_USD_RATE ?? '0.0077');

    const itemBreakdown = (items as any[]).map((item) => ({
      name:        item.name.slice(0, 127),
      sku:         (item.sku ?? '').slice(0, 127),
      unit_amount: {
        currency_code: 'USD',
        value: (item.price * KES_TO_USD).toFixed(2),
      },
      quantity: String(item.quantity),
    }));

    const itemTotal = (
      (items as any[]).reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ) * KES_TO_USD
    ).toFixed(2);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id:  orderId,
          description:   `Order ${orderId}`,
          amount: {
            currency_code: 'USD',
            value:         itemTotal,
            breakdown: {
              item_total: { currency_code: 'USD', value: itemTotal },
            },
          },
          items: itemBreakdown,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name:               process.env.NEXT_PUBLIC_STORE_NAME ?? 'Our Store',
            locale:                   'en-US',
            landing_page:             'LOGIN',
            user_action:              'PAY_NOW',
            // After the buyer approves, PayPal GETs this URL with ?token=<paypalOrderId>
            return_url: `${appUrl}/api/payments/paypal/capture-order`,
            cancel_url: `${appUrl}/cart?payment=cancelled`,
          },
        },
      },
    };

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': orderId, // idempotency key
      },
      body: JSON.stringify(body),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error('PayPal create-order error:', errText);
      throw new Error(`PayPal order creation failed: ${orderRes.status}`);
    }

    const orderData = await orderRes.json();

    // Find the payer-action link (the URL we redirect the buyer to)
    const approvalLink = (orderData.links as any[]).find(
      (l) => l.rel === 'payer-action'
    );

    return NextResponse.json({
      success:     true,
      orderID:     orderData.id,
      approvalUrl: approvalLink?.href,
    });

  } catch (error) {
    console.error('create-order route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
