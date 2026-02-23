import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server'; // server-side Supabase client

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`PayPal token error: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

async function capturePayPalOrder(paypalOrderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('PayPal capture error:', errText);
    throw new Error(`Capture failed: ${res.status}`);
  }

  return res.json();
}

// ── GET  — PayPal redirect after buyer approves ────────────────────────────
// URL shape: /api/payments/paypal/capture-order?token=<paypalOrderId>&PayerID=<...>
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paypalOrderId   = searchParams.get('token');
  const appUrl          = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (!paypalOrderId) {
    return NextResponse.redirect(`${appUrl}/cart?payment=error&reason=missing_token`);
  }

  try {
    const captureData = await capturePayPalOrder(paypalOrderId);
    const status      = captureData?.status; // 'COMPLETED' | 'PAYER_ACTION_REQUIRED' | …

    if (status !== 'COMPLETED') {
      return NextResponse.redirect(
        `${appUrl}/cart?payment=error&reason=not_completed`
      );
    }

    // Pull our internal order number from the reference_id we set at creation
    const referenceId =
      captureData?.purchase_units?.[0]?.reference_id as string | undefined;

    // Update DB: mark order as paid
    const supabase = createClient();
    if (referenceId) {
      await supabase
        .from('orders')
        .update({
          financial_status: 'paid',
          status:           'confirmed',
          metadata: {
            payment_method:  'PayPal',
            payment_status:  'completed',
            paypal_order_id: paypalOrderId,
            captured_at:     new Date().toISOString(),
          },
        })
        .eq('order_number', referenceId);
    }

    // Redirect buyer to confirmation page
    return NextResponse.redirect(
      `${appUrl}/orders/${referenceId ?? ''}?payment=success`
    );

  } catch (error) {
    console.error('GET capture-order error:', error);
    return NextResponse.redirect(`${appUrl}/cart?payment=error&reason=capture_failed`);
  }
}

// ── POST — programmatic capture (optional, for future use) ─────────────────
export async function POST(req: NextRequest) {
  try {
    const { orderID } = await req.json();
    if (!orderID) {
      return NextResponse.json(
        { success: false, error: 'Missing orderID' },
        { status: 400 }
      );
    }

    const captureData = await capturePayPalOrder(orderID);

    if (captureData?.status !== 'COMPLETED') {
      throw new Error(`Unexpected capture status: ${captureData?.status}`);
    }

    const referenceId =
      captureData?.purchase_units?.[0]?.reference_id as string | undefined;

    const supabase = createClient();
    if (referenceId) {
      await supabase
        .from('orders')
        .update({
          financial_status: 'paid',
          status:           'confirmed',
          metadata: {
            payment_method:  'PayPal',
            payment_status:  'completed',
            paypal_order_id: orderID,
            captured_at:     new Date().toISOString(),
          },
        })
        .eq('order_number', referenceId);
    }

    return NextResponse.json({ success: true, orderNumber: referenceId });

  } catch (error) {
    console.error('POST capture-order error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Capture failed' },
      { status: 500 }
    );
  }
}
